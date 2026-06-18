/**
 * escrow.js — ERC-8183 Agentic Commerce Protocol lifecycle handler.
 *
 * Manages the full ERC-8183 job lifecycle for ArcWear agent-initiated orders:
 *   createJob → fundOnBehalf → submit → complete  (or reject / claimRefund)
 *
 * All contract calls are signed by the Circle Programmable Wallet (agent wallet)
 * via the Circle REST API — no user wallet popup required.
 *
 * Endpoints:
 *   POST /api/escrow          — Create + fund + submit a new escrow job
 *   POST /api/escrow/complete — Evaluator releases USDC to merchant
 *   POST /api/escrow/reject   — Evaluator refunds USDC to buyer
 *   GET  /api/escrow?jobId=N  — Read on-chain job status
 *
 * Required env vars (same as agent-pay.js):
 *   CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_ID
 *   ESCROW_CONTRACT_ADDRESS   — deployed AgenticCommerce.sol on Arc Testnet
 *   EVALUATOR_ADDRESS         — the EOA or agent wallet address set as evaluator
 */

import crypto from "crypto";

// ── Constants ──────────────────────────────────────────────────────────────────
const USDC_ADDRESS    = "0x3600000000000000000000000000000000000000";
const MERCHANT_ADDR   = "0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb";
const ARC_RPC         = "https://rpc.testnet.arc.network";
const CIRCLE_BASE     = "https://api.circle.com/v1/w3s";

// Loaded from env at runtime (set after contract deployment)
const ESCROW_CONTRACT = () => process.env.ESCROW_CONTRACT_ADDRESS;
const EVALUATOR_ADDR  = () => process.env.EVALUATOR_ADDRESS || process.env.CIRCLE_AGENT_ADDRESS;

// 14-day expiry for all ArcWear escrow jobs
const EXPIRY_SECONDS = 14 * 24 * 60 * 60;

// ── Circle Helpers ─────────────────────────────────────────────────────────────

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
  return crypto
    .publicEncrypt(
      { key, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(hexSecret, "hex")
    )
    .toString("base64");
}

async function buildCiphertext(apiKey, entitySecret) {
  const publicKey = await getEntityPublicKey(apiKey);
  return encryptEntitySecret(entitySecret, publicKey);
}

/**
 * Call a function on the AgenticCommerce escrow contract via Circle REST API.
 * Uses the Circle agent wallet to sign — no user popup.
 */
