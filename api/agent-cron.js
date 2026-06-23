/**
 * agent-cron.js — Daily autonomous reorder execution.
 *
 * Runs every day at 09:00 UTC (configured in vercel.json).
 * Also callable manually: POST /api/agent-cron (protected by CRON_SECRET).
 *
 * For each active trigger where nextOrder <= today:
 *  1. Check on-chain USDC allowance (user → agent wallet)
 *  2. If sufficient → execute transferFrom via Circle REST API
 *  3. If insufficient → send "allowance low" email notification
 *  4. Update trigger: lastOrdered, nextOrder
 *  5. Send purchase confirmation email
 */

import crypto from "crypto";

const USDC_ADDRESS  = "0x3600000000000000000000000000000000000000";
const MERCHANT_ADDR = "0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb";
const AGENT_ADDRESS = process.env.CIRCLE_AGENT_ADDRESS || "0xc83e6b9a6aa46a09b1fb28c5bce7e8e74bacd488";
const ARC_RPC       = "https://rpc.testnet.arc.network";
const CIRCLE_BASE   = "https://api.circle.com/v1/w3s";
const SCAN_URL      = "https://testnet.arcscan.app/tx/";
const MEMO_ADDRESS  = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";

// ── ABI / Hex Encoding Helpers for Memos ──────────────────────────────────────
function padAddress(addr) {
  return addr.toLowerCase().replace("0x", "").padStart(64, "0");
}

function padUint256(val) {
  return BigInt(val).toString(16).padStart(64, "0");
}

function encodeTransferFrom(from, to, amountRaw) {
  return "0x23b872dd" + padAddress(from) + padAddress(to) + padUint256(amountRaw);
}

function encodeMemoId(uuid) {
  const clean = uuid.replace(/-/g, "").toLowerCase();
  return "0x" + clean.padEnd(64, "0");
}

function encodeMemoData(text) {
  let hex = "";
  for (let i = 0; i < text.length; i++) {
    hex += text.charCodeAt(i).toString(16);
  }
  return "0x" + hex;
}


// ── On-chain helpers ──────────────────────────────────────────────────────────

async function getAllowance(ownerAddr) {
  const owner   = ownerAddr.toLowerCase().replace("0x", "").padStart(64, "0");
  const spender = AGENT_ADDRESS.toLowerCase().replace("0x", "").padStart(64, "0");
  const data    = "0xdd62ed3e" + owner + spender;

  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_call",
      params: [{ to: USDC_ADDRESS, data }, "latest"],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return parseInt(json.result, 16) / 1e6;
}

// ── Circle helpers ────────────────────────────────────────────────────────────

async function getEntityPublicKey(apiKey) {
  const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Circle publicKey fetch failed: ${res.status}`);
  const body = await res.json();
  return body.data.publicKey;
}

function encryptEntitySecret(hexSecret, publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const encrypted = crypto.publicEncrypt(
    { key, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    Buffer.from(hexSecret, "hex")
  );
  return encrypted.toString("base64");
}

async function executeTransferFrom(userWallet, amount, orderId) {
  const apiKey       = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const walletId     = process.env.CIRCLE_WALLET_ID;

  const publicKey  = await getEntityPublicKey(apiKey);
  const ciphertext = encryptEntitySecret(entitySecret, publicKey);
  const amountRaw  = Math.round(amount * 1e6).toString();

  const innerData = encodeTransferFrom(userWallet, MERCHANT_ADDR, amountRaw);
  const memoId = encodeMemoId(orderId);
  const memoData = encodeMemoData("ArcWear Order");

  const res = await fetch(`${CIRCLE_BASE}/developer/transactions/contractExecution`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      idempotencyKey:        crypto.randomUUID(),
      entitySecretCiphertext: ciphertext,
      walletId,
      contractAddress:       MEMO_ADDRESS,
      abiFunctionSignature:  "memo(address,bytes,bytes32,bytes)",
      abiParameters:         [USDC_ADDRESS, innerData, memoId, memoData],
      feeLevel:              "MEDIUM",
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.message || `Circle API ${res.status}`);

  const txId = body.data?.id;
  if (!txId) throw new Error("No transaction ID from Circle");

  // Poll for hash
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes  = await fetch(`${CIRCLE_BASE}/transactions/${txId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const pollBody = await pollRes.json();
    const tx       = pollBody.data?.transaction;
    if (tx?.txHash) return tx.txHash;
    if (tx?.state === "FAILED") throw new Error(`Tx FAILED: ${tx.errorReason}`);
  }
  throw new Error("Transaction polling timed out");
}

