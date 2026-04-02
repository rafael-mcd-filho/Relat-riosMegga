import type { Filters, HelenaSessionsDataset, HelenaSessionsPage } from '../types'

const SESSION_PROXY_PATHS = ['/api/helena/sessions.php', '/api/helena/sessions']
const DEFAULT_PAGE_SIZE = 100

type SessionQueryOverrides = {
  pageNumber?: number
  pageSize?: number
}

type HelenaApiErrorPayload = {
  message?: string | string[]
  error?: string
  title?: string
  detail?: string
  text?: string
  code?: string | number
  status?: string | number
  statusCode?: string | number
}

export class HelenaApiError extends Error {
  code: string
  status: number | null

  constructor(message: string, code: string, status: number | null = null) {
    super(message)
    this.name = 'HelenaApiError'
    this.code = code
    this.status = status
  }
}

function sanitizePublicErrorMessage(message: string) {
  const normalized = message
    .replace(/HELENA_API_TOKEN/gi, 'API_TOKEN')
    .replace(/Helena API/gi, 'integracao de dados')
    .replace(/Helena/gi, 'integracao')

  return normalized
}

function getStatusFallbackMessage(status: number) {
  const messages: Record<number, string> = {
    400: 'A consulta enviada para a API e invalida.',
    401: 'A API recusou a autenticacao da consulta.',
    403: 'A API bloqueou o acesso a esta consulta.',
    404: 'O endpoint de atendimentos nao foi encontrado.',
    408: 'A consulta demorou demais para responder.',
    429: 'A API atingiu o limite de requisicoes.',
    500: 'A API retornou um erro interno.',
    502: 'A API retornou uma resposta invalida.',
    503: 'A API esta indisponivel no momento.',
    504: 'A API nao respondeu a tempo.',
  }

  return messages[status] ?? 'Nao foi possivel concluir a consulta na API.'
}

function parseErrorPayload(responseText: string) {
  try {
    return JSON.parse(responseText) as HelenaApiErrorPayload
  } catch {
    return null
  }
}

function pickErrorMessage(payload: HelenaApiErrorPayload | null, status: number) {
  if (!payload) {
    return getStatusFallbackMessage(status)
  }

  const message = payload.message

  if (Array.isArray(message) && message[0]) {
    return sanitizePublicErrorMessage(String(message[0]))
  }

  if (typeof message === 'string' && message.trim()) {
    return sanitizePublicErrorMessage(message)
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return sanitizePublicErrorMessage(payload.detail)
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    return sanitizePublicErrorMessage(payload.title)
  }

  if (typeof payload.error === 'string' && payload.error.trim()) {
    return sanitizePublicErrorMessage(payload.error)
  }

  if (typeof payload.text === 'string' && payload.text.trim()) {
    return sanitizePublicErrorMessage(payload.text)
  }

  return getStatusFallbackMessage(status)
}

function pickErrorCode(payload: HelenaApiErrorPayload | null, status: number) {
  if (!payload) {
    return String(status)
  }

  const rawCode = payload.code ?? payload.statusCode ?? payload.status

  if (rawCode === undefined || rawCode === null || rawCode === '') {
    return String(status)
  }

  return String(rawCode)
}

export function formatApiDateBoundary(
  value: string,
  boundary: 'start' | 'end',
) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (boundary === 'start') {
    date.setHours(0, 0, 0, 0)
    return date.toISOString()
  }

  date.setHours(23, 59, 59, 999)
  return date.toISOString()
}

export function buildSessionQueryParams(
  filters: Filters,
  overrides: SessionQueryOverrides = {},
) {
  const params = new URLSearchParams()

  if (filters.teamId) {
    params.set('DepartmentId', filters.teamId)
  }

  if (filters.userId) {
    params.set('UserId', filters.userId)
  }

  filters.channelIds.forEach((channelId) => {
    params.append('ChannelsId', channelId)
  })

  params.set('CreatedAt.After', formatApiDateBoundary(filters.startDate, 'start'))
  params.set('CreatedAt.Before', formatApiDateBoundary(filters.endDate, 'end'))
  params.set('pageNumber', String(overrides.pageNumber ?? 1))
  params.set('pageSize', String(overrides.pageSize ?? DEFAULT_PAGE_SIZE))

  return params
}

