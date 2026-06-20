import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Inject env vars into process.env so API handlers can access them
  // (Vite's loadEnv only populates the local `env` variable, not process.env)
  Object.assign(process.env, env)

  return {
    optimizeDeps: {
      exclude: ['@vercel/kv'],
    },
    build: {
      rollupOptions: {
        external: ['@vercel/kv'],
      },
    },
    plugins: [
      react(),
      // Inline API plugin — handles /api/* routes during dev
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use('/api/send-confirmation', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { customerEmail, customerWallet, items, total, txHash } = JSON.parse(body)

                const itemRows = items.map(item => `
                  <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:sans-serif;font-size:13px;color:#1c1917;">
                      ${item.name} × ${item.qty}
                    </td>
                    <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;font-family:monospace;font-size:13px;color:#1c1917;text-align:right;">
                      ${Number(item.price * item.qty).toFixed(2)} USDC
                    </td>
                  </tr>
                `).join('')

                const emailHtml = `
                  <!DOCTYPE html>
                  <html>
                  <body style="margin:0;padding:0;background:#f5f3f0;font-family:sans-serif;">
                    <div style="background:#1c1917;padding:24px 32px;text-align:center;">
                      <p style="color:#c47d2a;font-size:22px;font-weight:800;margin:0;">◎ ARCWEAR</p>
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
                          <span style="font-size:11px;color:#a8a29e;font-family:monospace;">${customerWallet ? customerWallet.slice(0,6)+'…'+customerWallet.slice(-4) : 'N/A'}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                          <span style="font-size:11px;color:#57534e;">Network</span>
                          <span style="font-size:11px;color:#a8a29e;">Arc Testnet</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;">
                          <span style="font-size:11px;color:#57534e;">Tx Hash</span>
                          <span style="font-size:10px;font-family:monospace;">
                            ${txHash ? `<a href="https://testnet.arcscan.app/tx/${txHash}" target="_blank" style="color:#f97316;text-decoration:none;">${txHash.slice(0,12)}… ↗</a>` : 'Confirmed'}
                          </span>
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
                `

                const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'api-key': env.BREVO_API_KEY,
                  },
                  body: JSON.stringify({
                    sender: { name: 'ArcWear', email: 'dannymark67@gmail.com' },
                    to: [{ email: customerEmail, name: customerEmail }],
                    subject: '✓ Your ArcWear Order is Confirmed!',
                    htmlContent: emailHtml,
                  }),
                })

                const data = await brevoRes.json()

                if (!brevoRes.ok) {
                  console.error('[send-confirmation] Brevo error:', data)
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: false, error: data }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: true, data }))
              } catch (err) {
                console.error('[send-confirmation] Error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
          })

          // ── Agent API (Groq) ──
          server.middlewares.use('/api/agent', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { default: handler } = await import('./api/agent.js')
                const parsed = JSON.parse(body)
                const fakeReq = { method: 'POST', body: parsed }
                const fakeRes = {
                  statusCode: 200,
                  _headers: {},
                  status(code) { this.statusCode = code; return this },
                  setHeader(k, v) { this._headers[k] = v },
                  json(data) {
                    res.statusCode = this.statusCode
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                }
                await handler(fakeReq, fakeRes)
              } catch (err) {
                console.error('[api/agent] Dev error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          // ── Agent Pay API (Circle Autonomous Checkout) ──
          server.middlewares.use('/api/agent-pay', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { default: handler } = await import('./api/agent-pay.js')
                const parsed = JSON.parse(body)
                const fakeReq = { method: 'POST', body: parsed }
                const fakeRes = {
                  statusCode: 200,
                  _headers: {},
                  status(code) { this.statusCode = code; return this },
                  setHeader(k, v) { this._headers[k] = v },
                  json(data) {
                    res.statusCode = this.statusCode
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                }
                await handler(fakeReq, fakeRes)
              } catch (err) {
                console.error('[api/agent-pay] Dev error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          // ── Orders API ──
          server.middlewares.use('/api/orders', async (req, res) => {
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { default: handler } = await import('./api/orders.js')
                const url = new URL(req.url, 'http://localhost')
                const fakeReq = {
                  method: req.method,
                  query: Object.fromEntries(url.searchParams.entries()),
                  body: body ? JSON.parse(body) : {},
                }
                const fakeRes = {
                  statusCode: 200,
                  _headers: {},
                  status(code) { this.statusCode = code; return this },
                  setHeader(k, v) { this._headers[k] = v },
                  end(data) {
                    res.statusCode = this.statusCode
                    Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
                    res.end(data)
                  },
                  json(data) {
                    res.statusCode = this.statusCode
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                }
                await handler(fakeReq, fakeRes)
              } catch (err) {
                console.error('[api/orders] Dev error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
          // ── Escrow API (ERC-8183 AgenticCommerce) ──
          server.middlewares.use('/api/escrow', async (req, res) => {
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { default: handler } = await import('./api/escrow.js')
                const url = new URL(req.url, 'http://localhost')
                const fakeReq = {
                  method: req.method,
                  query: Object.fromEntries(url.searchParams.entries()),
                  body: body ? JSON.parse(body) : {},
                }
                const fakeRes = {
                  statusCode: 200,
                  _headers: {},
                  status(code) { this.statusCode = code; return this },
                  setHeader(k, v) { this._headers[k] = v },
                  end(data) {
                    res.statusCode = this.statusCode
                    Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
                    res.end(data)
                  },
                  json(data) {
                    res.statusCode = this.statusCode
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                }
                await handler(fakeReq, fakeRes)
              } catch (err) {
                console.error('[api/escrow] Dev error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })

          // ── History API (Persistent Chat History) ──
          server.middlewares.use('/api/history', async (req, res) => {
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                const { default: handler } = await import('./api/history.js')
                const url = new URL(req.url, 'http://localhost')
                const fakeReq = {
                  method: req.method,
                  query: Object.fromEntries(url.searchParams.entries()),
                  body: body ? JSON.parse(body) : {},
                }
                const fakeRes = {
                  statusCode: 200,
                  _headers: {},
                  status(code) { this.statusCode = code; return this },
                  setHeader(k, v) { this._headers[k] = v },
                  end(data) {
                    res.statusCode = this.statusCode
                    Object.entries(this._headers).forEach(([k, v]) => res.setHeader(k, v))
                    res.end(data)
                  },
                  json(data) {
                    res.statusCode = this.statusCode
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify(data))
                  },
                }
                await handler(fakeReq, fakeRes)
              } catch (err) {
                console.error('[api/history] Dev error:', err)
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
