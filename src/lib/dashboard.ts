import type { Attendance, Channel, Filters, Team } from '../types'

export const ALL_VALUE = 'all'

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function atStartOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function atEndOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function addDays(date: Date, amount: number) {
  const value = new Date(date)
  value.setDate(value.getDate() + amount)
  return value
}

function startOfWeek(date: Date) {
  const base = atStartOfDay(date)
  const weekday = base.getDay()
  const diff = weekday === 0 ? -6 : 1 - weekday
  return addDays(base, diff)
}

function endOfWeek(date: Date) {
  return atEndOfDay(addDays(startOfWeek(date), 6))
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateInput(value: string, boundary: 'start' | 'end') {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (boundary === 'end') {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }

  return date
}

export function getPresetRange(
  preset: Exclude<Filters['preset'], 'custom'>,
  referenceDate = new Date(),
) {
  const today = atStartOfDay(referenceDate)

  let start = today
  let end = atEndOfDay(referenceDate)

  switch (preset) {
    case 'today':
      start = atStartOfDay(referenceDate)
      end = atEndOfDay(referenceDate)
      break
    case 'yesterday': {
      const yesterday = addDays(today, -1)
      start = atStartOfDay(yesterday)
      end = atEndOfDay(yesterday)
      break
    }
    case 'thisWeek':
      start = startOfWeek(referenceDate)
      end = atEndOfDay(referenceDate)
      break
    case 'lastWeek': {
      const previousWeekReference = addDays(startOfWeek(referenceDate), -1)
      start = startOfWeek(previousWeekReference)
      end = endOfWeek(previousWeekReference)
      break
    }
    case 'thisMonth':
      start = startOfMonth(referenceDate)
      end = atEndOfDay(referenceDate)
      break
    case 'lastMonth': {
      const previousMonthReference = new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - 1,
        1,
      )
      start = startOfMonth(previousMonthReference)
      end = endOfMonth(previousMonthReference)
      break
    }
    case 'last30Days':
      start = atStartOfDay(addDays(referenceDate, -29))
      end = atEndOfDay(referenceDate)
      break
    default:
      start = atStartOfDay(addDays(referenceDate, -6))
      end = atEndOfDay(referenceDate)
      break
  }

  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  }
}

export function filterAttendances(attendances: Attendance[], filters: Filters) {
  const rawStart = parseDateInput(filters.startDate, 'start')
  const rawEnd = parseDateInput(filters.endDate, 'end')
  const [rangeStart, rangeEnd] =
    rawStart.getTime() <= rawEnd.getTime()
      ? [rawStart, rawEnd]
      : [atStartOfDay(rawEnd), atEndOfDay(rawStart)]

  return attendances.filter((attendance) => {
    const createdAt = new Date(attendance.createdAt)

    if (
      filters.channelIds.length > 0 &&
      !filters.channelIds.includes(attendance.channelId)
    ) {
      return false
    }

    if (filters.teamId && attendance.teamId !== filters.teamId) {
      return false
    }

    if (filters.userId && attendance.userId !== filters.userId) {
      return false
    }

    return createdAt >= rangeStart && createdAt <= rangeEnd
  })
}

export function getPreviousPeriodFilters(filters: Filters): Filters {
  const start = parseDateInput(filters.startDate, 'start')
  const end = parseDateInput(filters.endDate, 'end')
  const span = end.getTime() - start.getTime()
  const previousEnd = atEndOfDay(addDays(start, -1))
  const previousStart = atStartOfDay(new Date(previousEnd.getTime() - span))

  return {
    ...filters,
    preset: 'custom',
    startDate: formatDateInput(previousStart),
    endDate: formatDateInput(previousEnd),
  }
}

export function getSummaryMetrics(attendances: Attendance[]) {
  const resolvedItems = attendances.filter((item) => item.status === 'Resolvido')
  const slaMet = attendances.filter((item) => item.slaMet).length
  const resolutionTotal = resolvedItems.reduce(
    (accumulator, item) => accumulator + (item.resolutionMinutes ?? 0),
    0,
  )

  const avgResolutionMinutes =
    resolvedItems.length === 0 ? 0 : Math.round(resolutionTotal / resolvedItems.length)

  return {
    total: attendances.length,
    resolved: resolvedItems.length,
    slaMet,
    slaRate:
      attendances.length === 0 ? 0 : Math.round((slaMet / attendances.length) * 100),
    avgResolutionMinutes,
  }
}

export function getVolumeSeries(
  attendances: Attendance[],
  startDate: string,
  endDate: string,
) {
  const start = parseDateInput(startDate, 'start')
  const end = parseDateInput(endDate, 'end')
  const totals = new Map<string, number>()

  attendances.forEach((attendance) => {
    const dayKey = formatDateInput(new Date(attendance.createdAt))
    totals.set(dayKey, (totals.get(dayKey) ?? 0) + 1)
  })

  const series: Array<{ key: string; label: string; total: number }> = []
  let cursor = atStartOfDay(start)

  while (cursor.getTime() <= end.getTime()) {
    const key = formatDateInput(cursor)
    series.push({
      key,
      label: shortDateFormatter.format(cursor),
      total: totals.get(key) ?? 0,
    })
    cursor = addDays(cursor, 1)
  }

  return series
}

export function getTeamRanking(attendances: Attendance[], teams: Team[]) {
  const grandTotal = attendances.length || 1

  return teams
    .map((team) => {
      const items = attendances.filter((attendance) => attendance.teamId === team.id)
      const slaMet = items.filter((item) => item.slaMet).length

      return {
        id: team.id,
        name: team.name,
        accent: team.accent,
        total: items.length,
        share: Math.round((items.length / grandTotal) * 100),
        slaRate: items.length === 0 ? 0 : Math.round((slaMet / items.length) * 100),
      }
    })
    .filter((team) => team.total > 0)
    .sort((left, right) => right.total - left.total)
}

export function getChannelMix(attendances: Attendance[], channels: Channel[]) {
  return channels
    .map((channel) => ({
      id: channel.id,
      name: channel.name,
      accent: channel.accent,
      total: attendances.filter((attendance) => attendance.channelId === channel.id).length,
    }))
    .filter((channel) => channel.total > 0)
    .sort((left, right) => right.total - left.total)
}

export function getRecentAttendances(attendances: Attendance[], limit: number) {
  return attendances.slice(0, limit)
}

export function formatMinutes(value: number | null) {
  if (value === null || value === 0) {
    return '--'
  }

  if (value < 60) {
    return `${value} min`
  }

  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

export function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value))
}

export function formatRangeLabel(startDate: string, endDate: string) {
  const start = parseDateInput(startDate, 'start')
  const end = parseDateInput(endDate, 'end')
  return `${shortDateFormatter.format(start)} a ${shortDateFormatter.format(end)}`
}
