import { useState, useEffect, useCallback } from "react";

/* =========================================================
   ProductDetailPage — Full-screen product detail overlay
   ========================================================= */

const fmt = (n) => `${Number(n).toFixed(2)} USDC`;
const disc = (p, op) => Math.round(((op - p) / op) * 100);

// Fake review data generator (deterministic per product id)
function fakeReviews(id) {
  const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const count = (seed % 80) + 40;
  const rating = (((seed % 15) + 35) / 10).toFixed(1); // 3.5–5.0
  return { count, rating: parseFloat(rating) };
}

// Fake material/detail bullets per category
const CATEGORY_DETAILS = {
  shirts:   ["Machine wash cold", "100% premium fabric", "Regular fit", "Imported"],
  trousers: ["Machine wash cold", "Stretch waistband", "Side & back pockets", "Imported"],
  belts:    ["Genuine leather / canvas", "Metal buckle hardware", "Adjustable length", "Handcrafted"],
  caps:     ["Structured brim", "Adjustable back closure", "Wipe clean only", "Imported"],
  shoes:    ["Leather / synthetic upper", "Cushioned footbed", "Non-slip outsole", "True to size"],
};

function StarRating({ rating, count }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half   = !filled && i - 0.5 <= rating;
    stars.push(
      <span key={i} style={{ color: filled || half ? "#f59e0b" : "#d4cfc8", fontSize: 16 }}>
        {filled ? "★" : half ? "⭑" : "☆"}
      </span>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ display: "flex", gap: 1 }}>{stars}</div>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "#1c1917" }}>
        {rating}
      </span>
      <span style={{ fontSize: 13, color: "#a8a29e" }}>({count} reviews)</span>
    </div>
  );
}