// ── Email helpers ─────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey || !to) return;
  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": brevoKey },
    body: JSON.stringify({
      sender:      { name: "ArcWear Agent", email: "dannymark67@gmail.com" },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
}

function reorderConfirmationHtml(trigger, txHash) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #f0ede8;">
      <div style="background:#1c1917;padding:20px 28px;text-align:center;">
        <p style="color:#c47d2a;font-size:20px;font-weight:800;margin:0;">◎ ARCWEAR</p>
        <p style="color:#f97316;font-size:9px;letter-spacing:2px;margin:3px 0 0;text-transform:uppercase;">
          Auto-Reorder · Arc Blockchain
        </p>
      </div>
      <div style="background:#f97316;padding:12px;text-align:center;">
        <p style="color:#fff;font-size:14px;font-weight:700;margin:0;">
          🔄 Auto-reorder completed!
        </p>
      </div>
      <div style="background:#fff;padding:20px 28px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#57534e;">Product</td>
            <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1c1917;text-align:right;">${trigger.productName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#57534e;border-top:1px solid #f0ede8;">Amount</td>
            <td style="padding:8px 0;font-size:14px;font-weight:700;color:#f97316;font-family:monospace;text-align:right;border-top:1px solid #f0ede8;">${trigger.price.toFixed(2)} USDC</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#57534e;">Next reorder</td>
            <td style="padding:8px 0;font-size:13px;font-weight:600;color:#1c1917;text-align:right;">in ${trigger.intervalDays} days</td>
          </tr>
        </table>
      </div>
      <div style="background:#faf9f7;padding:12px 28px;border-top:1px solid #f0ede8;">
        <p style="font-size:10px;color:#a8a29e;margin:0;">Tx: <a href="${SCAN_URL}${txHash}" style="color:#f97316;">${txHash.slice(0, 20)}…</a></p>
      </div>
      <div style="background:#1c1917;padding:12px;text-align:center;">
        <p style="font-size:10px;color:#57534e;margin:0;">
          To cancel auto-reorders, tell your ArcWear agent to "stop reordering ${trigger.productName}".
        </p>
      </div>
    </div>`;
}

function lowAllowanceHtml(trigger) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #f0ede8;">
      <div style="background:#1c1917;padding:20px 28px;text-align:center;">
        <p style="color:#c47d2a;font-size:20px;font-weight:800;margin:0;">◎ ARCWEAR</p>
      </div>
      <div style="background:#c41e3a;padding:12px;text-align:center;">
        <p style="color:#fff;font-size:14px;font-weight:700;margin:0;">⚠️ Agent allowance too low</p>
      </div>
      <div style="background:#fff;padding:20px 28px;">
        <p style="font-size:13px;color:#1c1917;margin:0 0 12px;">
          Your auto-reorder for <strong>${trigger.productName}</strong> (${trigger.price.toFixed(2)} USDC) 
          couldn't execute — your USDC allowance to the agent wallet is insufficient.
        </p>
        <p style="font-size:12px;color:#57534e;">
          To fix this, open ArcWear and tell the agent: <em>"Top up my agent allowance"</em>
        </p>
      </div>
    </div>`;
}

// ── Trigger storage helpers (inline for serverless isolation) ─────────────────

async function loadAllTriggers() {
  try {
    const { kv } = await import("@vercel/kv");
    const allIds  = await kv.smembers("all-triggers-index");
    if (!allIds?.length) return [];
    const items = await Promise.all(allIds.map((id) => kv.get(`trigger:${id}`)));
    return items.filter(Boolean).filter((t) => t.active);
  } catch {
    // Fallback for local dev
    if (!global.__agentTriggers) return [];
    return Object.values(global.__agentTriggers)
      .filter((v) => v && typeof v === "object" && v.active && v.nextOrder);
  }
}

