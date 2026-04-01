import { channels, teams, users } from '../data/mockDashboard'
import type { HelenaSession } from '../types'

const dateLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
})

function createLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateKey(value: string) {
  return formatDateKey(new Date(value))
}

function getDateLabel(value: string) {
  return dateLabelFormatter.format(createLocalDate(value))
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function buildDateRange(startDate: string, endDate: string) {
  const start = createLocalDate(startDate)
  const end = createLocalDate(endDate)
  const [rangeStart, rangeEnd] =
    start.getTime() <= end.getTime() ? [start, end] : [end, start]

  const dates: Array<{ key: string; label: string }> = []
  let cursor = new Date(rangeStart)

  while (cursor.getTime() <= rangeEnd.getTime()) {
    const key = formatDateKey(cursor)

    dates.push({
      key,
      label: getDateLabel(key),
    })

    cursor = addDays(cursor, 1)
  }

  return dates
}

function sortByCountDesc<T extends { total: number }>(items: T[]) {
  return [...items].sort((left, right) => right.total - left.total)
}

function countDistinct(values: Array<string | null | undefined>) {
  return new Set(values.filter((value): value is string => Boolean(value))).size
}

function buildLookup<T extends { id: string; name: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item.name]))
}

const channelLookup = buildLookup(channels)
const teamLookup = buildLookup(teams)
const userLookup = buildLookup(users)
const channelTypeLookup = new Map(channels.map((channel) => [channel.id, channel.type ?? null]))

function normalizeChannelTypeLabel(value: string | null | undefined) {
  if (!value) {
    return 'Nao identificado'
  }

  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  if (
    normalized === 'WABA' ||
    normalized === 'CLOUDAPI' ||
    normalized === 'CLOUD_API' ||
    normalized === 'GUPSHUP_WHATSAPP'
  ) {
    return 'CloudAPI'
  }

  if (normalized === 'INSTAGRAM') {
    return 'Instagram'
  }

  if (
    normalized === 'NAO OFICIAL' ||
    normalized === 'NAO-OFICIAL' ||
    normalized === 'EVOLUTION'
  ) {
    return 'Evolution'
  }

  return value
}

export function getSessionUserKey(item: HelenaSession) {
  return item.agentDetails?.userId ?? item.userId
}

function getSessionUserLabel(item: HelenaSession, id: string) {
  return (
    item.agentDetails?.name ??
    item.agentDetails?.shortName ??
    userLookup.get(id) ??
    null
  )
}

function getSessionChannelLabel(item: HelenaSession, id: string) {
  return (
    channelLookup.get(id) ??
    item.channelDetails?.displayName ??
    item.channelDetails?.humanId ??
    item.channelDetails?.platform ??
    null
  )
}

function getSessionTeamLabel(item: HelenaSession, id: string) {
  return teamLookup.get(id) ?? item.departmentDetails?.name ?? null
}

export function getSessionChannelTypeLabel(item: HelenaSession) {
  return normalizeChannelTypeLabel(
    (item.channelId ? channelTypeLookup.get(item.channelId) : null) ??
      item.channelType ??
      item.channelDetails?.platform ??
      null,
  )
}

export function buildEssentialMetrics(items: HelenaSession[]) {
  const completed = items.filter((item) => item.status === 'COMPLETED').length
  const inProgress = items.filter((item) => item.status === 'IN_PROGRESS').length
  const pending = items.filter((item) => item.status === 'PENDING').length
  const activeChannels = countDistinct(items.map((item) => item.channelId))
  const activeTeams = countDistinct(items.map((item) => item.departmentId))
  const activeUsers = countDistinct(items.map((item) => getSessionUserKey(item)))

  return {
    totalConversations: items.length,
    completed,
    inProgress,
    pending,
    activeChannels,
    activeTeams,
    activeUsers,
  }
}

export function buildCreatedAtSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
) {
  const totals = new Map<string, number>()

  items.forEach((item) => {
    if (!item.createdAt) {
      return
    }

    const key = normalizeDateKey(item.createdAt)
    totals.set(key, (totals.get(key) ?? 0) + 1)
  })

  return buildDateRange(startDate, endDate).map(({ key, label }) => ({
    key,
    label,
    total: totals.get(key) ?? 0,
  }))
}

function buildGroupedSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
  getGroup: (item: HelenaSession) => { id: string; label: string } | null,
) {
  const dateRange = buildDateRange(startDate, endDate)
  const totalsByGroup = new Map<
    string,
    {
      id: string
      label: string
      total: number
      byDay: Map<string, number>
    }
  >()

  items.forEach((item) => {
    if (!item.createdAt) {
      return
    }

    const group = getGroup(item)

    if (!group) {
      return
    }

    const key = normalizeDateKey(item.createdAt)
    const current = totalsByGroup.get(group.id) ?? {
      id: group.id,
      label: group.label,
      total: 0,
      byDay: new Map<string, number>(),
    }

    current.total += 1
    current.byDay.set(key, (current.byDay.get(key) ?? 0) + 1)
    totalsByGroup.set(group.id, current)
  })

  return sortByCountDesc(
    [...totalsByGroup.values()].map((group) => ({
      id: group.id,
      label: group.label,
      total: group.total,
      points: dateRange.map(({ key, label }) => ({
        key,
        label,
        total: group.byDay.get(key) ?? 0,
      })),
    })),
  )
}

function buildCountList(
  items: HelenaSession[],
  getValue: (item: HelenaSession) => string | null | undefined,
  getLabel: (item: HelenaSession, id: string) => string | null,
) {
  const totals = new Map<string, number>()
  const labels = new Map<string, string>()

  items.forEach((item) => {
    const value = getValue(item)

    if (!value) {
      return
    }

    totals.set(value, (totals.get(value) ?? 0) + 1)

    if (!labels.has(value)) {
      const label = getLabel(item, value)

      if (label) {
        labels.set(value, label)
      }
    }
  })

  return sortByCountDesc(
    [...totals.entries()].map(([id, total]) => ({
      id,
      label: labels.get(id) ?? 'Nao identificado',
      total,
    })),
  )
}

export function buildChannelCounts(items: HelenaSession[]) {
  return buildCountList(items, (item) => item.channelId, getSessionChannelLabel)
}

export function buildTeamCounts(items: HelenaSession[]) {
  return buildCountList(items, (item) => item.departmentId, getSessionTeamLabel)
}

export function buildUserCounts(items: HelenaSession[]) {
  return buildCountList(items, (item) => getSessionUserKey(item), getSessionUserLabel)
}

export function buildChannelTypeCounts(items: HelenaSession[]) {
  const totals = new Map<string, number>()

  items.forEach((item) => {
    const label = getSessionChannelTypeLabel(item)
    totals.set(label, (totals.get(label) ?? 0) + 1)
  })

  return sortByCountDesc(
    [...totals.entries()].map(([label, total]) => ({
      id: label,
      label,
      total,
    })),
  )
}

export function buildChannelTypeSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
) {
  return buildGroupedSeries(items, startDate, endDate, (item) => {
    const label = getSessionChannelTypeLabel(item)

    return {
      id: label,
      label,
    }
  })
}

export function buildChannelSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
) {
  return buildGroupedSeries(items, startDate, endDate, (item) => {
    const id = item.channelId

    if (!id) {
      return null
    }

    return {
      id,
      label: getSessionChannelLabel(item, id) ?? 'Nao identificado',
    }
  })
}

export function buildTeamSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
) {
  return buildGroupedSeries(items, startDate, endDate, (item) => {
    const id = item.departmentId

    if (!id) {
      return null
    }

    return {
      id,
      label: getSessionTeamLabel(item, id) ?? 'Nao identificado',
    }
  })
}

export function buildUserSeries(
  items: HelenaSession[],
  startDate: string,
  endDate: string,
) {
  return buildGroupedSeries(items, startDate, endDate, (item) => {
    const id = getSessionUserKey(item)

    if (!id) {
      return null
    }

    return {
      id,
      label: getSessionUserLabel(item, id) ?? 'Nao identificado',
    }
  })
}
