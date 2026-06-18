function getSafeMessagesSlice(messages, limit = 10) {
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

  const { messages, tools, allowance, wallet, wishlist } = req.body;
  const slicedMessages = getSafeMessagesSlice(messages, 10);

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    // Convert messages from Anthropic format to OpenAI/Groq format
    const groqMessages = [];

    const walletStr = wallet ? wallet : "Not Connected";
    const allowanceStr = allowance !== undefined && allowance !== null ? `${allowance} USDC` : "0 USDC";
    const wishlistItems = Array.isArray(wishlist) ? wishlist : [];
    const wishlistStr = wishlistItems.length > 0
      ? wishlistItems.map(item => `${item.name} (${item.price} USDC, ID: ${item.id})`).join(", ")
      : "No items in wishlist";

    // Add system message first
    groqMessages.push({
      role: "system",
      content: `You are ArcWear's autonomous AI shopping agent on Arc Blockchain (Circle L1).

CURRENT USER STATUS:
- Connected Wallet: ${walletStr}
- Pre-approved USDC Allowance: ${allowanceStr}
- User's Wishlist: ${wishlistStr}

CORE TOOLS:
- search_products: Search the catalogue by section (men/women/children), category, price, keywords
- add_to_cart: Add a product to the user's cart by ID
- view_cart: See current cart contents and total
- remove_from_cart: Remove a product from the cart
- initiate_checkout: Open the standard checkout flow (requires wallet popup)

AUTONOMOUS TOOLS:
- check_allowance: Check if user has pre-approved USDC spending for you. Call this before any autonomous checkout.
- request_approval: Ask user to approve a USDC spending allowance so you can purchase without wallet popups. Use when allowance is 0 or insufficient.
- agent_checkout: Execute checkout using the pre-approved USDC allowance — INSTANT, NO wallet popup. Only works when allowance >= cart total.
- create_reorder: Set up automatic reorder for a product at a regular interval. The user will receive a confirmation notification before each reorder executes.
- add_to_wishlist: Add a product to the user's wishlist by ID.
- remove_from_wishlist: Remove a product from the user's wishlist by ID.
- view_wishlist: View the user's wishlist contents.

CHECKOUT FLOW (IMPORTANT):
1. Look at the pre-approved USDC Allowance provided under CURRENT USER STATUS. If the allowance is 0 or less than the cart total, do NOT call 'check_allowance' or 'agent_checkout'. Instead, immediately call the 'request_approval' tool to request a spending allowance from the user.
2. If allowance >= cart total:
   - Immediately call the 'agent_checkout' tool to execute the purchase autonomously. Do NOT call 'initiate_checkout' unless the user explicitly requests manual checkout.
3. If allowance is 0 or insufficient (allowance < cart total):
   - You MUST immediately call the 'request_approval' tool with an appropriate amount (e.g. 500 USDC or cart total) to pop up the Agent Approval modal. Do NOT just suggest it in text; call the tool directly so the modal appears for the user.
4. Only call 'initiate_checkout' (traditional manual checkout) if the user explicitly asks to pay manually or refuses to use the AI Agent checkout.

REORDER RULES:
- When setting up reorders, clearly state: product, interval, max price guard
- Reorders send a confirmation notification BEFORE executing — user has 24h to cancel
- Be proactive: if a user buys the same item repeatedly, suggest a reorder

WISHLIST RULES:
- Under CURRENT USER STATUS, you can see the user's wishlist of products.
- When the user asks for suggestions, recommendations, or outfit looks, you MUST reference items in their wishlist if they are relevant, or recommend matching items that complement the wishlisted products.
- If the user asks to add or remove items from the wishlist, you MUST call 'add_to_wishlist' or 'remove_from_wishlist' tool respectively. Do not just say you are doing it in text.

TOOL CALLING RULES (CRITICAL):
1. Whenever you want to search products, add items to the cart, view the cart, remove items from the cart, checkout, or request allowance approvals, or manage the wishlist, you MUST call the corresponding tool. Do NOT just write in text that you are doing it. You must generate the tool call block so the system actually performs the action.
2. If you state "Adding X to cart" or "I'll add X to your cart", you MUST emit the 'add_to_cart' tool call for that item. Do not pretend to add items without calling the tool.

TONE: Helpful, concise, confident. Always show USDC prices. After adding items, summarise with prices.`,
    });

    // Convert message history
    for (const msg of slicedMessages) {
      if (msg.role === "user") {
        // Handle tool results in user messages (Anthropic format)
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_result") {
              groqMessages.push({
                role: "tool",
                tool_call_id: block.tool_use_id,
                content: typeof block.content === "string"
                  ? block.content
                  : JSON.stringify(block.content),
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
      "llama-3.1-8b-instant"
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
            const retryAfterMs = (() => {
              const header = response.headers.get("retry-after");
              if (header) return parseFloat(header) * 1000;
              const match = data.error?.message?.match(/(\d+(?:\.\d+)?)\s*s/);
              if (match) return parseFloat(match[1]) * 1000;
              return (attempt + 1) * 1500;
            })();
            console.warn(`[agent] Model ${model} rate limited (429). Retrying in ${retryAfterMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await new Promise(r => setTimeout(r, Math.min(retryAfterMs + 200, 15000)));
            continue;
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