export function buildSessionRequestPreview(filters: Filters) {
  const params = buildSessionQueryParams(filters)

  return {
    combinationRule: {
      channels: 'OU por repeticao de ChannelsId',
      team: 'Selecao unica',
      user: 'Selecao unica',
      betweenFilters: 'E',
    },
    selectedFilters: {
      channelIds: filters.channelIds,
      teamId: filters.teamId,
      userId: filters.userId,
      createdAtAfter: formatApiDateBoundary(filters.startDate, 'start'),
      createdAtBefore: formatApiDateBoundary(filters.endDate, 'end'),
    },
    sentToApi: {
      DepartmentId: filters.teamId,
      UserId: filters.userId,
      ChannelsId: filters.channelIds,
      'CreatedAt.After': formatApiDateBoundary(filters.startDate, 'start'),
      'CreatedAt.Before': formatApiDateBoundary(filters.endDate, 'end'),
      pageNumber: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    },
    firstPageQueryString: params.toString(),
  }
}

async function fetchSessionsPage(
  filters: Filters,
  pageNumber: number,
  signal?: AbortSignal,
) {
  const params = buildSessionQueryParams(filters, {
    pageNumber,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  for (let index = 0; index < SESSION_PROXY_PATHS.length; index += 1) {
    const proxyPath = SESSION_PROXY_PATHS[index]
    const response = await fetch(`${proxyPath}?${params.toString()}`, {
      headers: {
        accept: 'application/json',
      },
      signal,
    })

    const responseText = await response.text()
    const isLastProxy = index === SESSION_PROXY_PATHS.length - 1

    if (!response.ok) {
      if (response.status === 404 && !isLastProxy) {
        continue
      }

      const payload = parseErrorPayload(responseText)
      throw new HelenaApiError(
        pickErrorMessage(payload, response.status),
        pickErrorCode(payload, response.status),
        response.status,
      )
    }

    try {
      return JSON.parse(responseText) as HelenaSessionsPage
    } catch {
      throw new HelenaApiError(
        'A API retornou um JSON invalido.',
        'INVALID_JSON',
        response.status,
      )
    }
  }

  throw new HelenaApiError('O endpoint de atendimentos nao foi encontrado.', '404', 404)
}

function hasReachedLastPage(page: HelenaSessionsPage) {
  return page.pageNumber >= page.totalPages || page.items.length === 0
}

export async function fetchSessionsJson(filters: Filters, signal?: AbortSignal) {
  const pages: HelenaSessionsPage[] = []
  let currentPage = 1

  while (true) {
    const page = await fetchSessionsPage(filters, currentPage, signal)
    pages.push(page)

    if (!page.hasMorePages || hasReachedLastPage(page)) {
      break
    }

    currentPage = page.pageNumber + 1
  }

  const firstPage = pages[0] ?? null
  const items = pages.flatMap((page) => page.items)

  return {
    fetchedAt: new Date().toISOString(),
    request: buildSessionRequestPreview(filters),
    pagesFetched: pages.length,
    totalItems: firstPage?.totalItems ?? items.length,
    totalPages: firstPage?.totalPages ?? pages.length,
    pageSize: firstPage?.pageSize ?? DEFAULT_PAGE_SIZE,
    items,
    firstPage,
  } satisfies HelenaSessionsDataset
}

export function getApiErrorDisplay(error: unknown) {
  if (error instanceof HelenaApiError) {
    const messageByCode: Record<string, string> = {
      MISSING_API_TOKEN: 'A integracao da API nao esta configurada neste ambiente.',
      UPSTREAM_ERROR: 'O servico de dados nao respondeu corretamente.',
      METHOD_NOT_ALLOWED: 'O metodo da requisicao nao e permitido.',
      INVALID_JSON: 'A resposta recebida nao esta em um formato valido.',
    }

    return {
      message: messageByCode[error.code] ?? sanitizePublicErrorMessage(error.message),
      code: error.code,
    }
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return null
  }

  if (error instanceof Error && error.message === 'Failed to fetch') {
    return {
      message: 'Nao foi possivel conectar com a API.',
      code: 'NETWORK_ERROR',
    }
  }

  return {
    message: 'Nao foi possivel concluir a consulta.',
    code: 'UNEXPECTED_ERROR',
  }
}
