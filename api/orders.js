import crypto from "crypto";

// ── Storage adapter ───────────────────────────────────────────────────────────
let _kv = null;

async function getKV() {
  if (_kv) return _kv;
  try {
    const { kv } = await import("@vercel/kv");
    _kv = kv;
    return _kv;
  } catch {
    // Dev fallback — in-memory store (resets on cold start)
    if (!global.__agentOrders) global.__agentOrders = {};
    _kv = {
      async get(key)         { return global.__agentOrders[key] ?? null; },
      async set(key, val)    { global.__agentOrders[key] = val; },
      async del(key)         { delete global.__agentOrders[key]; },
      // smembers / sadd / srem simulate a Redis Set with an array in JSON
      async smembers(key)    { return global.__agentOrders[key] ?? []; },
      async sadd(key, val)   {
        const s = new Set(global.__agentOrders[key] ?? []);
        s.add(val); global.__agentOrders[key] = [...s];
      },
      async srem(key, val)   {
        const s = new Set(global.__agentOrders[key] ?? []);
        s.delete(val); global.__agentOrders[key] = [...s];
      },
    };
    return _kv;
  }
}

// ── CRUD Helpers ──────────────────────────────────────────────────────────────

async function createOrder(data) {
  const kv = await getKV();
  const id = crypto.randomUUID();
  const order = {
    id,
    userWallet: data.userWallet.toLowerCase(),
    items: data.items,
    total: Number(data.total),
    txHash: data.txHash,
    customerEmail: data.customerEmail || null,
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
  };
  await kv.set(`order:${id}`, order);
  await kv.sadd(`wallet-orders:${order.userWallet}`, id);
  return order;
}

async function listOrders(wallet) {
  const kv = await getKV();
  const ids = await kv.smembers(`wallet-orders:${wallet.toLowerCase()}`);
  if (!ids || ids.length === 0) return [];
  const orders = await Promise.all(ids.map((id) => kv.get(`order:${id}`)));
  return orders.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── HTTP Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ── GET /api/orders?wallet=0x... ──────────────────
    if (req.method === "GET") {
      const { wallet } = req.query;
      if (!wallet) return res.status(400).json({ error: "wallet query param required" });
      const orders = await listOrders(wallet);
      return res.status(200).json({ orders });
    }

    // ── POST /api/orders ──────────────────────────────
    if (req.method === "POST") {
      const { userWallet, items, total, txHash, customerEmail, status } = req.body;
      if (!userWallet || !items || !total || !txHash) {
        return res.status(400).json({
          error: "Required fields: userWallet, items, total, txHash",
        });
      }
      const order = await createOrder({
        userWallet, items, total, txHash, customerEmail, status,
      });
      return res.status(201).json({ order });
    }

    // ── PATCH /api/orders ─────────────────────────────
    if (req.method === "PATCH") {
      const { id, status } = req.body;
      if (!id || !status) {
        return res.status(400).json({ error: "Required: id, status" });
      }
      const kv = await getKV();
      const order = await kv.get(`order:${id}`);
      if (!order) return res.status(404).json({ error: "Order not found" });
      order.status = status;
      await kv.set(`order:${id}`, order);
      return res.status(200).json({ order });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[orders api] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
