import { ResponsiveLine, type SliceTooltipProps as NivoSliceTooltipProps } from '@nivo/line'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import './App.css'
import { fetchSessionsJson, getApiErrorDisplay } from './lib/api'
import { getPresetRange } from './lib/dashboard'
import {
  buildChannelCounts,
  buildChannelSeries,
  buildChannelTypeCounts,
  buildChannelTypeSeries,
  buildCreatedAtSeries,
  buildEssentialMetrics,
  buildTeamCounts,
  buildTeamSeries,
  buildUserCounts,
  buildUserSeries,
  getSessionChannelTypeLabel,
  getSessionUserKey,
} from './lib/sessionMetrics'
import type { DatePreset, Filters, HelenaSession, HelenaSessionsDataset } from './types'

const presetOptions: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'thisWeek', label: 'Esta semana' },
  { id: 'lastWeek', label: 'Semana anterior' },
  { id: 'thisMonth', label: 'Este mes' },
  { id: 'lastMonth', label: 'Mes anterior' },
  { id: 'last7Days', label: 'Ultimos 7 dias' },
  { id: 'last30Days', label: 'Ultimos 30 dias' },
  { id: 'custom', label: 'Personalizado' },
]

const linePalette = [
  '#1E40AF',
  '#2563EB',
  '#3B82F6',
  '#16A34A',
  '#D97706',
  '#DC2626',
  '#0F766E',
  '#7C3AED',
  '#EC4899',
  '#0891B2',
  '#475569',
  '#14B8A6',
  '#4338CA',
  '#F59E0B',
  '#B91C1C',
  '#0EA5E9',
]

const chartTheme = {
  axis: {
    domain: {
      line: {
        stroke: '#CBD5E1',
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: '#CBD5E1',
        strokeWidth: 1,
      },
      text: {
        fill: '#94A3B8',
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 500,
      },
    },
    legend: {
      text: {
        fill: '#6B7280',
        fontSize: 11,
        fontFamily: 'Inter',
        fontWeight: 600,
      },
    },
  },
  grid: {
    line: {
      stroke: '#E2E8F0',
      strokeWidth: 1,
    },
  },
  crosshair: {
    line: {
      stroke: '#94A3B8',
      strokeWidth: 1,
      strokeOpacity: 0.35,
    },
  },
  tooltip: {
    container: {
      background: '#FFFFFF',
      color: '#111827',
      borderRadius: '10px',
      boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
      border: '1px solid #E2E8F0',
      fontSize: '12px',
      fontFamily: 'Inter',
    },
  },
}

type TrendPoint = {
  key: string
  label: string
  total: number
}

type GroupedTrendSeries = {
  id: string
  label: string
  total: number
  points: TrendPoint[]
}

type MetricTone = 'primary' | 'success' | 'warning' | 'danger'

type MetricCardProps = {
  label: string
  value: string
  badgeText: string
  tone: MetricTone
}

type StatusBadgeProps = {
  tone: 'neutral' | 'success'
  icon: ReactNode
  text: string
}

type ChartSeries = {
  id: string
  color: string
  data: Array<{ x: string; y: number }>
}

type TrendChartProps = {
  items: TrendPoint[]
  filterSummary: Array<{ key: string; label: string }>
  onOpenAdvancedFilters: () => void
}

type MultiLineChartProps = {
  title: string
  subtitle: string
  series: GroupedTrendSeries[]
}

type PeriodSelectProps = {
  value: DatePreset
  options: Array<{ id: DatePreset; label: string }>
  onChange: (preset: DatePreset) => void
}

type FilterOption = {
  id: string
  label: string
  total: number
}

type AdvancedTrendFilters = {
  channelTypeIds: string[]
  channelIds: string[]
  teamIds: string[]
  userIds: string[]
}

type AdvancedFilterModalProps = {
  initialFilters: AdvancedTrendFilters
  itemCount: number
  channelTypeOptions: FilterOption[]
  channelOptions: FilterOption[]
  teamOptions: FilterOption[]
  userOptions: FilterOption[]
  onApply: (filters: AdvancedTrendFilters) => void
  onClose: () => void
}

