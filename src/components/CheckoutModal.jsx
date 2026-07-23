import { useState } from "react";
import { fmt, trunc, encodeMemoUSDC } from "../utils";
import { ARC_CHAIN_ID, ARC_CHAIN_CONFIG, USDC_ADDRESS, MERCHANT_ADDR, MEMO_ADDRESS } from "../config";

const generateTempTxHash = () => "pending_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

export default function CheckoutModal({
  cart, wallet, onClose, onSuccess, onTxSent, onTxHashUpdated, addToast,
  customerEmail: propCustomerEmail, setCustomerEmail: propSetCustomerEmail,
  fulfillmentMethod: propFulfillmentMethod, setFulfillmentMethod: propSetFulfillmentMethod,
  deliveryAddress: propDeliveryAddress, setDeliveryAddress: propSetDeliveryAddress,
  pickupLocation: propPickupLocation, setPickupLocation: propSetPickupLocation,
  deliveryFullName: propDeliveryFullName, setDeliveryFullName: propSetDeliveryFullName,
  deliveryPhone: propDeliveryPhone, setDeliveryPhone: propSetDeliveryPhone,
  deliveryAddressLine: propDeliveryAddressLine, setDeliveryAddressLine: propSetDeliveryAddressLine,
  deliveryCity: propDeliveryCity, setDeliveryCity: propSetDeliveryCity,
  deliveryState: propDeliveryState, setDeliveryState: propSetDeliveryState,
  deliveryNotes: propDeliveryNotes, setDeliveryNotes: propSetDeliveryNotes,
  deliveryFee = 0
}) {
  const itemsTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = itemsTotal + (propFulfillmentMethod === "delivery" ? deliveryFee : 0);
  const [step, setStep] = useState("review");
  const [txHash, setTxHash] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const [localEmail, setLocalEmail] = useState("");
  const [localFMethod, setLocalFMethod] = useState("delivery");
  const [localAddress, setLocalAddress] = useState("");
  const [localPickup, setLocalPickup] = useState("SwiftCart Flagship - Downtown");

  const [localFullName, setLocalFullName] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [localAddressLine, setLocalAddressLine] = useState("");
  const [localCity, setLocalCity] = useState("");
  const [localState, setLocalState] = useState("Lagos");
  const [localNotes, setLocalNotes] = useState("");

  const customerEmail = propCustomerEmail !== undefined ? propCustomerEmail : localEmail;
  const setCustomerEmail = propSetCustomerEmail || setLocalEmail;

  const fulfillmentMethod = propFulfillmentMethod !== undefined ? propFulfillmentMethod : localFMethod;
  const setFulfillmentMethod = propSetFulfillmentMethod || setLocalFMethod;

  const deliveryAddress = propDeliveryAddress !== undefined ? propDeliveryAddress : localAddress;
  const setDeliveryAddress = propSetDeliveryAddress || setLocalAddress;

  const pickupLocation = propPickupLocation !== undefined ? propPickupLocation : localPickup;
  const setPickupLocation = propSetPickupLocation || setLocalPickup;

  const deliveryFullName = propDeliveryFullName !== undefined ? propDeliveryFullName : localFullName;
  const setDeliveryFullName = propSetDeliveryFullName || setLocalFullName;

  const deliveryPhone = propDeliveryPhone !== undefined ? propDeliveryPhone : localPhone;
  const setDeliveryPhone = propSetDeliveryPhone || setLocalPhone;

  const deliveryAddressLine = propDeliveryAddressLine !== undefined ? propDeliveryAddressLine : localAddressLine;
  const setDeliveryAddressLine = propSetDeliveryAddressLine || setLocalAddressLine;

  const deliveryCity = propDeliveryCity !== undefined ? propDeliveryCity : localCity;
  const setDeliveryCity = propSetDeliveryCity || setLocalCity;

  const deliveryState = propDeliveryState !== undefined ? propDeliveryState : localState;
  const setDeliveryState = propSetDeliveryState || setLocalState;

  const deliveryNotes = propDeliveryNotes !== undefined ? propDeliveryNotes : localNotes;
  const setDeliveryNotes = propSetDeliveryNotes || setLocalNotes;

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
            body: JSON.stringify({
              customerEmail,
              customerWallet: wallet,
              items: cart,
              total,
              txHash: hash,
              fulfillmentMethod,
              deliveryAddress,
              pickupLocation,
              deliveryFullName,
              deliveryPhone,
              deliveryAddressLine,
              deliveryCity,
              deliveryState,
              deliveryNotes,
              deliveryFee
            }),
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
        className="checkout-dialog"
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

            {/* Fulfillment Toggle */}
            <div style={{ marginBottom: 14 }}>
              <span className="label" style={{ display: "block", marginBottom: 6 }}>📦 Fulfillment Method</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("delivery")}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: fulfillmentMethod === "delivery" ? "1px solid #f97316" : "1px solid #e7e4e0",
                    background: fulfillmentMethod === "delivery" ? "#fff7ed" : "#fff",
                    color: fulfillmentMethod === "delivery" ? "#f97316" : "#78716c",
                    transition: "all 0.2s"
                  }}
                >
                  🚚 Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod("pickup")}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: fulfillmentMethod === "pickup" ? "1px solid #f97316" : "1px solid #e7e4e0",
                    background: fulfillmentMethod === "pickup" ? "#fff7ed" : "#fff",
                    color: fulfillmentMethod === "pickup" ? "#f97316" : "#78716c",
                    transition: "all 0.2s"
                  }}
                >
                  🏪 Store Pickup
                </button>
              </div>
            </div>

            {/* Fulfillment Input */}
            {fulfillmentMethod === "delivery" ? (
              <div style={{
                background: "#1c1917",
                border: "1px solid #292524",
                borderRadius: "12px",
                padding: "16px",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "14px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}>
                {/* Row 1: Full name & Phone */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full name</label>
                    <input
                      type="text"
                      value={deliveryFullName}
                      onChange={e => setDeliveryFullName(e.target.value)}
                      placeholder="Kehinde Odubunmi"
                      required
                      style={{
                        width: "100%",
                        background: "#292524",
                        border: "1px solid #44403c",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "12px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</label>
                    <input
                      type="text"
                      value={deliveryPhone}
                      onChange={e => setDeliveryPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      required
                      style={{
                        width: "100%",
                        background: "#292524",
                        border: "1px solid #44403c",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "12px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Street address */}
                <div>
                  <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Street address</label>
                  <input
                    type="text"
                    value={deliveryAddressLine}
                    onChange={e => setDeliveryAddressLine(e.target.value)}
                    placeholder="12 Admiralty Way, Lekki Phase 1"
                    required
                    style={{
                      width: "100%",
                      background: "#292524",
                      border: "1px solid #44403c",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Row 3: City & State */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>City</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={e => setDeliveryCity(e.target.value)}
                      placeholder="Lagos"
                      required
                      style={{
                        width: "100%",
                        background: "#292524",
                        border: "1px solid #44403c",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "12px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>State</label>
                    <select
                      value={deliveryState}
                      onChange={e => setDeliveryState(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#292524",
                        border: "1px solid #44403c",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "12px",
                        outline: "none",
                        cursor: "pointer",
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Delivery notes */}
                <div>
                  <label style={{ display: "block", fontSize: "10px", color: "#a8a29e", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Delivery notes (optional)</label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Landmark, gate code, preferred time"
                    style={{
                      width: "100%",
                      background: "#292524",
                      border: "1px solid #44403c",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                {/* Row 5: Delivery fee */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #292524", paddingTop: "10px", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#a8a29e" }}>Delivery fee</span>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#60a5fa" }}>{deliveryFee.toFixed(2)} USDC</span>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="checkout-pickup" className="label">🏪 Select Pickup Store</label>
                <select
                  id="checkout-pickup"
                  className="input"
                  value={pickupLocation}
                  onChange={e => setPickupLocation(e.target.value)}
                  style={{ cursor: "pointer" }}
                >
                  <option value="SwiftCart Flagship - Downtown">SwiftCart Flagship - Downtown</option>
                  <option value="SwiftCart L1 Hub - Uptown">SwiftCart L1 Hub - Uptown</option>
                  <option value="Circle Locker - East Side">Circle Locker - East Side</option>
                </select>
              </div>
            )}

            {/* Item list */}
            <div style={{ background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 16, maxHeight: 140, overflowY: "auto" }}>
              {cart.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 14px", borderBottom: "1px solid #e2e8f0", fontSize: 15, color: "#0f172a" }}>
                  <span>{i.name} <span style={{ color: "#64748b" }}>×{i.qty}</span></span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            {/* Payment details */}
            <div style={{ background: "#0f172a", borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", fontWeight: 800, flexShrink: 0 }}>◎</div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Arc Blockchain · USDC</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", letterSpacing: 1.2, textTransform: "uppercase", margin: "2px 0 0" }}>Circle L1 · Rabby &amp; MetaMask</p>
                </div>
              </div>
              {[["Wallet", trunc(wallet) || "Not connected"], ["Network", "Arc Testnet (5042002)"], ["Gas", "~0.001 USDC"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span style={{ color: "#64748b" }}>{k}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, color: "#fff", borderTop: "1px solid #1e293b", paddingTop: 8, marginTop: 6 }}>
                <span>Total</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#60a5fa" }}>{fmt(total)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px", fontSize: 13, cursor: "pointer", color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}
              >
                Cancel
              </button>
              <button
                onClick={pay}
                style={{ flex: 2, background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
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
                border: "2px solid #e2e8f0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Signing Transaction</h3>
            <p style={{ fontSize: 14, color: "#64748b" }}>Approve in your wallet</p>
            <p style={{ fontSize: 12, color: "#2563eb", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>Arc finality &lt;1 second</p>
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
                border: "2px solid #e2e8f0",
              }}
            />
            <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Confirming Payment</h3>
            <p style={{ fontSize: 14, color: "#64748b" }}>Waiting for block finalization on Arc...</p>
            {txHash && (
              <div style={{ marginTop: 12 }}>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#2563eb", textDecoration: "underline" }}
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
            <div style={{ width: 56, height: 56, background: "#2563eb", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff" }}>✓</div>
            <h3 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", marginBottom: 5 }}>Payment Confirmed</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>Settled on Arc Blockchain</p>
            {txHash && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px" }}>Transaction Hash:</p>
                <a
                  href={`${ARC_CHAIN_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "#2563eb",
                    background: "#f8fafc",
                    borderRadius: 8,
                    padding: "8px 12px",
                    display: "block",
                    wordBreak: "break-all",
                    border: "1px solid #e2e8f0",
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
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
