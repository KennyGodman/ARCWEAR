/**
 * agent-pay.js — Autonomous USDC checkout via Circle Programmable Wallets REST API.
 *
 * Flow (ERC-8183 Escrow — when ESCROW_CONTRACT_ADDRESS is set):
 *  1. Verify on-chain USDC allowance (user → ESCROW CONTRACT)
 *  2. Call /api/escrow which runs: createJob → fundOnBehalf → submit → complete
 *  3. USDC flows: buyer → escrow → merchant (trustless, on-chain)
 *  4. Send Brevo confirmation email
 *
 * Flow (Legacy Direct — fallback when no escrow contract set):
 *  1. Verify USDC allowance (user → agent wallet)
 *  2. Call USDC.transferFrom(user, merchant, amount) via Circle MPC
 *  3. Send confirmation email
 *
 * Required .env vars:
 *   CIRCLE_API_KEY            — from console.circle.com
 *   CIRCLE_ENTITY_SECRET      — 64-char hex
 *   CIRCLE_WALLET_ID          — UUID of agent wallet
 *   ESCROW_CONTRACT_ADDRESS   — (optional) AgenticCommerce.sol on Arc Testnet
 *   EVALUATOR_ADDRESS         — (optional) evaluator EOA for escrow jobs
 *   BREVO_API_KEY             — optional, for confirmation emails
 */

import crypto from "crypto";

// ── Constants ─────────────────────────────────────────────────────────────────
const USDC_ADDRESS    = "0x3600000000000000000000000000000000000000";
const MERCHANT_ADDR   = "0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb";
const AGENT_ADDRESS   = process.env.CIRCLE_AGENT_ADDRESS || "0xc83e6b9a6aa46a09b1fb28c5bce7e8e74bacd488";
const ARC_RPC         = "https://rpc.testnet.arc.network";
const CIRCLE_BASE     = "https://api.circle.com/v1/w3s";
const MEMO_ADDRESS    = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";

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


// ERC-8183 escrow — set after deploying AgenticCommerce.sol
const ESCROW_CONTRACT = () => process.env.ESCROW_CONTRACT_ADDRESS || null;

// ── Circle Helpers ────────────────────────────────────────────────────────────

