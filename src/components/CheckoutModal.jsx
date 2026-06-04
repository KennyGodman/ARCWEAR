import { useState } from "react";
import { fmt, trunc } from "../utils";
import { ARC_CHAIN_ID, ARC_CHAIN_CONFIG, USDC_ADDRESS, MERCHANT_ADDR } from "../config";

export default function CheckoutModal({ cart, wallet, onClose, onSuccess, addToast }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [step, setStep] = useState("review");
  const [txHash, setTxHash] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const pay = async () => {
    if (!window.ethereum) { addToast("No wallet detected", "error"); return; }
    setStep("signing");
    try {
      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      if (currentChain !== ARC_CHAIN_ID) {
        try {
          await window.ethereum.request({ method: "wallet_addEthereumChain", params: [ARC_CHAIN_CONFIG] });
        } catch {
          try {
            await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: ARC_CHAIN_ID }] });
          } catch (se) {
            addToast(se.code === 4001 ? "Please approve the network switch" : "Add Arc Testnet manually", "error");
            setStep("review"); return;
          }
        }
      }

      const amt = Math.round(total * 1e6);
      const data = "0xa9059cbb" + MERCHANT_ADDR.slice(2).padStart(64, "0") + amt.toString(16).padStart(64, "0");
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: USDC_ADDRESS, data, gas: "0x186A0" }],
      });

      setTxHash(hash);
      setStep("success");
      onSuccess();
      addToast("Payment confirmed on Arc!", "success");

      if (customerEmail) {
        try {
          await fetch("/api/send-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerEmail, customerWallet: wallet, items: cart, total, txHash: hash }),
          });
          addToast("Confirmation email sent!", "success");
        } catch (e) {
          console.error("Email confirmation error:", e);
        }
      }
    } catch (err) {
      const msg = err.code === 4001 || err.message?.includes("denied")
        ? "Transaction cancelled"
        : "Error: " + (err.message || "Unknown");
      addToast(msg, "error");
      setStep("review");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.65)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, backdropFilter: "blur(4px)",
    }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
        style={{
          background: "#fff", borderRadius: 16,
          width: 460, maxWidth: "100%", padding: 28,
          position: "relative", boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <button
          className="btn-icon"
          onClick={onClose}
          aria-label="Close checkout"
          style={{ position: "absolute", top: 12, right: 12 }}
        >
          ✕
        </button>

        {/* ── Review step ── */}
        {step === "review" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", margin: "0 0 3px" }}>Order Summary</h2>
            <p style={{ fontSize: 11, color: "#a8a29e", margin: "0 0 14px" }}>Review before paying with USDC on Arc</p>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="checkout-email" className="label">📧 Email for confirmation</label>
              <input
                id="checkout-email"
                type="email"
                className="input"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            {/* Item list */}
            <div style={{ background: "#faf9f7", borderRadius: 10, border: "1px solid #f0ede8", marginBottom: 16, maxHeight: 140, overflowY: "auto" }}>
              {cart.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid #f0ede8", fontSize: 13, color: "#1c1917" }}>
                  <span>{i.name} <span style={{ color: "#a8a29e" }}>×{i.qty}</span></span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Payment details */}
            <div style={{ background: "#1c1917", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, background: "#c47d2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 800, flexShrink: 0 }}>◎</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Arc Blockchain · USDC</p>
                  <p style={{ fontSize: 9, color: "#57534e", letterSpacing: 1.2, textTransform: "uppercase", margin: "2px 0 0" }}>Circle L1 · Rabby &amp; MetaMask</p>
                </div>
              </div>
              {[["Wallet", trunc(wallet) || "Not connected"], ["Network", "Arc Testnet (5042002)"], ["Gas", "~0.001 USDC"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "#57534e" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#a8a29e" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, color: "#fff", borderTop: "1px solid #292524", paddingTop: 8, marginTop: 6 }}>
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#c47d2a" }}>{fmt(total)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "#f5f3f0", border: "1px solid #e7e4e0", borderRadius: 10, padding: "11px", fontSize: 11, cursor: "pointer", color: "#78716c", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Cancel
              </button>
              <button
                onClick={pay}
                style={{ flex: 2, background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Pay {fmt(total)}
              </button>
            </div>
          </>
        )}

        {/* ── Signing step ── */}
        {step === "signing" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 14, animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>Signing Transaction</h3>
            <p style={{ fontSize: 12, color: "#a8a29e" }}>Approve in your wallet</p>
            <p style={{ fontSize: 10, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>Arc finality &lt;1 second</p>
          </div>
        )}

        {/* ── Success step ── */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "34px 0" }}>
            <div style={{ width: 56, height: 56, background: "#1c1917", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#c47d2a" }}>✓</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 5 }}>Payment Confirmed</h3>
            <p style={{ fontSize: 12, color: "#a8a29e", marginBottom: 16 }}>Settled on Arc Blockchain</p>
            {txHash && (
              <p style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#a8a29e", background: "#faf9f7", borderRadius: 8, padding: "8px 12px", wordBreak: "break-all", marginBottom: 16, border: "1px solid #f0ede8" }}>
                {txHash}
              </p>
            )}
            <button
              onClick={onClose}
              style={{ background: "#1c1917", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
