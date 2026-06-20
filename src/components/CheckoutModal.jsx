import { useState } from "react";
import { fmt, trunc, encodeMemoUSDC } from "../utils";
import { ARC_CHAIN_ID, ARC_CHAIN_CONFIG, USDC_ADDRESS, MERCHANT_ADDR, MEMO_ADDRESS } from "../config";

const generateTempTxHash = () => "pending_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

export default function CheckoutModal({ cart, wallet, onClose, onSuccess, onTxSent, onTxHashUpdated, addToast }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [step, setStep] = useState("review");
  const [txHash, setTxHash] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const pay = async () => {
    if (!window.ethereum) { addToast("No wallet detected", "error"); return; }
    setStep("signing");

    // Initialize the order as pending immediately on click!
    let orderId = createdOrderId;
    if (!orderId) {
      const tempTxHash = generateTempTxHash();
      if (onTxSent) {
        const saved = await onTxSent(tempTxHash);
        if (saved && saved.id) {
          orderId = saved.id;
          setCreatedOrderId(saved.id);
        }
      }
    }

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
      // 1. Get ERC20 USDC balance for payment
      const cleanAddress = wallet.toLowerCase().replace("0x", "");
      const balanceOfData = "0x70a08231" + cleanAddress.padStart(64, "0");
      const erc20Hex = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: USDC_ADDRESS, data: balanceOfData }, "latest"],
      });
      const balance = parseInt(erc20Hex, 16) / 1e6;

      if (balance < total) {
        addToast(`Insufficient USDC balance. You need ${fmt(total)} but only have ${fmt(balance)}.`, "error");
        setStep("review");
        return;
      }

      // 2. Get native USDC balance for gas check
      const nativeHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [wallet, "latest"],
      });
      const nativeBalance = parseInt(nativeHex, 16) / 1e18;
      if (nativeBalance < 0.0001) {
        addToast("Insufficient native balance for gas. Please get some testnet USDC for gas.", "error");
        setStep("review");
        return;
      }

      // Wrap the transfer in a Memo transaction carrying the order ID
      const data = encodeMemoUSDC(MERCHANT_ADDR, total, orderId || "00000000000000000000000000000000");
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: MEMO_ADDRESS, data, gas: "0x30D40" }],
      });

      setTxHash(hash);
      setStep("confirming");
      
      // Update the order in the database with the real txHash!
      if (onTxHashUpdated && orderId) {
        onTxHashUpdated(orderId, hash);
      }

      // 3. Wait for transaction to be mined
      const waitForTransactionReceipt = async (txHash) => {
        for (let i = 0; i < 30; i++) {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          });
          if (receipt) return receipt;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        throw new Error("Transaction receipt timeout. Please check ArcScan.");
      };

      const receipt = await waitForTransactionReceipt(hash);
      if (receipt.status !== "0x1") {
        throw new Error("Transaction failed on-chain. Please verify your balance and try again.");
      }

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
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", margin: "0 0 3px" }}>Order Summary</h2>
            <p style={{ fontSize: 13, color: "#a8a29e", margin: "0 0 14px" }}>Review before paying with USDC on Arc</p>

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
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid #f0ede8", fontSize: 15, color: "#1c1917" }}>
                  <span>{i.name} <span style={{ color: "#a8a29e" }}>×{i.qty}</span></span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Payment details */}
            <div style={{ background: "#1c1917", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, background: "#c47d2a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", fontWeight: 800, flexShrink: 0 }}>◎</div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Arc Blockchain · USDC</p>
                  <p style={{ fontSize: 11, color: "#57534e", letterSpacing: 1.2, textTransform: "uppercase", margin: "2px 0 0" }}>Circle L1 · Rabby &amp; MetaMask</p>
                </div>
              </div>
              {[["Wallet", trunc(wallet) || "Not connected"], ["Network", "Arc Testnet (5042002)"], ["Gas", "~0.001 USDC"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span style={{ color: "#57534e" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#a8a29e" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, color: "#fff", borderTop: "1px solid #292524", paddingTop: 8, marginTop: 6 }}>
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#c47d2a" }}>{fmt(total)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "#f5f3f0", border: "1px solid #e7e4e0", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", color: "#78716c", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Cancel
              </button>
              <button
                onClick={pay}
                style={{ flex: 2, background: "#f97316", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Pay {fmt(total)}
              </button>
            </div>
          </>
        )}

        {/* ── Signing step ── */}
        {step === "signing" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <img
              src="/arc-logo-signing.jpg"
              alt="Signing Transaction"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                marginBottom: 14,
                animation: "spin 1.5s linear infinite",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "2px solid #e7e4e0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>Signing Transaction</h3>
            <p style={{ fontSize: 14, color: "#a8a29e" }}>Approve in your wallet</p>
            <p style={{ fontSize: 12, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>Arc finality &lt;1 second</p>
          </div>
        )}

        {/* ── Confirming step ── */}
        {step === "confirming" && (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <img
              src="/arc-logo-signing.jpg"
              alt="Confirming Payment"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                marginBottom: 14,
                animation: "spin 1.5s linear infinite",
                display: "inline-block",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                border: "2px solid #e7e4e0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1c1917", marginBottom: 6 }}>Confirming Payment</h3>
            <p style={{ fontSize: 14, color: "#a8a29e" }}>Waiting for block finalization on Arc...</p>
            {txHash && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#f97316", textDecoration: "underline" }}
                >
                  View on ArcScan ↗
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Success step ── */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "34px 0" }}>
            <div style={{ width: 56, height: 56, background: "#1c1917", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#c47d2a" }}>✓</div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: "#1c1917", marginBottom: 5 }}>Payment Confirmed</h3>
            <p style={{ fontSize: 14, color: "#a8a29e", marginBottom: 16 }}>Settled on Arc Blockchain</p>
            {txHash && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#78716c", margin: "0 0 6px" }}>Transaction Hash:</p>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "#f97316",
                    background: "#faf9f7",
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "block",
                    wordBreak: "break-all",
                    border: "1px solid #f0ede8",
                    textDecoration: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {txHash} ↗
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              style={{ background: "#1c1917", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
