import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/clinicorp')) return next()

        // Parse query string
        const urlObj = new URL(req.url, 'http://localhost')
        req.query = Object.fromEntries(urlObj.searchParams)

        // Parse JSON body for POST
        if (req.method === 'POST') {
          req.body = await new Promise((resolve) => {
            let raw = ''
            req.on('data', chunk => { raw += chunk })
            req.on('end', () => {
              try { resolve(JSON.parse(raw)) } catch { resolve({}) }
            })
          })
        }

        // Response shim compatible with Next.js/Express-style handlers
        let statusCode = 200
        const sendJson = (data) => {
          if (!res.headersSent) {
            res.writeHead(statusCode, { 'Content-Type': 'application/json' })
          }
          res.end(JSON.stringify(data))
        }
        res.status = (code) => { statusCode = code; return { json: sendJson } }
        res.json   = sendJson

        try {
          const { default: handler } = await import('./api/clinicorp.js')
          await handler(req, res)
        } catch (err) {
          console.error('[local-api] clinicorp error:', err)
          if (!res.headersSent) res.status(500).json({ error: err.message })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 5175,
    proxy: {
      '/api/core': {
        target: 'https://api.wts.chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/crm': {
        target: 'https://api.wts.chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