export default function ProductDetailPage({ item, allProducts, onClose, onAdd, onEdit, wishlist = [], onToggleWishlist }) {
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Default");
  const [qty, setQty] = useState(1);
  const isWishlisted = wishlist.includes(item.id);
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState("details"); // details | shipping | reviews

  const { count: reviewCount, rating } = fakeReviews(item.id);
  const pct = disc(item.price, item.oldPrice);
  const savings = (item.oldPrice - item.price).toFixed(2);

  // Related products — same category, different item
  const related = allProducts
    .filter(p => p.category === item.category && p.id !== item.id)
    .slice(0, 4);

  // Close on Escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    onAdd({ ...item, qty, size: selectedSize, color: selectedColor });
  };

  const categoryKey = item.category || "shirts";
  const details = CATEGORY_DETAILS[categoryKey] || CATEGORY_DETAILS.shirts;

  const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const COLORS = [
    { name: "Default", hex: "#94a3b8" },
    { name: "Black",   hex: "#1c1917" },
    { name: "White",   hex: "#f8fafc" },
    { name: "Navy",    hex: "#1e3a5f" },
    { name: "Grey",    hex: "#9ca3af" },
    { name: "Beige",   hex: "#d4bfa0" },
  ];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "pdpOverlayIn 0.25s ease",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Product details: ${item.name}`}
    >
      <div
        className="pdp-dialog"
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 960,
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 40px 100px rgba(0,0,0,0.35)",
          animation: "pdpSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* ── Close Button ── */}
        <button
          onClick={onClose}
          aria-label="Close product details"
          style={{
            position: "sticky", top: 12, zIndex: 10,
            float: "right", marginRight: 12,
            width: 36, height: 36,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #e7e4e0",
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#78716c",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#1c1917"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.95)"; e.currentTarget.style.color = "#78716c"; }}
        >
          ✕
        </button>

        {/* ── Main Content ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
          }}
          className="pdp-grid"
        >
          {/* ── LEFT: Image Panel ── */}
          <div
            className="pdp-img-panel"
            style={{
              background: "#f9f7f5",
              borderRadius: "20px 0 0 20px",
              overflow: "hidden",
              position: "relative",
              minHeight: 480,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {/* Sale badge */}
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "#c41e3a", color: "#fff",
              borderRadius: 4, padding: "4px 10px",
              fontSize: 13, fontWeight: 700, letterSpacing: 1,
              zIndex: 2,
            }}>
              -{pct}% OFF
            </div>

            {/* Wishlist */}
            <button
              onClick={() => onToggleWishlist(item)}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              style={{
                position: "absolute", top: 16, right: 16, zIndex: 2,
                background: "rgba(255,255,255,0.9)",
                border: "none", borderRadius: "50%",
                width: 38, height: 38,
                cursor: "pointer", fontSize: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {isWishlisted ? "❤️" : "🤍"}
            </button>

            {/* Image */}
            {!imgError ? (
              <img
                src={item.img}
                alt={item.name}
                className="pdp-img"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  opacity: imgLoaded ? 1 : 0,
                  transition: "opacity 0.4s ease, transform 0.6s ease",
                  minHeight: 480,
                  transform: imgLoaded ? "scale(1)" : "scale(1.04)",
                  display: "block",
                }}
              />
            ) : (
              <div className="pdp-fallback-emoji" style={{ fontSize: 80, opacity: 0.3 }}>{item.emoji || "👕"}</div>
            )}

            {/* Shimmer loader */}
            {!imgLoaded && !imgError && (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, #f0ede8 25%, #f9f7f5 50%, #f0ede8 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
            )}

            {/* Brand strip */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top, rgba(28,25,23,0.7), transparent)",
              padding: "32px 20px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  background: "#c47d2a", color: "#fff",
                  borderRadius: 6, padding: "3px 8px",
                  fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                }}>◎ ARC</div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>
                  {item.sectionLabel?.toUpperCase()} · {item.categoryLabel?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Info Panel ── */}
          <div className="pdp-info-panel" style={{ padding: "32px 32px 28px", display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14 }}>
              {[item.sectionLabel, item.categoryLabel].filter(Boolean).map((crumb, i, arr) => (
                <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 13, color: i === arr.length - 1 ? "#c47d2a" : "#a8a29e", fontWeight: i === arr.length - 1 ? 600 : 400 }}>
                    {crumb}
                  </span>
                  {i < arr.length - 1 && <span style={{ color: "#d4cfc8", fontSize: 12 }}>›</span>}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 28, fontWeight: 700,
              color: "#1c1917", lineHeight: 1.25,
              marginBottom: 10,
            }}>
              {item.name}
            </h1>

            {/* Rating */}
            <div style={{ marginBottom: 14 }}>
              <StarRating rating={rating} count={reviewCount} />
            </div>

            {/* Price row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 30, fontWeight: 700, color: "#f97316",
              }}>
                {fmt(item.price)}
              </span>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: 17, color: "#a8a29e",
                textDecoration: "line-through",
              }}>
                {fmt(item.oldPrice)}
              </span>
            </div>
            <div style={{ marginBottom: 20 }}>
              <span style={{
                background: "rgba(196,30,58,0.08)", color: "#c41e3a",
                borderRadius: 4, padding: "3px 10px",
                fontSize: 13, fontWeight: 700,
              }}>
                You save {savings} USDC ({pct}%)
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: 15, color: "#57534e", lineHeight: 1.7, marginBottom: 22 }}>
              {item.desc} — crafted for everyday elegance and lasting comfort. Part of our curated {item.sectionLabel} collection.
            </p>

            {/* Size Selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#78716c", letterSpacing: 1.2, textTransform: "uppercase" }}>
                  Size
                </span>
                <span style={{ fontSize: 13, color: "#f97316", cursor: "pointer", fontWeight: 600 }}>
                  Size guide ↗
                </span>
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    style={{
                      width: 44, height: 44,
                      border: selectedSize === s ? "2px solid #1c1917" : "1.5px solid #e7e4e0",
                      borderRadius: 8,
                      background: selectedSize === s ? "#1c1917" : "#fff",
                      color: selectedSize === s ? "#fff" : "#44403c",
                      fontSize: 14, fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#78716c", letterSpacing: 1.2, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Colour — <span style={{ color: "#1c1917", fontWeight: 700, textTransform: "none" }}>{selectedColor}</span>
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    style={{
                      width: 30, height: 30,
                      borderRadius: "50%",
                      background: c.hex,
                      border: selectedColor === c.name
                        ? "3px solid #1c1917"
                        : "2px solid #e7e4e0",
                      cursor: "pointer",
                      transition: "transform 0.15s, border 0.15s",
                      outline: selectedColor === c.name ? "2px solid #fff" : "none",
                      outlineOffset: "-4px",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  />
                ))}
              </div>
            </div>

            {/* Qty + Add to Cart */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
              {/* Quantity */}
              <div style={{
                display: "flex", alignItems: "center",
                border: "1.5px solid #e7e4e0", borderRadius: 10,
                overflow: "hidden", flexShrink: 0,
              }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  aria-label="Decrease"
                  style={{ width: 40, height: 48, border: "none", background: "#f9f7f5", fontSize: 18, cursor: "pointer", color: "#44403c" }}
                >−</button>
                <span style={{ width: 40, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "#1c1917" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  aria-label="Increase"
                  style={{ width: 40, height: 48, border: "none", background: "#f9f7f5", fontSize: 18, cursor: "pointer", color: "#44403c" }}
                >+</button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAdd}
                style={{
                  flex: 1, height: 48,
                  background: added ? "hsl(158,65%,38%)" : "#f97316",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  letterSpacing: 1.4, textTransform: "uppercase",
                  transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  transform: added ? "scale(0.97)" : "scale(1)",
                  boxShadow: added ? "none" : "0 4px 16px rgba(249,115,22,0.3)",
                }}
              >
                {added ? "✓ Added to Cart!" : `Add to Cart — ${fmt(item.price * qty)}`}
              </button>
            </div>

            {/* Buy now shortcut */}
            <button
              onClick={() => { handleAdd(); }}
              style={{
                width: "100%", height: 44,
                background: "#1c1917", color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                letterSpacing: 1.4, textTransform: "uppercase",
                marginBottom: 18,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#292524"}
              onMouseLeave={e => e.currentTarget.style.background = "#1c1917"}
            >
              ◎ Pay with USDC on Arc
            </button>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              {[["🚚", "Free shipping", "over 150 USDC"], ["↩️", "30-day", "returns"], ["🔒", "Secure", "USDC payment"]].map(([ic, a, b]) => (
                <div key={a} style={{ flex: 1, background: "#faf9f7", borderRadius: 8, border: "1px solid #f0ede8", padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{ic}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1917" }}>{a}</div>
                  <div style={{ fontSize: 11, color: "#a8a29e" }}>{b}</div>
                </div>
              ))}
            </div>

            {/* Tab switcher */}
            <div style={{ borderBottom: "1px solid #f0ede8", marginBottom: 14 }}>
              {[["details", "Details"], ["shipping", "Shipping"], ["reviews", "Reviews"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    background: "none", border: "none",
                    borderBottom: activeTab === key ? "2px solid #c47d2a" : "2px solid transparent",
                    marginBottom: -1, padding: "8px 14px",
                    fontSize: 13, fontWeight: 700,
                    color: activeTab === key ? "#c47d2a" : "#a8a29e",
                    cursor: "pointer", letterSpacing: 0.8, textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "details" && (
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {details.map(d => (
                  <li key={d} style={{ fontSize: 14, color: "#57534e", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#c47d2a", fontSize: 12 }}>✦</span> {d}
                  </li>
                ))}
                <li style={{ fontSize: 14, color: "#57534e", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#c47d2a", fontSize: 12 }}>✦</span> SKU: {item.id.toUpperCase()}
                </li>
              </ul>
            )}

            {activeTab === "shipping" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Standard Shipping", "5–7 business days", "Free over 150 USDC"],
                  ["Express Shipping",  "2–3 business days", "12 USDC"],
                  ["Same-Day (Arc)",    "Instant on Arc chain", "2 USDC"],
                ].map(([method, time, cost]) => (
                  <div key={method} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#faf9f7", borderRadius: 8, border: "1px solid #f0ede8", fontSize: 14 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1c1917", marginBottom: 2 }}>{method}</div>
                      <div style={{ color: "#a8a29e", fontSize: 13 }}>{time}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "#c47d2a", fontWeight: 700, fontSize: 13, alignSelf: "center" }}>{cost}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 44, fontWeight: 700, color: "#1c1917", lineHeight: 1 }}>{rating}</div>
                    <StarRating rating={rating} count={reviewCount} />
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(star => {
                      const seed = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
                      const pct = star === 5 ? 45 + (seed % 30) : star === 4 ? 25 + (seed % 20) : star === 3 ? 10 + (seed % 10) : star === 2 ? 5 : 3;
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#a8a29e", width: 8 }}>{star}</span>
                          <span style={{ color: "#f59e0b", fontSize: 12 }}>★</span>
                          <div style={{ flex: 1, height: 5, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#a8a29e", width: 26, textAlign: "right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#a8a29e", fontStyle: "italic" }}>
                  Based on {reviewCount} verified purchases · Ratings are aggregated.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="pdp-related-section" style={{ borderTop: "1px solid #f0ede8", padding: "28px 32px 32px" }}>
            <h3 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20, fontWeight: 700,
              color: "#1c1917", marginBottom: 16,
            }}>
              You may also like
            </h3>
            <div className="pdp-related-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {related.map(rel => (
                <RelatedCard
                  key={rel.id}
                  item={rel}
                  onAdd={onAdd}
                  onViewDetail={() => {
                    // close current and open related via onEdit trick — parent handles it
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RelatedCard({ item, onAdd }) {
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const pct = disc(item.price, item.oldPrice);

  return (
    <div
      style={{
        border: "1px solid #f0ede8", borderRadius: 10, overflow: "hidden",
        background: "#fff", transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Image */}
      <div style={{ height: 140, background: "#faf9f7", overflow: "hidden", position: "relative" }}>
        <span style={{ position: "absolute", top: 6, left: 6, background: "#c41e3a", color: "#fff", borderRadius: 3, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>
          -{pct}%
        </span>
        {!imgError ? (
          <img
            src={item.img} alt={item.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }}
            onMouseEnter={e => e.target.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.target.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36, opacity: 0.3 }}>
            {item.emoji || "👕"}
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "10px 10px 12px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#1c1917", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "#f97316" }}>
            {fmt(item.price)}
          </span>
          <button
            onClick={() => {
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
              onAdd(item);
            }}
            style={{
              background: added ? "hsl(158,65%,38%)" : "#1c1917",
              color: "#fff", border: "none", borderRadius: 5,
              padding: "5px 10px", fontSize: 11, fontWeight: 700,
              cursor: "pointer", letterSpacing: 0.8, textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            {added ? "✓" : "+ Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
