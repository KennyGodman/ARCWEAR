import { useState } from "react";
import { fmt, trunc } from "../utils";
import { AGENT_WALLET, APPROVAL_TARGET, ESCROW_CONTRACT_ADDRESS, ARC_CHAIN_CONFIG, DEFAULT_AGENT_ALLOWANCE } from "../config";

const isEscrow = !!ESCROW_CONTRACT_ADDRESS;

/**
 * ApprovalModal — the one-time USDC spending approval gate.
 *
 * When the AI agent needs autonomous spending authority, this modal
 * lets the user approve a capped USDC allowance to the Circle Agent Wallet.
 * After this single wallet popup, all future agent purchases execute
 * instantly via transferFrom() — no more popups.
 */
export default function ApprovalModal({ wallet, onApprove, onClose, requestedAmount }) {
  const [amount, setAmount] = useState(requestedAmount || DEFAULT_AGENT_ALLOWANCE);
  const [step, setStep] = useState("review"); // review | signing | success | error
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setStep("signing");
    setError("");
    try {
      const hash = await onApprove(amount);
      setTxHash(hash);
      setStep("success");
    } catch (err) {
      const msg =
        err.code === 4001 || err.message?.includes("denied")
          ? "Transaction rejected in wallet"
          : err.message || "Approval failed";
      setError(msg);
      setStep("error");
    }
  };

  const presets = [100, 250, 500, 1000];

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.65)", zIndex: 3500,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, backdropFilter: "blur(6px)",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Approve agent spending"
        className="approval-dialog"
      >
        {/* ── Review Step ── */}
        {step === "review" && (
          <>
            {/* Header */}
            <div className="approval-header">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42,
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, color: "#fff", fontWeight: 800,
                  }}>
                    ◎
                  </div>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                      Enable Agent Mode
                    </p>
                    <p style={{
                      fontSize: 11, color: "#60a5fa",
                      letterSpacing: 1.5, textTransform: "uppercase", margin: "3px 0 0",
                    }}>
                      Autonomous Shopping · Arc Blockchain
                    </p>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={onClose}
                  aria-label="Close"
                  style={{ color: "#666", background: "rgba(255,255,255,0.08)", border: "none" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="approval-body">
              {/* Explanation */}
              <div style={{
                background: "#f8fafc", borderRadius: 12,
                border: "1px solid #e2e8f0", padding: "16px 18px",
                marginBottom: 20,
              }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 8px" }}>
                  How it works
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["1️⃣", "You approve a USDC spending cap (one wallet popup)"],
                    ["2️⃣", "Agent can purchase items instantly — no more popups"],
                    isEscrow
                      ? ["3️⃣", "Your USDC is held in an ERC-8183 escrow contract until delivery is confirmed — fully trustless"]
                      : ["3️⃣", "Agent never exceeds your cap, and you can revoke anytime"],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
                      <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amount selector */}
              <div style={{ marginBottom: 20 }}>
                <span className="label">Spending Cap (USDC)</span>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {presets.map((p) => (
                    <button
                      key={p}
                      className={`option-btn${amount === p ? " active" : ""}`}
                      onClick={() => setAmount(p)}
                      style={{ minWidth: 68 }}
                    >
                      {fmt(p)}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Custom:</span>
                  <input
                    type="number"
                    className="input"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                    style={{ width: 120, padding: "7px 12px", fontSize: 15, fontFamily: "var(--font-mono)" }}
                    min="1"
                    step="10"
                  />
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>USDC</span>
                </div>
              </div>

              {/* Security details */}
              <div style={{
                background: "#0f172a", borderRadius: 12,
                padding: "14px 16px", marginBottom: 20,
              }}>
                {[
                  [isEscrow ? "Escrow Contract" : "Agent Wallet", trunc(APPROVAL_TARGET)],
                  ["Network", "Arc Testnet"],
                  ["Spending Cap", fmt(amount)],
                  ["Type", isEscrow ? "ERC-8183 Escrow (revocable)" : "ERC-20 Allowance (revocable)"],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 13, marginBottom: 4,
                  }}>
                    <span style={{ color: "#94a3b8" }}>{k}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{v}</span>
                  </div>
                ))}
                {isEscrow && (
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 11, color: "#60a5fa",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span>🔒</span>
                    <span>ERC-8183: Your USDC stays in escrow until order is confirmed</span>
                  </div>
                )}
              </div>

              {/* Trust signals */}
              <div style={{ display: "flex", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
                {[
                  ["🔐", "Circle MPC", "Non-custodial"],
                  ["⚡", "Sub-second", "Arc finality"],
                  ["🛡️", "Revocable", "Anytime"],
                ].map(([ic, a, b]) => (
                  <div key={a} style={{
                    display: "flex", gap: 8, alignItems: "center",
                    background: "#f8fafc", borderRadius: 8,
                    padding: "8px 12px", border: "1px solid #e2e8f0",
                    flex: 1, minWidth: 100,
                  }}>
                    <span style={{ fontSize: 18 }}>{ic}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", margin: 0 }}>{a}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{b}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0",
                    borderRadius: 10, padding: "13px", fontSize: 13,
                    cursor: "pointer", color: "#64748b",
                    letterSpacing: 1.5, textTransform: "uppercase",
                  }}
                >
                  Not Now
                </button>
                <button
                  onClick={handleApprove}
                  style={{
                    flex: 2, background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: "13px", fontSize: 14, fontWeight: 700,
                    cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase",
                    boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                  }}
                >
                  Approve {fmt(amount)}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Signing Step ── */}
        {step === "signing" && (
          <div className="approval-signing">
            <img
              src="/arc-logo-signing.jpg"
              alt="Signing Transaction"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                marginBottom: 16,
                animation: "spin 1.5s linear infinite",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "2px solid #e7e4e0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>
              Approve in Wallet
            </h3>
            <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 4 }}>
              Sign the ERC-20 approval to enable agent mode
            </p>
            <p style={{
              fontSize: 12, color: "#c47d2a",
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              One-time approval · Revocable anytime
            </p>
          </div>
        )}

        {/* ── Success Step ── */}
        {step === "success" && (
          <div className="approval-success">
            <div style={{
              width: 60, height: 60, background: "linear-gradient(135deg, #c47d2a, #f97316)",
              borderRadius: "50%", margin: "0 auto 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, color: "#fff",
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>
              Agent Mode Enabled
            </h3>
            <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 16 }}>
              Your AI agent can now shop autonomously up to {fmt(amount)}
            </p>
            {txHash && (
              <a
                href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, fontFamily: "var(--font-mono)",
                  color: "#f97316", textDecoration: "none",
                  display: "inline-block", marginBottom: 20,
                }}
              >
                View approval on ArcScan ↗
              </a>
            )}
            <br />
            <button
              onClick={onClose}
              style={{
                background: "#1c1917", color: "#fff", border: "none",
                borderRadius: 10, padding: "12px 32px", fontSize: 13,
                fontWeight: 700, cursor: "pointer",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}
            >
              Start Shopping with Agent
            </button>
          </div>
        )}

        {/* ── Error Step ── */}
        {step === "error" && (
          <div style={{ textAlign: "center", padding: "50px 28px" }}>
            <div style={{
              width: 60, height: 60, background: "#fef2f2",
              borderRadius: "50%", margin: "0 auto 18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26,
            }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>
              Approval Failed
            </h3>
            <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 20 }}>
              {error}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={onClose}
                style={{
                  background: "#f5f3f0", border: "1px solid #e7e4e0",
                  borderRadius: 10, padding: "11px 24px", fontSize: 13,
                  cursor: "pointer", color: "#78716c",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("review")}
                style={{
                  background: "#1c1917", color: "#fff", border: "none",
                  borderRadius: 10, padding: "11px 24px", fontSize: 13,
                  fontWeight: 700, cursor: "pointer",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
