const DEFAULT_BASE_URL = 'https://api.helena.run'

function sendJson(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.send(JSON.stringify(body))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, {
      error: true,
      text: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    })
    return
  }

  const token = process.env.HELENA_API_TOKEN
  const baseUrl = process.env.HELENA_API_BASE_URL || DEFAULT_BASE_URL

  if (!token) {
    sendJson(res, 500, {
      error: true,
      text: 'A integracao da API nao esta configurada no ambiente.',
      code: 'MISSING_API_TOKEN',
    })
    return
  }

  try {
    const search = new URLSearchParams(req.query).toString()
    const targetUrl = new URL('/chat/v2/session', baseUrl)
    targetUrl.search = search

    const response = await fetch(targetUrl, {
      headers: {
        Authorization: token,
        accept: 'application/json',
      },
    })

    const responseText = await response.text()

    res.status(response.status)
    res.setHeader(
      'content-type',
      response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    )
    res.setHeader('cache-control', 'no-store')
    res.send(responseText)
  } catch (error) {
    sendJson(res, 502, {
      error: true,
      text: error instanceof Error ? error.message : 'Erro ao consultar a integracao de dados',
      code: 'UPSTREAM_ERROR',
    })
  }
}
