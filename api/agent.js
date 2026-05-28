export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, tools } = req.body;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are ArcWear's AI shopping agent. You have tools to search products and manage the cart. ALWAYS use tools to take real actions immediately. Never describe what you would do — just do it. When asked for an outfit, search and add multiple items right away. Summarise with USDC totals. Sections: men, women, children. Categories: shirts, trousers, belts, caps, shoes.`
          },
          ...messages
        ],
        tools: tools?.map(t => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema,
          }
        })) || [],
        tool_choice: "auto",
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Groq API error" });
    }

    // Convert Groq response format to match what frontend expects
    const message = data.choices?.[0]?.message;
    const content = [];

    if (message?.content) {
      content.push({ type: "text", text: message.content });
    }

    if (message?.tool_calls?.length) {
      for (const tc of message.tool_calls) {
        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments || "{}"),
        });
      }
    }

    return res.status(200).json({ content });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}