type DisplayError = {
  message: string
  code: string
}

function createInitialFilters(): Filters {
  return {
    channelIds: [],
    userId: null,
    teamId: null,
    preset: 'last7Days',
    ...getPresetRange('last7Days'),
  }
}

function createInitialTrendFilters(): AdvancedTrendFilters {
  return {
    channelTypeIds: [],
    channelIds: [],
    teamIds: [],
    userIds: [],
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTotal(value: number) {
  return value.toLocaleString('pt-BR')
}

function cloneTrendFilters(filters: AdvancedTrendFilters): AdvancedTrendFilters {
  return {
    channelTypeIds: [...filters.channelTypeIds],
    channelIds: [...filters.channelIds],
    teamIds: [...filters.teamIds],
    userIds: [...filters.userIds],
  }
}

function normalizeKey(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateInput(value: Date) {
  return format(value, 'yyyy-MM-dd')
}

function resolveSeriesColor(label: string, index: number) {
  const normalized = normalizeKey(label)

  if (normalized.includes('cloudapi')) {
    return '#1E40AF'
  }

  if (normalized.includes('evolution')) {
    return '#D97706'
  }

  if (normalized.includes('instagram')) {
    return '#DC2626'
  }

  return linePalette[index % linePalette.length]
}

function selectTickValues(points: TrendPoint[]) {
  const step = points.length > 8 ? Math.ceil(points.length / 6) : 1

  return points
    .filter(
      (_, index) => index === 0 || index === points.length - 1 || index % step === 0,
    )
    .map((point) => point.label)
}

function createSingleLineData(items: TrendPoint[]): ChartSeries[] {
  return [
    {
      id: 'Atendimentos',
      color: '#2563EB',
      data: items.map((item) => ({
        x: item.label,
        y: item.total,
      })),
    },
  ]
}

function createMultiLineData(series: GroupedTrendSeries[]): ChartSeries[] {
  return series.map((item, index) => ({
    id: item.label,
    color: resolveSeriesColor(item.label, index),
    data: item.points.map((point) => ({
      x: point.label,
      y: point.total,
    })),
  }))
}

function getChartSeriesTotal(series: ChartSeries) {
  return series.data.reduce((sum, point) => sum + point.y, 0)
}

function getChartSummary(series: ChartSeries[]) {
  const total = series.reduce((sum, item) => sum + getChartSeriesTotal(item), 0)
  const dayCount = series[0]?.data.length ?? 0
  const peak = Math.max(...series.flatMap((item) => item.data.map((point) => point.y)), 0)

  return {
    total,
    average: dayCount === 0 ? 0 : Math.round(total / dayCount),
    peak,
  }
}

function hasAdvancedTrendFilters(filters: AdvancedTrendFilters) {
  return (
    filters.channelTypeIds.length > 0 ||
    filters.channelIds.length > 0 ||
    filters.teamIds.length > 0 ||
    filters.userIds.length > 0
  )
}

function toggleFilterSelection(values: string[], id: string) {
  return values.includes(id)
    ? values.filter((value) => value !== id)
    : [...values, id]
}

function filterSessionsByTrendFilters(
  items: HelenaSession[],
  filters: AdvancedTrendFilters,
) {
  if (!hasAdvancedTrendFilters(filters)) {
    return items
  }

  return items.filter((item) => {
    if (
      filters.channelTypeIds.length > 0 &&
      !filters.channelTypeIds.includes(getSessionChannelTypeLabel(item))
    ) {
      return false
    }

    if (
      filters.channelIds.length > 0 &&
      (!item.channelId || !filters.channelIds.includes(item.channelId))
    ) {
      return false
    }

    if (
      filters.teamIds.length > 0 &&
      (!item.departmentId || !filters.teamIds.includes(item.departmentId))
    ) {
      return false
    }

    const userId = getSessionUserKey(item)

    if (filters.userIds.length > 0 && (!userId || !filters.userIds.includes(userId))) {
      return false
    }

    return true
  })
}

function createOptionLookup(items: FilterOption[]) {
  return new Map(items.map((item) => [item.id, item.label]))
}

function buildTrendFilterSummary(
  filters: AdvancedTrendFilters,
  options: {
    channelTypes: FilterOption[]
    channels: FilterOption[]
    teams: FilterOption[]
    users: FilterOption[]
  },
) {
  const channelTypeLookup = createOptionLookup(options.channelTypes)
  const channelLookup = createOptionLookup(options.channels)
  const teamLookup = createOptionLookup(options.teams)
  const userLookup = createOptionLookup(options.users)

  return [
    ...filters.channelTypeIds.map((id) => ({
      key: `channel-type-${id}`,
      label: `Tipo: ${channelTypeLookup.get(id) ?? id}`,
    })),
    ...filters.channelIds.map((id) => ({
      key: `channel-${id}`,
      label: `Canal: ${channelLookup.get(id) ?? id}`,
    })),
    ...filters.teamIds.map((id) => ({
      key: `team-${id}`,
      label: `Equipe: ${teamLookup.get(id) ?? id}`,
    })),
    ...filters.userIds.map((id) => ({
      key: `user-${id}`,
      label: `Usuario: ${userLookup.get(id) ?? id}`,
    })),
  ]
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5.3L8 20.7V17H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm4.12 6.88-5.08 5.09-2.16-2.16-1.41 1.41 3.57 3.58 6.5-6.51-1.42-1.41Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm1 4h-2v6l4.5 2.7 1-1.64L13 12V7Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.12l3.71-3.9a.75.75 0 0 1 1.08 1.04l-4.25 4.46a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 .55 1.26L14 13.55V18a.75.75 0 0 1-.44.68l-3 1.38A.75.75 0 0 1 9.5 19.4v-5.85L4.2 7.26A.75.75 0 0 1 4 6.75Z"
        fill="currentColor"
      />
    </svg>
  )
}

function LoadingModal() {
  return (
    <div className="loading-modal-backdrop" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-modal">
        <span className="loading-spinner" aria-hidden="true" />
        <strong>Carregando atendimentos</strong>
        <p>Consultando a API e consolidando todas as paginas do periodo selecionado.</p>
      </div>
    </div>
  )
}

function MultiLineSliceTooltip({ slice }: NivoSliceTooltipProps<ChartSeries>) {
  const sortedPoints = [...slice.points].sort(
    (left, right) => Number(right.data.y ?? 0) - Number(left.data.y ?? 0),
  )

  return (
    <div className="chart-tooltip">
      <strong className="chart-tooltip-title">
        {String(sortedPoints[0]?.data.xFormatted ?? sortedPoints[0]?.id ?? '')}
      </strong>

      <div className="chart-tooltip-list">
        {sortedPoints.map((point) => (
          <div key={String(point.id)} className="chart-tooltip-row">
            <span className="chart-tooltip-label">
              <span
                className="chart-tooltip-swatch"
                style={{ backgroundColor: point.color }}
                aria-hidden="true"
              />
              <span>{String(point.seriesId)}</span>
            </span>
            <strong>{formatTotal(Number(point.data.y ?? 0))}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdvancedFilterModal({
  initialFilters,
  itemCount,
  channelTypeOptions,
  channelOptions,
  teamOptions,
  userOptions,
  onApply,
  onClose,
}: AdvancedFilterModalProps) {
  const [draftFilters, setDraftFilters] = useState<AdvancedTrendFilters>(() =>
    cloneTrendFilters(initialFilters),
  )

  useEffect(() => {
    setDraftFilters(cloneTrendFilters(initialFilters))
  }, [initialFilters])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const totalSelected =
    draftFilters.channelTypeIds.length +
    draftFilters.channelIds.length +
    draftFilters.teamIds.length +
    draftFilters.userIds.length

  const renderOptionGroup = (
    title: string,
    hint: string,
    options: FilterOption[],
    selectedIds: string[],
    onToggle: (id: string) => void,
  ) => (
    <section className="advanced-filter-group">
      <div className="advanced-filter-group-head">
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <span className="advanced-filter-count">{selectedIds.length} selecionado(s)</span>
      </div>

      <div className="advanced-filter-options">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id)

          return (
            <button
              key={option.id}
              type="button"
              className={`filter-option-chip ${isSelected ? 'is-active' : ''}`}
              onClick={() => onToggle(option.id)}
            >
              <span>{option.label}</span>
              <strong>{formatTotal(option.total)}</strong>
            </button>
          )
        })}
      </div>
    </section>
  )

  return (
    <div
      className="advanced-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="advanced-modal" role="dialog" aria-modal="true" aria-label="Filtro avancado">
        <div className="advanced-modal-header">
          <div>
            <span className="panel-kicker">Filtro avancado</span>
            <h2>Atendimentos por dia</h2>
            <p>Combine filtros com multiselecao. Dentro de cada grupo vale OU; entre grupos a combinacao final usa E.</p>
          </div>

          <button type="button" className="modal-close-button" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="advanced-modal-toolbar">
          <span className="advanced-modal-status">
            {formatTotal(totalSelected)} filtro(s) ativos
          </span>
          <span className="advanced-modal-status">
            Base atual: {formatTotal(itemCount)} atendimento(s)
          </span>
        </div>

        <div className="advanced-modal-body">
          {renderOptionGroup(
            'Tipos de canal',
            'Selecione um ou mais tipos para refinar o grafico geral.',
            channelTypeOptions,
            draftFilters.channelTypeIds,
            (id) =>
              setDraftFilters((current) => ({
                ...current,
                channelTypeIds: toggleFilterSelection(current.channelTypeIds, id),
              })),
          )}

          {renderOptionGroup(
            'Canais',
            'Selecione um ou mais canais especificos.',
            channelOptions,
            draftFilters.channelIds,
            (id) =>
              setDraftFilters((current) => ({
                ...current,
                channelIds: toggleFilterSelection(current.channelIds, id),
              })),
          )}

          {renderOptionGroup(
            'Equipes',
            'Selecione uma ou mais equipes.',
            teamOptions,
            draftFilters.teamIds,
            (id) =>
              setDraftFilters((current) => ({
                ...current,
                teamIds: toggleFilterSelection(current.teamIds, id),
              })),
          )}

          {renderOptionGroup(
            'Usuarios',
            'Selecione um ou mais usuarios.',
            userOptions,
            draftFilters.userIds,
            (id) =>
              setDraftFilters((current) => ({
                ...current,
                userIds: toggleFilterSelection(current.userIds, id),
              })),
          )}
        </div>

        <div className="advanced-modal-footer">
          <button
            type="button"
            className="ghost-button"
            onClick={() => setDraftFilters(createInitialTrendFilters())}
          >
            Limpar selecao
          </button>
          <div className="advanced-modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => onApply(cloneTrendFilters(draftFilters))}
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PeriodSelect({ value, options, onChange }: PeriodSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selectedOption = options.find((option) => option.id === value) ?? options[0]

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className={`period-select ${isOpen ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="period-select-trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption.label}</span>
        <span className="period-select-caret" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className="period-select-menu" role="listbox" aria-label="Periodo">
          {options.map((option) => {
            const isSelected = option.id === value

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`period-select-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.id)
                  setIsOpen(false)
                }}
              >
                <span>{option.label}</span>
                {isSelected ? <span className="period-select-check">Ativo</span> : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ tone, icon, text }: StatusBadgeProps) {
  return (
    <span className={`status-badge is-${tone}`}>
      <span className="status-badge-icon">{icon}</span>
      <span>{text}</span>
    </span>
  )
}

function MetricCard({ label, value, badgeText, tone }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-badge">{badgeText}</span>
    </article>
  )
}

function TrendChart({ items, filterSummary, onOpenAdvancedFilters }: TrendChartProps) {
  const data = createSingleLineData(items)
  const total = items.reduce((sum, item) => sum + item.total, 0)
  const average = items.length === 0 ? 0 : Math.round(total / items.length)
  const peak = Math.max(...items.map((item) => item.total), 0)
  const tickValues = selectTickValues(items)
  const hasAdvancedFilters = filterSummary.length > 0

  return (
    <section className="panel chart-panel">
      <div className="panel-head panel-head-spread">
        <div className="panel-head-main">
          <span className="panel-kicker">Evolucao</span>
          <h2>Atendimentos por dia</h2>
          <p>
            {hasAdvancedFilters
              ? 'Volume diario usando o filtro avancado aplicado a esta visao.'
              : 'Volume diario no periodo selecionado.'}
          </p>
        </div>

        <div className="panel-head-side">
          <button type="button" className="chart-filter-button" onClick={onOpenAdvancedFilters}>
            <FilterIcon />
            <span>Filtro avancado</span>
            {hasAdvancedFilters ? (
              <strong>{formatTotal(filterSummary.length)}</strong>
            ) : null}
          </button>

          <div className="panel-meta">
            <div>
              <span>Total</span>
              <strong>{formatTotal(total)}</strong>
            </div>
            <div>
              <span>Media/dia</span>
              <strong>{formatTotal(average)}</strong>
            </div>
            <div>
              <span>Pico</span>
              <strong>{formatTotal(peak)}</strong>
            </div>
          </div>
        </div>
      </div>

      {hasAdvancedFilters ? (
        <div className="applied-filter-row">
          {filterSummary.map((item) => (
            <span key={item.key} className="applied-filter-chip">
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="nivo-chart-frame">
          <ResponsiveLine
            data={data}
            theme={chartTheme}
            margin={{ top: 16, right: 20, bottom: 42, left: 46 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 14,
              tickRotation: 0,
              tickValues,
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
              tickValues: 5,
            }}
            colors={(serie) => (serie as { color?: string }).color ?? '#2563EB'}
            lineWidth={3}
            pointSize={8}
            pointColor="#ffffff"
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            enableGridX
            enableGridY
            enableArea
            areaOpacity={0.1}
            curve="monotoneX"
            useMesh
            enableSlices="x"
            enableCrosshair
            crosshairType="x"
            legends={[]}
          />
        </div>
      ) : (
        <div className="chart-empty-state">
          <strong>Nenhum atendimento encontrado.</strong>
          <p>
            {hasAdvancedFilters
              ? 'A combinacao dos filtros avancados nao retornou atendimento neste periodo.'
              : 'Nao houve atendimento no periodo selecionado.'}
          </p>
        </div>
      )}
    </section>
  )
}

function MultiLineChart({ title, subtitle, series }: MultiLineChartProps) {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)

  if (series.length === 0 || series[0]?.points.length === 0) {
    return (
      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <span className="panel-kicker">Comparativo</span>
            <h2>{title}</h2>
            <p>Nenhum atendimento encontrado para este agrupamento.</p>
          </div>
        </div>
      </section>
    )
  }

  const data = createMultiLineData(series)
  const hasSelectedSeries =
    selectedSeriesId !== null && data.some((item) => item.id === selectedSeriesId)
  const activeData = hasSelectedSeries
    ? data.filter((item) => item.id === selectedSeriesId)
    : data
  const tickValues = selectTickValues(series[0].points)
  const summary = getChartSummary(activeData)
  const totalSummary = getChartSummary(data)

  return (
    <section className="panel chart-panel">
      <div className="panel-head panel-head-spread">
        <div>
          <span className="panel-kicker">Comparativo</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="panel-meta">
          <div>
            <span>Total</span>
            <strong>{formatTotal(summary.total)}</strong>
          </div>
          <div>
            <span>Media/dia</span>
            <strong>{formatTotal(summary.average)}</strong>
          </div>
          <div>
            <span>Pico</span>
            <strong>{formatTotal(summary.peak)}</strong>
          </div>
        </div>
      </div>

      <div className="series-legend">
        <button
          type="button"
          className={`series-chip ${!hasSelectedSeries ? 'is-active' : ''}`}
          onClick={() => setSelectedSeriesId(null)}
        >
          <span className="series-swatch is-neutral" aria-hidden="true" />
          <span>Todos</span>
          <strong>{formatTotal(totalSummary.total)}</strong>
        </button>

        {data.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`series-chip ${selectedSeriesId === item.id ? 'is-active' : ''}`}
            onClick={() =>
              setSelectedSeriesId((current) => (current === item.id ? null : String(item.id)))
            }
          >
            <span
              className="series-swatch"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span title={String(item.id)}>{String(item.id)}</span>
            <strong>{formatTotal(getChartSeriesTotal(item))}</strong>
          </button>
        ))}
      </div>

      <div className="nivo-chart-frame">
        <ResponsiveLine
          data={activeData}
          theme={chartTheme}
          margin={{ top: 16, right: 20, bottom: 42, left: 46 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 14,
            tickRotation: 0,
            tickValues,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
            tickValues: 5,
          }}
          colors={(serie) => (serie as { color?: string }).color ?? '#2563EB'}
          lineWidth={2}
          pointSize={4}
          pointColor="#ffffff"
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableGridX
          enableGridY
          curve="monotoneX"
          useMesh
          enableSlices="x"
          sliceTooltip={MultiLineSliceTooltip}
          enableCrosshair
          crosshairType="x"
          legends={[]}
        />
      </div>
    </section>
  )
}

function App() {
  const [filters, setFilters] = useState<Filters>(() => createInitialFilters())
  const [dataset, setDataset] = useState<HelenaSessionsDataset | null>(null)
  const [trendFilters, setTrendFilters] = useState<AdvancedTrendFilters>(() =>
    createInitialTrendFilters(),
  )
  const [isTrendFiltersOpen, setIsTrendFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<DisplayError | null>(null)
  const requestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  const metrics = useMemo(
    () => buildEssentialMetrics(dataset?.items ?? []),
    [dataset],
  )

  const trendItems = useMemo(
    () => filterSessionsByTrendFilters(dataset?.items ?? [], trendFilters),
    [dataset, trendFilters],
  )

  const createdAtSeries = useMemo(
    () => buildCreatedAtSeries(trendItems, filters.startDate, filters.endDate),
    [filters.endDate, filters.startDate, trendItems],
  )

  const channelTypeSeries = useMemo(
    () => buildChannelTypeSeries(dataset?.items ?? [], filters.startDate, filters.endDate),
    [dataset, filters.endDate, filters.startDate],
  )

  const channelSeries = useMemo(
    () => buildChannelSeries(dataset?.items ?? [], filters.startDate, filters.endDate),
    [dataset, filters.endDate, filters.startDate],
  )

  const teamSeries = useMemo(
    () => buildTeamSeries(dataset?.items ?? [], filters.startDate, filters.endDate),
    [dataset, filters.endDate, filters.startDate],
  )

  const userSeries = useMemo(
    () => buildUserSeries(dataset?.items ?? [], filters.startDate, filters.endDate),
    [dataset, filters.endDate, filters.startDate],
  )

  const trendChannelTypeOptions = useMemo(
    () => buildChannelTypeCounts(dataset?.items ?? []),
    [dataset],
  )

  const trendChannelOptions = useMemo(
    () => buildChannelCounts(dataset?.items ?? []),
    [dataset],
  )

  const trendTeamOptions = useMemo(
    () => buildTeamCounts(dataset?.items ?? []),
    [dataset],
  )

  const trendUserOptions = useMemo(
    () => buildUserCounts(dataset?.items ?? []),
    [dataset],
  )

  const trendFilterSummary = useMemo(
    () =>
      buildTrendFilterSummary(trendFilters, {
        channelTypes: trendChannelTypeOptions,
        channels: trendChannelOptions,
        teams: trendTeamOptions,
        users: trendUserOptions,
      }),
    [trendChannelOptions, trendChannelTypeOptions, trendFilters, trendTeamOptions, trendUserOptions],
  )

  const completedRate =
    metrics.totalConversations === 0
      ? 0
      : Math.round((metrics.completed / metrics.totalConversations) * 100)
  const inProgressRate =
    metrics.totalConversations === 0
      ? 0
      : Math.round((metrics.inProgress / metrics.totalConversations) * 100)
  const pendingRate =
    metrics.totalConversations === 0
      ? 0
      : Math.round((metrics.pending / metrics.totalConversations) * 100)

  const otherStatuses = Math.max(
    0,
    metrics.totalConversations - metrics.completed - metrics.inProgress - metrics.pending,
  )

  const resetFetchedState = () => {
    requestControllerRef.current?.abort()
    requestControllerRef.current = null
    setIsLoading(false)
    setDataset(null)
    setTrendFilters(createInitialTrendFilters())
    setIsTrendFiltersOpen(false)
    setErrorState(null)
  }

  const applyPreset = (preset: DatePreset) => {
    resetFetchedState()

    if (preset === 'custom') {
      startTransition(() => {
        setFilters((current) => ({
          ...current,
          preset: 'custom',
        }))
      })

      return
    }

    const range = getPresetRange(preset)

    startTransition(() => {
      setFilters((current) => ({
        ...current,
        preset,
        startDate: range.startDate,
        endDate: range.endDate,
      }))
    })
  }

  const updateDateFilter = (field: 'startDate' | 'endDate', value: string) => {
    resetFetchedState()

    startTransition(() => {
      setFilters((current) => ({
        ...current,
        [field]: value,
        preset: 'custom',
      }))
    })
  }

  const resetFilters = () => {
    const nextFilters = createInitialFilters()
    resetFetchedState()

    startTransition(() => {
      setFilters(nextFilters)
    })
  }

  const updateDatePicker = (field: 'startDate' | 'endDate', value: Date | null) => {
    if (!value) {
      return
    }

    updateDateFilter(field, formatDateInput(value))
  }

  const handleFetch = async () => {
    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    setIsLoading(true)
    setErrorState(null)

    try {
      const result = await fetchSessionsJson(filters, controller.signal)
      if (controller.signal.aborted) {
        return
      }

      setDataset(result)
    } catch (error) {
      const nextError = getApiErrorDisplay(error)

      if (!nextError) {
        return
      }

      setDataset(null)
      setIsTrendFiltersOpen(false)
      setErrorState(nextError)
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="app-shell">
      <main className="dashboard">
        <section className="panel filters-panel">
          <div className="filters-grid">
            <label className="field">
              <span>Periodo</span>
              <PeriodSelect
                value={filters.preset}
                options={presetOptions}
                onChange={applyPreset}
              />
            </label>

            <label className="field">
              <span>Data inicial</span>
              <div className="date-field">
                <DatePicker
                  selected={parseDateInput(filters.startDate)}
                  onChange={(value: Date | null) => updateDatePicker('startDate', value)}
                  maxDate={parseDateInput(filters.endDate)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="date-input"
                  calendarClassName="calendar-surface"
                  popperClassName="calendar-popper"
                  wrapperClassName="date-picker-wrapper"
                  showPopperArrow={false}
                />
              </div>
            </label>

            <label className="field">
              <span>Data final</span>
              <div className="date-field">
                <DatePicker
                  selected={parseDateInput(filters.endDate)}
                  onChange={(value: Date | null) => updateDatePicker('endDate', value)}
                  minDate={parseDateInput(filters.startDate)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  className="date-input"
                  calendarClassName="calendar-surface"
                  popperClassName="calendar-popper"
                  wrapperClassName="date-picker-wrapper"
                  showPopperArrow={false}
                />
              </div>
            </label>

            <div className="filters-actions">
              <div className="button-row">
                <button type="button" className="ghost-button" onClick={resetFilters}>
                  Limpar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleFetch}
                  disabled={isLoading}
                >
                  {isLoading ? 'Buscando...' : 'Buscar dados'}
                </button>
              </div>

              {dataset && (
                <div className="status-badges">
                  <StatusBadge
                    tone="neutral"
                    icon={<ChatIcon />}
                    text={`${formatTotal(dataset.totalItems)} atendimentos`}
                  />
                  <StatusBadge
                    tone="neutral"
                    icon={<ClockIcon />}
                    text={`${formatTotal(dataset.pagesFetched)} paginas coletadas`}
                  />
                  <StatusBadge
                    tone="success"
                    icon={<CheckIcon />}
                    text={`Atualizado em ${formatDateTime(dataset.fetchedAt)}`}
                  />
                </div>
              )}
            </div>
          </div>

          {errorState && (
            <p className="error-banner">
              <span>{errorState.message}</span>
              <strong>Codigo: {errorState.code}</strong>
            </p>
          )}
        </section>

        {dataset ? (
          <>
            <section className="metrics-grid">
              <MetricCard
                label="Total de atendimentos"
                value={formatTotal(metrics.totalConversations)}
                badgeText="Todos do periodo"
                tone="primary"
              />
              <MetricCard
                label="Concluidos"
                value={formatTotal(metrics.completed)}
                badgeText={`${completedRate}% do total`}
                tone="success"
              />
              <MetricCard
                label="Em andamento"
                value={formatTotal(metrics.inProgress)}
                badgeText={`${inProgressRate}% do total`}
                tone="warning"
              />
              <MetricCard
                label="Pendentes"
                value={formatTotal(metrics.pending)}
                badgeText={`${pendingRate}% do total`}
                tone="danger"
              />
            </section>

            {otherStatuses > 0 && (
              <p className="status-note">
                A API retornou mais {formatTotal(otherStatuses)} atendimento(s) em outros
                status fora dos quatro indicadores principais.
              </p>
            )}

            <section className="charts-stack">
              <TrendChart
                items={createdAtSeries}
                filterSummary={trendFilterSummary}
                onOpenAdvancedFilters={() => setIsTrendFiltersOpen(true)}
              />

              <section className="line-grid">
                <MultiLineChart
                  title="Tipos de canal"
                  subtitle="Cada linha representa a evolucao diaria de um tipo de canal."
                  series={channelTypeSeries}
                />
                <MultiLineChart
                  title="Canais"
                  subtitle="Cada linha representa a evolucao diaria de um canal."
                  series={channelSeries}
                />
                <MultiLineChart
                  title="Equipes"
                  subtitle="Cada linha representa a evolucao diaria de uma equipe."
                  series={teamSeries}
                />
                <MultiLineChart
                  title="Usuarios"
                  subtitle="Cada linha representa a evolucao diaria de um usuario."
                  series={userSeries}
                />
              </section>
            </section>
          </>
        ) : (
          <section className="panel empty-panel">
            <div className="empty-copy">
              <span className="panel-kicker">Dashboard</span>
              <h2>Os graficos aparecem depois da primeira consulta.</h2>
              <p>Defina o periodo acima e busque os dados para montar a leitura analitica.</p>
            </div>
          </section>
        )}
      </main>

      {isLoading && <LoadingModal />}

      {dataset && isTrendFiltersOpen ? (
        <AdvancedFilterModal
          initialFilters={trendFilters}
          itemCount={dataset.items.length}
          channelTypeOptions={trendChannelTypeOptions}
          channelOptions={trendChannelOptions}
          teamOptions={trendTeamOptions}
          userOptions={trendUserOptions}
          onClose={() => setIsTrendFiltersOpen(false)}
          onApply={(nextFilters) => {
            setTrendFilters(nextFilters)
            setIsTrendFiltersOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

export default App