async function callEscrowContract(fnSignature, params, apiKey, entitySecret, walletId) {
  const escrowAddr = ESCROW_CONTRACT();
  if (!escrowAddr) throw new Error("ESCROW_CONTRACT_ADDRESS not set in env");

  const ciphertext = await buildCiphertext(apiKey, entitySecret);

  const res = await fetch(`${CIRCLE_BASE}/developer/transactions/contractExecution`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotencyKey:         crypto.randomUUID(),
      entitySecretCiphertext: ciphertext,
      walletId,
      contractAddress:        escrowAddr,
      abiFunctionSignature:   fnSignature,
      abiParameters:          params,
      fee: { type: "level", config: { feeLevel: "MEDIUM" } },
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
 * Poll Circle until the transaction has a txHash or fails.
 */
async function pollForHash(txId, apiKey, maxAttempts = 30, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res  = await fetch(`${CIRCLE_BASE}/transactions/${txId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.json();
    const tx   = body.data?.transaction;
    if (!tx) continue;
    if (tx.txHash) return { txHash: tx.txHash, state: tx.state };
    if (tx.state === "FAILED" || tx.state === "CANCELLED") {
      throw new Error(`Transaction ${tx.state}: ${tx.errorReason || "unknown"}`);
    }
  }
  throw new Error(`Transaction polling timed out after ${(maxAttempts * intervalMs) / 1000}s`);
}

// ── On-chain Read Helpers ──────────────────────────────────────────────────────

/** Call a view function on Arc RPC */
async function ethCall(to, data) {
  const res = await fetch(ARC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`eth_call error: ${json.error.message}`);
  return json.result;
}

/** Read job status from the escrow contract */
async function getOnChainJobStatus(jobId) {
  const escrowAddr = ESCROW_CONTRACT();
  if (!escrowAddr) return null;

  // getJob(uint256) selector = keccak256("getJob(uint256)")[0..4]
  const selector  = "1d3f9771";
  const jobIdHex  = BigInt(jobId).toString(16).padStart(64, "0");
  const data      = "0x" + selector + jobIdHex;

  try {
    const raw = await ethCall(escrowAddr, data);
    if (!raw || raw === "0x") return null;

    // Decode the Job struct (simplified — read the status field at offset 6*32)
    // Job layout (packed 32-byte slots): client, provider, evaluator, token, budget, expiredAt, status, deliverable, completionReason
    const statusOffset = 6 * 64; // 7th field (0-indexed: 6), each 32 bytes = 64 hex chars
    const statusHex    = raw.slice(2 + statusOffset, 2 + statusOffset + 64);
    const statusNum    = parseInt(statusHex, 16);
    const STATUS_NAMES = ["Open", "Funded", "Submitted", "Completed", "Rejected", "Expired"];
    return STATUS_NAMES[statusNum] ?? "Unknown";
  } catch {
    return null;
  }
}

/** Get the last emitted JobCreated event's jobId (totalJobs() view) */
async function getTotalJobs() {
  const escrowAddr = ESCROW_CONTRACT();
  if (!escrowAddr) return null;
  const selector = "1ace87b3"; // totalJobs()
  const raw = await ethCall(escrowAddr, "0x" + selector);
  return parseInt(raw, 16);
}


// ── Main Escrow Flow ───────────────────────────────────────────────────────────

/**
 * Full agent escrow flow:
 *   createJob → fundOnBehalf → submit → complete
 *
 * @param {string} userWallet  Buyer's wallet address
 * @param {number} total       Order total in USDC (e.g. 49.99)
 * @param {string} orderId     UUID order ID (used as deliverable hash)
 * @param {string} apiKey      Circle API key
 * @param {string} entitySecret Circle entity secret (hex)
 * @param {string} walletId    Circle wallet ID (UUID)
 * @returns {{ txHashes, jobId }} Transaction hashes and the job ID
 */
async function executeEscrowFlow(userWallet, total, orderId, apiKey, entitySecret, walletId) {
  const escrowAddr  = ESCROW_CONTRACT();
  const evaluator   = EVALUATOR_ADDR();
  const expiredAt   = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  const budgetRaw   = Math.round(total * 1e6).toString(); // USDC 6 decimals
  const description = `ArcWear Order ${orderId.slice(0, 8)}`;

  console.log(`[escrow] Starting ERC-8183 flow for ${userWallet}, ${total} USDC`);
  console.log(`[escrow] Contract: ${escrowAddr}, Evaluator: ${evaluator}`);

  // ── Step 1: createJob ─────────────────────────────────────────────────────
  console.log("[escrow] Step 1: createJob()");
  const createTxId = await callEscrowContract(
    "createJob(address,address,address,address,uint256,uint256,string)",
    [userWallet, MERCHANT_ADDR, evaluator, USDC_ADDRESS, budgetRaw, expiredAt.toString(), description],
    apiKey, entitySecret, walletId
  );
  const { txHash: createTxHash } = await pollForHash(createTxId, apiKey);
  console.log(`[escrow] createJob confirmed: ${createTxHash}`);

  // Read the new jobId from totalJobs()
  const jobId = await getTotalJobs();
  console.log(`[escrow] New jobId: ${jobId}`);

  // ── Step 2: fundOnBehalf ──────────────────────────────────────────────────
  // NOTE: Buyer must have approved this escrow contract for USDC before this call.
  // The ApprovalModal now sets allowance on ESCROW_CONTRACT_ADDRESS.
  console.log(`[escrow] Step 2: fundOnBehalf(jobId=${jobId}, client=${userWallet}, budget=${budgetRaw})`);
  const fundTxId = await callEscrowContract(
    "fundOnBehalf(uint256,address,uint256)",
    [jobId.toString(), userWallet, budgetRaw],
    apiKey, entitySecret, walletId
  );
  const { txHash: fundTxHash } = await pollForHash(fundTxId, apiKey);
  console.log(`[escrow] fundOnBehalf confirmed: ${fundTxHash}`);

  // ── Step 3: submit ────────────────────────────────────────────────────────
  // Derive bytes32 deliverable from orderId (keccak256 equivalent via hashing)
  const deliverableHex = "0x" + crypto
    .createHash("sha256")
    .update(orderId)
    .digest("hex");

  console.log(`[escrow] Step 3: submit(jobId=${jobId}, deliverable=${deliverableHex.slice(0, 10)}...)`);
  const submitTxId = await callEscrowContract(
    "submit(uint256,bytes32)",
    [jobId.toString(), deliverableHex],
    apiKey, entitySecret, walletId
  );
  const { txHash: submitTxHash } = await pollForHash(submitTxId, apiKey);
  console.log(`[escrow] submit confirmed: ${submitTxHash}`);

  // ── Step 4: complete ──────────────────────────────────────────────────────
  // Evaluator (agent wallet / ArcWear backend) releases USDC to merchant
  const completionReason = "0x" + crypto
    .createHash("sha256")
    .update(`completed:${orderId}:${Date.now()}`)
    .digest("hex");

  console.log(`[escrow] Step 4: complete(jobId=${jobId})`);
  const completeTxId = await callEscrowContract(
    "complete(uint256,bytes32)",
    [jobId.toString(), completionReason],
    apiKey, entitySecret, walletId
  );
  const { txHash: completeTxHash } = await pollForHash(completeTxId, apiKey);
  console.log(`[escrow] complete confirmed: ${completeTxHash}  ✓ USDC released to merchant`);

  return {
    jobId,
    txHashes: {
      create:   createTxHash,
      fund:     fundTxHash,
      submit:   submitTxHash,
      complete: completeTxHash,
    },
    // The "primary" txHash for order records — the fund tx (when USDC moved)
    txHash: fundTxHash,
  };
}

// ── HTTP Handler ───────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const apiKey       = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const walletId     = process.env.CIRCLE_WALLET_ID;

  if (!apiKey || !entitySecret || !walletId) {
    return res.status(500).json({
      error: "Circle credentials not configured",
      missing: [
        !apiKey       && "CIRCLE_API_KEY",
        !entitySecret && "CIRCLE_ENTITY_SECRET",
        !walletId     && "CIRCLE_WALLET_ID",
      ].filter(Boolean),
    });
  }

  // ── GET /api/escrow?jobId=N — read on-chain job status ──────────────────
  if (req.method === "GET") {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ error: "jobId query param required" });

    const status = await getOnChainJobStatus(jobId);
    return res.status(200).json({ jobId, status });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.query;

  try {
    // ── POST /api/escrow — full create+fund+submit+complete flow ───────────
    if (!action) {
      const { userWallet, total, orderId } = req.body;

      if (!userWallet || !total || !orderId) {
        return res.status(400).json({ error: "Required: userWallet, total, orderId" });
      }
      if (!ESCROW_CONTRACT()) {
        return res.status(500).json({
          error: "ESCROW_CONTRACT_ADDRESS not set. Deploy AgenticCommerce.sol first.",
        });
      }

      const result = await executeEscrowFlow(
        userWallet, Number(total), orderId,
        apiKey, entitySecret, walletId
      );

      return res.status(200).json({
        success: true,
        ...result,
        message: `ERC-8183 escrow completed. JobId: ${result.jobId}, USDC settled to merchant.`,
      });
    }

    // ── POST /api/escrow?action=complete — evaluator releases funds ────────
    if (action === "complete") {
      const { jobId, reason } = req.body;
      if (!jobId) return res.status(400).json({ error: "Required: jobId" });

      const reasonHex = reason
        ? "0x" + crypto.createHash("sha256").update(reason).digest("hex")
        : "0x0000000000000000000000000000000000000000000000000000000000000000";

      const txId = await callEscrowContract(
        "complete(uint256,bytes32)",
        [jobId.toString(), reasonHex],
        apiKey, entitySecret, walletId
      );
      const { txHash } = await pollForHash(txId, apiKey);
      return res.status(200).json({ success: true, action: "complete", jobId, txHash });
    }

    // ── POST /api/escrow?action=reject — evaluator refunds buyer ──────────
    if (action === "reject") {
      const { jobId, reason } = req.body;
      if (!jobId) return res.status(400).json({ error: "Required: jobId" });

      const reasonHex = reason
        ? "0x" + crypto.createHash("sha256").update(reason).digest("hex")
        : "0x0000000000000000000000000000000000000000000000000000000000000000";

      const txId = await callEscrowContract(
        "reject(uint256,bytes32)",
        [jobId.toString(), reasonHex],
        apiKey, entitySecret, walletId
      );
      const { txHash } = await pollForHash(txId, apiKey);
      return res.status(200).json({ success: true, action: "reject", jobId, txHash });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error("[escrow] Error:", err.message);
    return res.status(500).json({ error: err.message || "Escrow operation failed" });
  }
}
