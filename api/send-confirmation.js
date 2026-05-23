export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customerEmail, customerWallet, items, total, txHash } = req.body;

  // Build items HTML
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:sans-serif;font-size:13px;color:#1c1917;">
        ${item.name} × ${item.qty}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:'Courier New',monospace;font-size:13px;color:#1c1917;text-align:right;">
        ${Number(item.price * item.qty).toFixed(2)} USDC
      </td>
    </tr>
  `).join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f3f0;font-family:sans-serif;">

      <!-- Header -->
      <div style="background:#1c1917;padding:24px 32px;text-align:center;">
        <h1 style="color:#c47d2a;font-size:24px;margin:0;letter-spacing:2px;">ARCWEAR</h1>
        <p style="color:#78716c;font-size:11px;margin:4px 0 0;letter-spacing:1.5px;text-transform:uppercase;">Agentic · Arc Blockchain</p>
      </div>

      <!-- Status Banner -->
      <div style="background:#f97316;padding:16px 32px;text-align:center;">
        <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">✓ Order Confirmed</p>
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;">Your payment has been received on Arc Blockchain</p>
      </div>

      <!-- Main Card -->
      <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Order Info -->
        <div style="padding:24px 28px;border-bottom:1px solid #f0ede8;">
          <p style="font-size:13px;color:#78716c;margin:0 0 4px;">Order placed</p>
          <p style="font-size:15px;font-weight:700;color:#1c1917;margin:0;">${new Date().toDateString()}</p>
        </div>

        <!-- Order Tracker -->
        <div style="padding:20px 28px;border-bottom:1px solid #f0ede8;text-align:center;">
          <div style="display:flex;justify-content:space-between;align-items:center;max-width:400px;margin:0 auto;">
            ${["Confirmed","Processing","Shipped","Delivered"].map((s, i) => `
              <div style="text-align:center;flex:1;">
                <div style="width:28px;height:28px;border-radius:50%;background:${i===0?"#f97316":"#f0ede8"};border:2px solid ${i===0?"#f97316":"#e7e4e0"};margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">
                  ${i===0?`<span style="color:#fff;font-size:12px;font-weight:700;">✓</span>`:`<span style="color:#a8a29e;font-size:10px;">${i+1}</span>`}
                </div>
                <p style="font-size:10px;color:${i===0?"#f97316":"#a8a29e"};margin:0;font-weight:${i===0?"700":"400"};">${s}</p>
              </div>
              ${i<3?`<div style="flex:1;height:2px;background:${i===0?"#f97316":"#f0ede8"};margin-bottom:20px;"></div>`:""}
            `).join("")}
          </div>
        </div>

        <!-- Items -->
        <div style="padding:20px 28px;border-bottom:1px solid #f0ede8;">
          <p style="font-size:12px;font-weight:700;color:#78716c;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 12px;">Items Ordered</p>
          <table style="width:100%;border-collapse:collapse;">
            ${itemRows}
            <tr>
              <td style="padding:10px 12px 4px;font-size:12px;color:#a8a29e;font-family:sans-serif;">Shipping</td>
              <td style="padding:10px 12px 4px;font-size:12px;color:#22c55e;text-align:right;font-weight:700;">FREE</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#1c1917;font-family:sans-serif;">Order Total</td>
              <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#1c1917;text-align:right;font-family:'Courier New',monospace;">${Number(total).toFixed(2)} USDC</td>
            </tr>
          </table>
        </div>

        <!-- Payment Info -->
        <div style="padding:20px 28px;background:#1c1917;border-radius:0 0 12px 12px;">
          <p style="font-size:12px;font-weight:700;color:#c47d2a;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 12px;">⚡ Arc Blockchain Payment</p>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#57534e;">Wallet</span>
            <span style="font-size:11px;color:#a8a29e;font-family:'Courier New',monospace;">${customerWallet.slice(0,6)}…${customerWallet.slice(-4)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#57534e;">Network</span>
            <span style="font-size:11px;color:#a8a29e;">Arc Testnet</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:11px;color:#57534e;">Tx Hash</span>
            <span style="font-size:10px;color:#a8a29e;font-family:'Courier New',monospace;">${txHash ? txHash.slice(0,12)+"…" : "Confirmed"}</span>
          </div>
        </div>
      </div>

      <!-- Trust badges -->
      <div style="max-width:560px;margin:0 auto 24px;background:#fff;border-radius:12px;padding:20px 28px;">
        ${[
          ["🛡️", "Purchase Protection", "Shop confidently — if something goes wrong we've got your back."],
          ["🔒", "Secure Privacy", "Your payment info is safe. We never store or share your wallet data."],
          ["↩️", "Easy Returns", "Not satisfied? Returns accepted within 30 days of delivery."],
        ].map(([icon, title, desc]) => `
          <div style="display:flex;gap:12px;margin-bottom:16px;">
            <span style="font-size:22px;flex-shrink:0;">${icon}</span>
            <div>
              <p style="font-size:13px;font-weight:700;color:#1c1917;margin:0 0 3px;">${title}</p>
              <p style="font-size:11px;color:#78716c;margin:0;line-height:1.5;">${desc}</p>
              <p style="font-size:11px;color:#f97316;margin:4px 0 0;cursor:pointer;">Learn more ›</p>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Footer -->
      <div style="max-width:560px;margin:0 auto;padding:0 0 32px;text-align:center;">
        <p style="font-size:11px;color:#a8a29e;margin:0 0 8px;">Find us on</p>
        <div style="display:flex;justify-content:center;gap:12px;margin-bottom:16px;">
          <a href="#" style="color:#1877f2;font-size:20px;text-decoration:none;">f</a>
          <a href="#" style="color:#e1306c;font-size:20px;text-decoration:none;">ig</a>
          <a href="#" style="color:#000;font-size:20px;text-decoration:none;">𝕏</a>
        </div>
        <p style="font-size:10px;color:#c8c3bc;margin:0;">© 2026 ArcWear · Powered by Arc Blockchain</p>
        <p style="font-size:10px;color:#c8c3bc;margin:4px 0 0;">
          <a href="#" style="color:#c8c3bc;">Privacy Policy</a> · 
          <a href="#" style="color:#c8c3bc;">Terms</a> · 
          <a href="#" style="color:#c8c3bc;">Unsubscribe</a>
        </p>
      </div>

    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ArcWear <orders@yourdomain.com>",
        to: customerEmail,
        subject: `✓ Your ArcWear Order is Confirmed!`,
        html: emailHtml,
      }),
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}