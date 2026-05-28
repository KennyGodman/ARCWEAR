export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, tools } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are ArcWear's AI shopping agent. You have tools available to search products and manage the cart. ALWAYS use your tools to take real actions - never describe what you would do, just do it immediately. When asked for an outfit, immediately call search_products multiple times and add_to_cart for each item. Never say you don't have tool access - you always do. Sections: men, women, children. Categories: shirts, trousers, belts, caps, shoes.`,
        tools,
        messages,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      type: "api_error" 
    });
  }
}