/** Fetch Circle's RSA public key for this API key */
async function getEntityPublicKey(apiKey) {
  const res = await fetch(`${CIRCLE_BASE}/config/entity/publicKey`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Circle publicKey fetch failed: ${err.message || res.status}`);
  }
  const body = await res.json();
  return body.data.publicKey;
}

/**
 * Encrypt the 32-byte hex entity secret with Circle's RSA public key.
 * Circle uses OAEP + SHA-256 padding.
 */
function encryptEntitySecret(hexSecret, publicKeyPem) {
  const key = crypto.createPublicKey(publicKeyPem);
  const encrypted = crypto.publicEncrypt(
    {
      key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(hexSecret, "hex")
  );
  return encrypted.toString("base64");
}

/** Build the encrypted ciphertext fresh on every request (required by Circle) */
async function buildCiphertext(apiKey, entitySecret) {
  const publicKey = await getEntityPublicKey(apiKey);
  return encryptEntitySecret(entitySecret, publicKey);
}

// ── On-chain Helpers ──────────────────────────────────────────────────────────

/**
 * Read USDC.allowance(owner, spender) directly from Arc RPC.
 * Checks allowance to the ESCROW CONTRACT if deployed, else to the agent wallet.
 */
async function getAllowance(ownerAddr) {
  const spenderAddr = ESCROW_CONTRACT() || AGENT_ADDRESS;
  const owner   = ownerAddr.toLowerCase().replace("0x", "").padStart(64, "0");
  const spender = spenderAddr.toLowerCase().replace("0x", "").padStart(64, "0");
  const data    = "0xdd62ed3e" + owner + spender; // allowance(address,address)

  const res = await fetch(ARC_RPC, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_call",
      params: [{ to: USDC_ADDRESS, data }, "latest"],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`eth_call error: ${json.error.message}`);
  return parseInt(json.result, 16) / 1e6; // USDC has 6 decimals
}

// ── Circle Transaction ────────────────────────────────────────────────────────

/**
 * Submit a USDC.transferFrom(user, merchant, amount) call via Circle REST API.
 * The Circle agent wallet signs the transaction server-side — no user wallet popup.
 */
async function submitTransferFrom(userWallet, amount, orderId, apiKey, entitySecret, walletId) {
  const amountRaw = Math.round(amount * 1e6).toString(); // 6-decimal raw units
  const ciphertext = await buildCiphertext(apiKey, entitySecret);

  const innerData = encodeTransferFrom(userWallet, MERCHANT_ADDR, amountRaw);
  const memoId = encodeMemoId(orderId);
  const memoData = encodeMemoData("ArcWear Order");

  const res = await fetch(`${CIRCLE_BASE}/developer/transactions/contractExecution`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
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

  if (!res.ok) {
    const msg = body.message || body.errors?.[0]?.message || `Circle API ${res.status}`;
    throw new Error(msg);
  }

  const txId = body.data?.id;
  if (!txId) throw new Error("Circle returned no transaction ID");
  return txId;
}

/**
 * Poll Circle's transaction endpoint until we get a txHash or failure.
 * Arc finality is <1s so this typically resolves in 1-2 polls.
 */
async function pollForHash(txId, apiKey, maxAttempts = 30, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${CIRCLE_BASE}/transactions/${txId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.json();
    const tx   = body.data?.transaction;

    if (!tx) continue;

    if (tx.txHash) {
      return { txHash: tx.txHash, state: tx.state };
    }
    if (tx.state === "FAILED" || tx.state === "CANCELLED") {
      throw new Error(`Transaction ${tx.state}: ${tx.errorReason || "unknown reason"}`);
    }
  }
  throw new Error(`Transaction polling timed out after ${(maxAttempts * intervalMs) / 1000}s`);
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userWallet, items, total, customerEmail, orderId: reqOrderId } = req.body;
  const orderId = reqOrderId || crypto.randomUUID();

  if (!userWallet || !total || total <= 0) {
    return res.status(400).json({ error: "Missing userWallet or invalid total" });
  }

  // Read Circle credentials from env
  const apiKey       = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const walletId     = process.env.CIRCLE_WALLET_ID;

  if (!apiKey || !entitySecret || !walletId) {
    console.error("[agent-pay] Missing Circle credentials");
    return res.status(500).json({
      error: "Agent wallet not configured. Run `node scripts/circle-setup.mjs` to set up.",
      missing: [
        !apiKey       && "CIRCLE_API_KEY",
        !entitySecret && "CIRCLE_ENTITY_SECRET",
        !walletId     && "CIRCLE_WALLET_ID",
      ].filter(Boolean),
    });
  }

  try {
    // ── 1. Verify on-chain allowance ──────────────────────────────────────
    const spenderLabel = ESCROW_CONTRACT() ? "escrow contract" : "agent wallet";
    console.log(`[agent-pay] Checking USDC allowance for ${userWallet} → ${spenderLabel}...`);
    const allowance = await getAllowance(userWallet);
    console.log(`[agent-pay] Allowance: ${allowance} USDC (need ${total})`);

    if (allowance < total) {
      return res.status(400).json({
        error:     "INSUFFICIENT_ALLOWANCE",
        message:   `Allowance is ${allowance.toFixed(2)} USDC but checkout needs ${total.toFixed(2)} USDC. Please approve the ${spenderLabel}.`,
        allowance,
        required:  total,
        spender:   ESCROW_CONTRACT() || AGENT_ADDRESS,
      });
    }

    let txHash, jobId, escrowStatus;

    if (ESCROW_CONTRACT()) {
      // ── 2a. ERC-8183 Escrow Flow ───────────────────────────────────────
      console.log(`[agent-pay] ERC-8183 escrow flow. OrderId: ${orderId}`);

      const { default: escrowHandler } = await import("./escrow.js");
      let escrowResult;
      await escrowHandler(
        { method: "POST", query: {}, body: { userWallet, total, orderId } },
        {
          status: (code) => ({
            json: (data) => {
              if (code !== 200) throw new Error(data.error || `Escrow failed (${code})`);
              escrowResult = data;
            },
          }),
          setHeader: () => {},
          end: () => {},
        }
      );
      txHash = escrowResult.txHash;
      jobId  = escrowResult.jobId;
      escrowStatus = escrowResult.escrowStatus || "submitted";
      console.log(`[agent-pay] ERC-8183 complete. JobId: ${jobId}, txHash: ${txHash}`);

    } else {
      // ── 2b. Legacy Direct transferFrom (fallback) ──────────────────────
      console.log(`[agent-pay] Submitting transferFrom: ${userWallet} → ${MERCHANT_ADDR}, ${total} USDC (orderId: ${orderId})`);
      const txId = await submitTransferFrom(userWallet, total, orderId, apiKey, entitySecret, walletId);
      console.log(`[agent-pay] Transaction submitted. ID: ${txId}`);
      const result = await pollForHash(txId, apiKey);
      txHash = result.txHash;
      console.log(`[agent-pay] Confirmed! Tx: ${txHash} (${result.state})`);
    }

    // ── 3. Send confirmation email (fire-and-forget) ───────────────────
    if (process.env.BREVO_API_KEY && customerEmail) {
      sendConfirmationEmail(
        { customerEmail, userWallet, items, total },
        txHash,
        process.env.BREVO_API_KEY
      ).catch((e) => console.error("[agent-pay] Email error:", e));
    }

    return res.status(200).json({
      success: true,
      txHash,
      jobId:   jobId ?? null,
      escrow:  !!ESCROW_CONTRACT(),
      escrowStatus: escrowStatus ?? "completed",
      total,
      message: `Agent purchased ${items?.length || 0} item(s) for ${total.toFixed(2)} USDC${jobId ? ` (ERC-8183 job #${jobId})` : ""}`,
    });
  } catch (err) {
    console.error("[agent-pay] Error:", err.message);
    return res.status(500).json({ error: err.message || "Agent payment failed" });
  }
}

// ── Email Notification ────────────────────────────────────────────────────────

async function sendConfirmationEmail({ customerEmail, userWallet, items = [], total }, txHash, brevoKey) {
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-size:13px;color:#1c1917;">
        ${item.name} × ${item.qty}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:monospace;font-size:13px;color:#1c1917;text-align:right;">
        ${(item.price * item.qty).toFixed(2)} USDC
      </td>
    </tr>`
    )
    .join("");

  const scanUrl = `https://testnet.arcscan.app/tx/${txHash}`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #f0ede8;">
      <div style="background:#1c1917;padding:22px 28px;text-align:center;">
        <p style="color:#c47d2a;font-size:22px;font-weight:800;margin:0;">◎ ARCWEAR</p>
        <p style="color:#f97316;font-size:10px;letter-spacing:2px;margin:4px 0 0;text-transform:uppercase;">
          Agent-Initiated Purchase · Arc Blockchain
        </p>
      </div>
      <div style="background:#f97316;padding:14px;text-align:center;">
        <p style="color:#fff;font-size:15px;font-weight:700;margin:0;">✓ Your agent completed a purchase</p>
      </div>
      <div style="background:#fff;padding:20px 28px;">
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
          <tr>
            <td style="padding:12px;font-weight:700;font-size:15px;border-top:2px solid #f0ede8;">Total</td>
            <td style="padding:12px;font-weight:700;font-size:15px;text-align:right;font-family:monospace;border-top:2px solid #f0ede8;">
              ${total.toFixed(2)} USDC
            </td>
          </tr>
        </table>
      </div>
      <div style="background:#faf9f7;padding:14px 28px;border-top:1px solid #f0ede8;">
        <p style="font-size:11px;color:#78716c;margin:0 0 6px;">Transaction on Arc Testnet:</p>
        <a href="${scanUrl}" style="font-size:10px;font-family:monospace;color:#f97316;word-break:break-all;">
          ${txHash} ↗
        </a>
      </div>
      <div style="background:#1c1917;padding:14px 28px;text-align:center;">
        <p style="font-size:10px;color:#57534e;margin:0;">
          ArcWear · Powered by Circle Programmable Wallets · Arc Testnet
        </p>
      </div>
    </div>
  `;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoKey,
    },
    body: JSON.stringify({
      sender:      { name: "ArcWear Agent", email: "dannymark67@gmail.com" },
      to:          [{ email: customerEmail }],
      subject:     "🤖 Your ArcWear agent made a purchase!",
      htmlContent: html,
    }),
  });
}
