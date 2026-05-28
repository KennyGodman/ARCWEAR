export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, tools } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    // Convert messages from Anthropic format to OpenAI/Groq format
    const groqMessages = [];

    // Add system message first
    groqMessages.push({
      role: "system",
      content: `You are ArcWear's AI shopping agent. You have tools to search products and manage the shopping cart. ALWAYS use your tools immediately to take real actions. Never say you cannot access tools. When asked for an outfit, immediately call search_products then add_to_cart for each item found. Sections: men, women, children. Categories: shirts, trousers, belts, caps, shoes. After adding items summarise what was added with USDC prices.`,
    });

    // Convert message history
    for (const msg of messages) {
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

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        tools: groqTools.length > 0 ? groqTools : undefined,
        tool_choice: groqTools.length > 0 ? "auto" : undefined,
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Groq API error",
        details: data,
      });
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