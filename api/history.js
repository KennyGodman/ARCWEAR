// api/history.js — Persistent chat history handler using Vercel KV.

let _kv = null;

async function getKV() {
  if (_kv) return _kv;
  try {
    const pkg = "@vercel/kv";
    const { kv } = await import(/* @vite-ignore */ pkg);
    _kv = kv;
    return _kv;
  } catch {
    // Dev fallback — in-memory store (resets on server restart)
    if (!global.__agentHistory) global.__agentHistory = {};
    _kv = {
      async get(key)      { return global.__agentHistory[key] ?? null; },
      async set(key, val) { global.__agentHistory[key] = val; },
      async del(key)      { delete global.__agentHistory[key]; }
    };
    return _kv;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const kv = await getKV();

    // ── GET /api/history?wallet=0x... — Fetch chat history ─────────────────
    if (req.method === "GET") {
      const { wallet } = req.query;
      if (!wallet) return res.status(400).json({ error: "wallet query param required" });
      
      const key = `chat-history:${wallet.toLowerCase()}`;
      const messages = await kv.get(key);
      return res.status(200).json({ messages: messages || [] });
    }

    // ── POST /api/history — Save chat history ──────────────────────────────
    if (req.method === "POST") {
      const { wallet, messages } = req.body;
      if (!wallet || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Required fields: wallet, messages (array)" });
      }

      const key = `chat-history:${wallet.toLowerCase()}`;
      // Store complete list (max length safety check to avoid memory issues)
      const sanitizedMessages = messages.slice(-50); // limit to last 50 messages for sanity
      await kv.set(key, sanitizedMessages);
      
      return res.status(200).json({ success: true, count: sanitizedMessages.length });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[history api] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
