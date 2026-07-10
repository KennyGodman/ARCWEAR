function getSafeMessagesSlice(messages, limit = 4) {
  if (!Array.isArray(messages) || messages.length <= limit) return messages;
  
  let startIndex = messages.length - limit;
  
  // Ensure we don't slice in the middle of a tool call/response pair.
  // If the first message in our slice is a user message containing tool results,
  // we must move startIndex backward to include the assistant message that called the tool.
  while (startIndex > 0) {
    const msg = messages[startIndex];
    if (msg.role === "user" && Array.isArray(msg.content) && msg.content.some(b => b.type === "tool_result")) {
      startIndex--;
    } else {
      break;
    }
  }
  
  return messages.slice(startIndex);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    messages, tools, allowance, wallet, wishlist, cart, customerEmail,
    fulfillmentMethod, deliveryAddress, pickupLocation,
    deliveryFullName, deliveryPhone, deliveryAddressLine,
    deliveryCity, deliveryState, deliveryNotes, deliveryFee
  } = req.body;
  const slicedMessages = getSafeMessagesSlice(messages, 4);

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    // Convert messages from Anthropic format to OpenAI/Groq format
    const groqMessages = [];

    const walletStr = wallet ? wallet : "Not Connected";
    const allowanceStr = allowance !== undefined && allowance !== null ? `${allowance} USDC` : "0 USDC";
    const emailStr = customerEmail ? customerEmail : "Not Configured";
    const wishlistItems = Array.isArray(wishlist) ? wishlist : [];
    const wishlistStr = wishlistItems.length > 0
      ? wishlistItems.map(item => `${item.name} (${item.price} USDC, ID: ${item.id})`).join(", ")
      : "No items in wishlist";
    const cartItems = Array.isArray(cart) ? cart : [];
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartStr = cartItems.length > 0
      ? cartItems.map(item => `${item.name} (Qty: ${item.qty}, Price: ${item.price} USDC)`).join(", ") + ` — Total: ${cartTotal} USDC`
      : "Empty";

    // Add system message first
    groqMessages.push({
      role: "system",
      content: `You are ArcWear's autonomous AI shopping agent on Arc Blockchain (Circle L1).
      
CURRENT USER STATUS:
- Connected Wallet: ${walletStr}
- Pre-approved USDC Allowance: ${allowanceStr}
- Customer Email: ${emailStr}
- Current Cart: ${cartStr}
- User's Wishlist: ${wishlistStr}
- Fulfillment Method: ${fulfillmentMethod ? fulfillmentMethod.toUpperCase() : "DELIVERY"}
- Store Pickup Location: ${pickupLocation ? pickupLocation : "Not Set"}
- Shipping/Delivery Details:
  - Full Name: ${deliveryFullName || "Not Set"}
  - Phone: ${deliveryPhone || "Not Set"}
  - Street Address: ${deliveryAddressLine || "Not Set"}
  - City: ${deliveryCity || "Not Set"}
  - State/Zone: ${deliveryState || "Not Set"}
  - Notes: ${deliveryNotes || "None"}
  - Delivery Fee: ${deliveryFee ? `${deliveryFee} USDC` : "0.00 USDC"}

CHECKOUT FLOW (AGENT-ONLY, NO MANUAL CHECKOUT):
All purchases must go through the autonomous agent path. Never call 'initiate_checkout'.
1. Check pre-approved USDC Allowance.
   - If allowance >= cart total: immediately call 'agent_checkout' to execute purchase. No wallet popup.
   - If allowance < cart total: immediately call 'request_approval' with cart total or 500 USDC. Call the tool directly so the modal appears.
2. NEVER call 'initiate_checkout' or 'check_allowance'.
3. On 'agent_checkout' success, report the txHash and confirm purchase.

SIZE RULES:
- Ask user for size (XS, S, M, L, XL, XXL) for fashion/clothing items before adding to cart or checkout. Do not assume. Pass it to 'add_to_cart'.

FULFILLMENT RULES:
- Ensure fulfillment is set before checkout.
- If 'delivery', prompt for missing fields (Name, Phone, Address, City, State) and call 'set_fulfillment_details'.
- Delivery Fee: Lagos 5.00, Abuja 8.00, Rivers 10.00, other 6.00 USDC.
- If 'pickup', prompt for store location. Default to 'delivery'.

REORDERS & WISHLIST:
- Suggest reorders for repeated items (notify 24h before execution).
- Use add_to_wishlist / remove_from_wishlist. Reference wishlist items in recommendations.

TOOL CALLS:
- You MUST call the corresponding tool when searching, adding/removing, checkout, wishlist, or updating fulfillment. Do not just write it in text. If search finds 0 results, do not retry; explain in text.`,
    });

    // Convert message history with token pruning for older tool results
    const totalMsgs = slicedMessages.length;
    for (let idx = 0; idx < totalMsgs; idx++) {
      const msg = slicedMessages[idx];

      if (msg.role === "user") {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_result") {
              let contentStr = typeof block.content === "string"
                ? block.content
                : JSON.stringify(block.content);

              // Keep search results extremely small to fit in token limits
              if (contentStr.includes("products")) {
                try {
                  const parsed = JSON.parse(contentStr);
                  if (parsed.products && Array.isArray(parsed.products)) {
                    parsed.products = parsed.products.slice(0, 3); // only keep top 3 results
                    contentStr = JSON.stringify(parsed);
                  }
                } catch (e) {
                  // Ignore
                }
              }

              groqMessages.push({
                role: "tool",
                tool_call_id: block.tool_use_id,
                content: contentStr,
              });
            }
          }
        } else {
          groqMessages.push({ role: "user", content: msg.content });
        }
      } else if (msg.role === "assistant") {
        // Handle assistant messages with tool calls (Anthropic format)
        if (Array.isArray(msg.content)) {
          const textContent = msg.content
            .filter(b => b.type === "text")
            .map(b => b.text)
            .join("");
          const toolCalls = msg.content
            .filter(b => b.type === "tool_use")
            .map(b => ({
              id: b.id,
              type: "function",
              function: {
                name: b.name,
                arguments: JSON.stringify(b.input),
              },
            }));

          const assistantMsg = { role: "assistant" };
          if (textContent) assistantMsg.content = textContent;
          if (toolCalls.length > 0) assistantMsg.tool_calls = toolCalls;
          groqMessages.push(assistantMsg);
        } else {
          groqMessages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Convert tools from Anthropic format to OpenAI/Groq format
    const groqTools = (tools || []).map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema || { type: "object", properties: {} },
      },
    }));

    // Call Groq API with fallback and retry logic
    const candidateModels = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3.6-27b"
    ];

    let lastError = null;
    let data = null;
    let response = null;
    let successfulModel = null;

    for (const model of candidateModels) {
      console.log(`[agent] Attempting chat completion with model: ${model}`);
      const MAX_RETRIES = 3;
      let modelSucceeded = false;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: groqMessages,
              tools: groqTools.length > 0 ? groqTools : undefined,
              tool_choice: groqTools.length > 0 ? "auto" : undefined,
              max_tokens: 1000,
              temperature: 0.3,
            }),
          });

          data = await response.json();

          if (response.status === 429) {
            console.warn(`[agent] Model ${model} rate limited (429). Details: ${JSON.stringify(data.error || data)}. Falling back to next model immediately.`);
            break; // Break retry loop to try next model immediately
          }

          if (!response.ok) {
            throw new Error(data.error?.message || `API error (${response.status})`);
          }

          modelSucceeded = true;
          successfulModel = model;
          break; // success
        } catch (err) {
          console.error(`[agent] Attempt with model ${model} failed on attempt ${attempt + 1}:`, err.message);
          lastError = err;
        }
      }

      if (modelSucceeded) {
        console.log(`[agent] Successfully generated response using model: ${successfulModel}`);
        break;
      }
    }

    if (!successfulModel) {
      console.error("[agent] All models failed. Last error:", lastError?.message);
      return res.status(500).json({ error: lastError?.message || "All Groq models failed" });
    }

    const message = data.choices?.[0]?.message;

    if (!message) {
      return res.status(500).json({ error: "No response from Groq" });
    }

    // Convert Groq response back to Anthropic format for frontend
    const content = [];

    if (message.content) {
      content.push({ type: "text", text: message.content });
    }

    if (message.tool_calls?.length > 0) {
      for (const tc of message.tool_calls) {
        let input = {};
        try {
          input = JSON.parse(tc.function.arguments || "{}");
        } catch (e) {
          input = {};
        }
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input,
        });
      }
    }

    return res.status(200).json({ content });

  } catch (error) {
    console.error("Agent error:", error);
    return res.status(500).json({ error: error.message });
  }
}