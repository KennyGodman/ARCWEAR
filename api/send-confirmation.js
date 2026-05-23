export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customerEmail, customerWallet, items, total, txHash } = req.body;

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:sans-serif;font-size:13px;color:#1c1917;">
        ${item.name} × ${item.qty}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:monospace;font-size:13px;color:#1c1917;text-align:right;">
        ${Number(item.price * item.qty).toFixed(2)} USDC
      </td>
    </tr>
  `).join("");

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f3f0;font-family:sans-serif;">
      <div style="background:#1c1917;padding:24px 32px;text-align:center;">
        <h1 style="color:#c47d2a;font-size:24px;margin:0;letter-spacing:2px;">ARCWEAR</h1>
        <p style="color:#78716c;font-size:11px;margin:4px 0 0;letter-spacing:1.5px;text-transform:uppercase;">Arc Blockchain</p>
      </div>
      <div style="background:#f97316;padding:16px 32px;text-align:center;">
        <p style="color:#fff;font-size:16px;font-weight:700;margin:0;">✓ Order Confirmed</p>
        <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0;">Your payment has been received on Arc Blockchain</p>
      </div>
      <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="padding:24px 28px;border-bottom:1px solid #f0ede8;">
          <p style="font-size:13px;color:#78716c;margin:0 0 4px;">Order placed</p>
          <p style="font-size:15px;font-weight:700;color:#1c1917;margin:0;">${new Date().toDateString()}</p>
        </div>
        <div style="padding:20px 28px;border-bottom:1px solid #f0ede8;">
          <p style="font-size:12px;font-weight:700;color:#78716c;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 12px;">Items Ordered</p>
          <table style="width:100%;border-collapse:collapse;">
            ${itemRows}
            <tr>
              <td style="padding:10px 12px 4px;font-size:12px;color:#a8a29e;">Shipping</td>
              <td style="padding:10px 12px 4px;font-size:12px;color:#22c55e;text-align:right;font-weight:700;">FREE</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#1c1917;">Order Total</td>
              <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#1c1917;text-align:right;font-family:monospace;">${Number(total).toFixed(2)} USDC</td>
            </tr>
          </table>
        </div>
        <div style="padding:20px 28px;background:#1c1917;border-radius:0 0 12px 12px;">
          <p style="font-size:12px;font-weight:700;color:#c47d2a;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 12px;">⚡ Arc Blockchain Payment</p>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#57534e;">Wallet</span>
            <span style="font-size:11px;color:#a8a29e;font-family:monospace;">${customerWallet ? customerWallet.slice(0,6)+"…"+customerWallet.slice(-4) : "N/A"}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:#57534e;">Network</span>
            <span style="font-size:11px;color:#a8a29e;">Arc Testnet</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="font-size:11px;color:#57534e;">Tx Hash</span>
            <span style="font-size:10px;color:#a8a29e;font-family:monospace;">${txHash ? txHash.slice(0,12)+"…" : "Confirmed"}</span>
          </div>
        </div>
      </div>
      <div style="max-width:560px;margin:0 auto 24px;background:#fff;border-radius:12px;padding:20px 28px;">
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <span style="font-size:22px;">🛡️</span>
          <div>
            <p style="font-size:13px;font-weight:700;color:#1c1917;margin:0 0 3px;">Purchase Protection</p>
            <p style="font-size:11px;color:#78716c;margin:0;line-height:1.5;">Shop confidently — if something goes wrong we have got your back.</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <span style="font-size:22px;">🔒</span>
          <div>
            <p style="font-size:13px;font-weight:700;color:#1c1917;margin:0 0 3px;">Secure Privacy</p>
            <p style="font-size:11px;color:#78716c;margin:0;line-height:1.5;">Your payment info is safe. We never store or share your wallet data.</p>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <span style="font-size:22px;">↩️</span>
          <div>
            <p style="font-size:13px;font-weight:700;color:#1c1917;margin:0 0 3px;">Easy Returns</p>
            <p style="font-size:11px;color:#78716c;margin:0;line-height:1.5;">Not satisfied? Returns accepted within 30 days of delivery.</p>
          </div>
        </div>
      </div>
      <div style="max-width:560px;margin:0 auto;padding:0 0 32px;text-align:center;">
        <p style="font-size:10px;color:#c8c3bc;margin:0;">© 2026 ArcWear · Powered by Arc Blockchain</p>
        <p style="font-size:10px;color:#c8c3bc;margin:4px 0 0;">Privacy Policy · Terms · Unsubscribe</p>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "ArcWear",
          email: "kennydaniels138@gmail.com",
        },
        to: [
          {
            email: customerEmail,
            name: customerEmail,
          }
        ],
        subject: "✓ Your ArcWear Order is Confirmed!",
        htmlContent: emailHtml,
      }),
    });

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}