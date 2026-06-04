import { fmt } from "../utils";

export default function CartDrawer({ cart, onRemove, onCheckout, onClose, wallet }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <div className="backdrop" onClick={onClose} aria-label="Close cart" />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        style={{
          position: "fixed", top: 0, right: 0, height: "100%",
          background: "#fff", zIndex: 1200,
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          animation: "drawerIn .28s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #f0ede8" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1c1917", margin: 0 }}>Your Cart</h2>
            <p style={{ fontSize: 11, color: "#a8a29e", margin: "3px 0 0" }}>
              {cart.reduce((s, i) => s + i.qty, 0)} items
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <p style={{ fontSize: 44, marginBottom: 10, opacity: 0.2 }}>🛒</p>
              <p style={{ fontSize: 13, color: "#a8a29e" }}>Your cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id + item.size + item.color} className="cart-item">
              <div className="cart-item__thumb">
                <img
                  src={item.img} alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => e.target.style.display = "none"}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1917", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: 11, color: "#a8a29e", margin: "2px 0 0" }}>
                  Qty {item.qty}{item.size ? ` · ${item.size}` : ""}{item.color && item.color !== "Default" ? ` · ${item.color}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "#1c1917", margin: 0 }}>
                  {fmt(item.price * item.qty)}
                </p>
                <button
                  onClick={() => onRemove(item.id)}
                  style={{ background: "none", border: "none", color: "#a8a29e", cursor: "pointer", fontSize: 10, marginTop: 4, padding: 0, textDecoration: "underline" }}
                >
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: "14px 20px 22px", borderTop: "1px solid #f0ede8" }}>
            {[["Subtotal", fmt(total)], ["Gas (USDC)", "~0.001"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a8a29e", marginBottom: 4 }}>
                <span>{k}</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, color: "#1c1917", borderTop: "1px solid #f0ede8", paddingTop: 10, marginTop: 6, marginBottom: 14 }}>
              <span>Total</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14 }}>{fmt(total)}</span>
            </div>

            {/* Arc info pill */}
            <div className="arc-block" style={{ marginBottom: 12 }}>
              <div className="arc-block__icon">◎</div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#c47d2a", letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>Arc Blockchain · USDC</p>
                <p style={{ fontSize: 9, color: "#57534e", margin: "2px 0 0" }}>Sub-second finality · Circle L1</p>
              </div>
            </div>

            <button
              onClick={onCheckout}
              style={{
                width: "100%", background: "#f97316", color: "#fff",
                border: "none", borderRadius: 10, padding: "13px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}
            >
              {wallet ? "Pay with USDC on Arc →" : "Connect Wallet to Pay →"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
