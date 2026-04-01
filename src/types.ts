export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last7Days'
  | 'last30Days'
  | 'custom'

export type Status = 'Resolvido' | 'Em andamento' | 'Pendente'

export type Channel = {
  id: string
  name: string
  accent: string
  type?: string
  number?: string | null
}

export type Team = {
  id: string
  name: string
  accent: string
}

export type User = {
  id: string
  name: string
  teamId: Team['id']
}

export type Attendance = {
  id: string
  protocol: string
  subject: string
  createdAt: string
  resolvedAt: string | null
  channelId: Channel['id']
  userId: User['id']
  teamId: Team['id']
  status: Status
  resolutionMinutes: number | null
  slaTargetMinutes: number
  slaMet: boolean
  satisfaction: number | null
}

export type Filters = {
  channelIds: string[]
  userId: string | null
  teamId: string | null
  startDate: string
  endDate: string
  preset: DatePreset
}

export type HelenaSession = Record<string, unknown> & {
  id: string
  createdAt: string
  endAt?: string | null
  startAt?: string | null
  status?: string | null
  channelId?: string | null
  channelType?: string | null
  departmentId?: string | null
  userId?: string | null
  agentDetails?: {
    id?: string | null
    userId?: string | null
    name?: string | null
    shortName?: string | null
  } | null
  channelDetails?: {
    displayName?: string | null
    humanId?: string | null
    platform?: string | null
  } | null
  departmentDetails?: {
    id?: string | null
    name?: string | null
  } | null
}

export type HelenaSessionsPage = {
  pageNumber: number
  pageSize: number
  orderBy: string
  orderDirection: string
  items: HelenaSession[]
  totalItems: number
  totalPages: number
  hasMorePages: boolean
}

export type HelenaSessionsDataset = {
  fetchedAt: string
  request: Record<string, unknown>
  pagesFetched: number
  totalItems: number
  totalPages: number
  pageSize: number
  items: HelenaSession[]
  firstPage: HelenaSessionsPage | null
}
