import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Connect, Plugin } from 'vite'

function createHelenaProxyMiddleware(
  baseUrl: string,
  token: string | undefined,
): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/helena/sessions')) {
      next()
      return
    }

    if (req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: true, text: 'Method not allowed' }))
      return
    }

    if (!token) {
      res.statusCode = 500
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: true,
          text: 'HELENA_API_TOKEN nao configurado no ambiente local',
        }),
      )
      return
    }

    try {
      const incomingUrl = new URL(req.url, 'http://localhost')
      const targetUrl = new URL('/chat/v2/session', baseUrl)
      targetUrl.search = incomingUrl.searchParams.toString()

      const response = await fetch(targetUrl, {
        headers: {
          Authorization: token,
          accept: 'application/json',
        },
      })

      const responseText = await response.text()
      res.statusCode = response.status
      res.setHeader(
        'content-type',
        response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      )
      res.setHeader('cache-control', 'no-store')
      res.end(responseText)
    } catch (error) {
      res.statusCode = 502
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(
        JSON.stringify({
          error: true,
          text: error instanceof Error ? error.message : 'Erro ao consultar Helena API',
        }),
      )
    }
  }
}

function helenaProxyPlugin(baseUrl: string, token: string | undefined): Plugin {
  const middleware = createHelenaProxyMiddleware(baseUrl, token)

  return {
    name: 'helena-local-proxy',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const helenaApiBaseUrl = env.HELENA_API_BASE_URL || 'https://api.helena.run'
  const helenaApiToken = env.HELENA_API_TOKEN

  return {
    plugins: [react(), helenaProxyPlugin(helenaApiBaseUrl, helenaApiToken)],
  }
})
