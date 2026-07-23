import { useState } from "react";
import { fmt } from "../utils";

export default function EditModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("Default");
  const [added, setAdded] = useState(false);

  const handleSave = (e) => {
    setAdded(true);
    setTimeout(() => onSave({ ...item, qty, size, color }, e), 600);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.55)", zIndex: 3000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div className="edit-dialog">
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", borderBottom: "1px solid #f0ede8",
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "#f5f3f0", flexShrink: 0 }}>
            <img
              src={item.img} alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={e => e.target.style.display = "none"}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>{item.name}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 15, color: "#2563eb", margin: "4px 0 0" }}>{fmt(item.price)}</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px" }}>
          {/* Size */}
          {(item.section === "fashion" || item.sectionLabel === "Fashion") && (
            <div style={{ marginBottom: 16 }}>
              <span className="label">Size</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["XS", "S", "M", "L", "XL", "XXL"].map(s => (
                  <button
                    key={s}
                    className={`option-btn${size === s ? " active" : ""}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colour */}
          <div style={{ marginBottom: 16 }}>
            <span className="label">Colour</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Default", "Black", "White", "Navy", "Grey", "Beige"].map(c => (
                <button
                  key={c}
                  className={`option-btn${color === c ? " active" : ""}`}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: 20 }}>
            <span className="label">Quantity</span>
            <div className="qty-stepper">
              <button className="qty-stepper__btn" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className="qty-stepper__value" aria-live="polite">{qty}</span>
              <button className="qty-stepper__btn" onClick={() => setQty(q => q + 1)} aria-label="Increase quantity">+</button>
            </div>
          </div>

          <button
            onClick={handleSave}
            style={{
              width: "100%",
              background: added ? "#10b981" : "#2563eb",
              color: "#fff", border: "none", borderRadius: 10,
              padding: "13px", fontSize: 14, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              transition: "all .25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              transform: added ? "scale(0.96)" : "scale(1)",
            }}
          >
            {added ? "✓ Added to Cart!" : `Add to Cart — ${fmt(item.price * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