async function saveTrigger(trigger) {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(`trigger:${trigger.id}`, trigger);
  } catch {
    if (global.__agentTriggers) {
      global.__agentTriggers[`trigger:${trigger.id}`] = trigger;
    }
  }
}

// ── Main cron handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow Vercel cron (GET) and manual trigger (POST with secret)
  if (req.method === "POST") {
    const secret = process.env.CRON_SECRET;
    const auth   = req.headers["authorization"];
    if (secret && auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const today   = new Date().toISOString().split("T")[0];
  const results = { executed: [], skipped: [], errors: [] };

  console.log(`[agent-cron] Running for date: ${today}`);

  try {
    const triggers = await loadAllTriggers();
    console.log(`[agent-cron] Found ${triggers.length} active trigger(s)`);

    for (const trigger of triggers) {
      const isDue = trigger.nextOrder <= today;
      if (!isDue) {
        console.log(`[agent-cron] Trigger ${trigger.id} not due until ${trigger.nextOrder}`);
        results.skipped.push({ id: trigger.id, product: trigger.productName, nextOrder: trigger.nextOrder });
        continue;
      }

      console.log(`[agent-cron] Processing trigger: ${trigger.productName} for ${trigger.userWallet}`);

      try {
        // 1. Check allowance
        const allowance = await getAllowance(trigger.userWallet);
        console.log(`[agent-cron] Allowance: ${allowance} USDC, need: ${trigger.price} USDC`);

        if (allowance < trigger.price) {
          console.warn(`[agent-cron] Insufficient allowance for ${trigger.productName}`);
          // Notify user
          if (trigger.customerEmail) {
            await sendEmail(
              trigger.customerEmail,
              `⚠️ ArcWear: Auto-reorder of ${trigger.productName} needs attention`,
              lowAllowanceHtml(trigger)
            );
          }
          results.skipped.push({
            id: trigger.id,
            product: trigger.productName,
            reason: `allowance ${allowance.toFixed(2)} < ${trigger.price.toFixed(2)} USDC`,
          });
          continue;
        }

        // 2. Check max price guard
        if (trigger.maxPrice && trigger.price > trigger.maxPrice) {
          console.warn(`[agent-cron] Price ${trigger.price} exceeds maxPrice ${trigger.maxPrice}`);
          if (trigger.customerEmail) {
            await sendEmail(
              trigger.customerEmail,
              `⚠️ ArcWear: Price check required for ${trigger.productName}`,
              lowAllowanceHtml(trigger) // re-use low-allowance template
            );
          }
          results.skipped.push({ id: trigger.id, product: trigger.productName, reason: "price > maxPrice" });
          continue;
        }

        // 3. Execute transferFrom
        const orderId = crypto.randomUUID();
        const txHash = await executeTransferFrom(trigger.userWallet, trigger.price, orderId);
        console.log(`[agent-cron] ✅ Executed! Tx: ${txHash}`);

        // 4. Update trigger
        const next = new Date();
        next.setDate(next.getDate() + trigger.intervalDays);
        const updated = {
          ...trigger,
          lastOrdered: today,
          nextOrder:   next.toISOString().split("T")[0],
        };
        await saveTrigger(updated);

        // 5. Confirmation email
        if (trigger.customerEmail) {
          await sendEmail(
            trigger.customerEmail,
            `🔄 ArcWear auto-reordered ${trigger.productName}`,
            reorderConfirmationHtml(trigger, txHash)
          );
        }

        results.executed.push({ id: trigger.id, product: trigger.productName, txHash });

      } catch (triggerErr) {
        console.error(`[agent-cron] Error on trigger ${trigger.id}:`, triggerErr.message);
        results.errors.push({ id: trigger.id, product: trigger.productName, error: triggerErr.message });
      }
    }

    console.log("[agent-cron] Done:", JSON.stringify(results));
    return res.status(200).json({ date: today, ...results });

  } catch (err) {
    console.error("[agent-cron] Fatal error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
