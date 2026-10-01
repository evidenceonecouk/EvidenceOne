import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// In development, run the Vercel functions in api/ inside the Vite server so
// `npm run dev` behaves like production. On Vercel these run as serverless functions.
function vercelApiDev(): Plugin {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      // Expose server-only env vars (no VITE_ prefix) to the handlers, never to the client.
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
        if (!url.pathname.startsWith('/api/')) return next()

        try {
          const mod = await server.ssrLoadModule(`${url.pathname}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const response: Response = await handler(
            new Request(url, { method: req.method, headers: req.headers as Record<string, string> }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.config.logger.error(String(err))
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Not found' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vercelApiDev()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
