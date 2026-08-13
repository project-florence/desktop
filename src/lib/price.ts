import type { PriceHistory } from '@/types/api'

const INTRADAY_INTERVALS = new Set(['1m', '5m', '15m', '30m', '1h'])

const PERIOD_DAYS: Record<string, number> = {
  '1d': 1,
  '5d': 5,
  '1mo': 30,
  '3mo': 90,
  '6mo': 180,
  '1y': 365,
  '5y': 1825,
}

export function filterByPeriod(data: PriceHistory[], period: string): PriceHistory[] {
  const days = PERIOD_DAYS[period]
  if (!days) return data
  const cutoff = Date.now() - days * 86_400_000
  return data.filter((d) => new Date(d.ts).getTime() >= cutoff)
}

export function aggregateToInterval(data: PriceHistory[], interval: string): PriceHistory[] {
  if (interval === '1d') return data

  const buckets = new Map<string, PriceHistory[]>()
  for (const d of [...data].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())) {
    const date = new Date(d.ts)
    const key = interval === '1wk'
      ? getWeekStart(date)
      : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(d)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, candles]) => ({
      ts: candles[0].ts,
      open: candles[0].open,
      high: Math.max(...candles.map((c) => c.high ?? 0)),
      low: Math.min(...candles.map((c) => c.low ?? Infinity)),
      close: candles[candles.length - 1].close,
      volume: candles.reduce((s, c) => s + (c.volume ?? 0), 0),
    }))
}

export function processPriceData(
  data: PriceHistory[],
  period: string,
  interval: string,
): { data: PriceHistory[]; from: number; to: number } {
  const filtered = filterByPeriod(data, period)
  let result = filtered

  if (!INTRADAY_INTERVALS.has(interval)) {
    result = aggregateToInterval(data, interval)
  }

  const days = PERIOD_DAYS[period] || 1825
  const now = Date.now()
  return { data: result, from: now - days * 86_400_000, to: now }
}

export function marketRefetchInterval(query: { state: { data: unknown } }): number | false {
  const data = query.state.data as
    | { market_status?: string }
    | Array<{ market_status?: string }>
    | { data?: Array<{ market_status?: string }> }
    | undefined
  if (!data) return 30_000
  let status: string | undefined
  if (Array.isArray(data)) {
    status = data[0]?.market_status
  } else if ('data' in data && Array.isArray(data.data)) {
    status = data.data[0]?.market_status
  } else {
    status = (data as { market_status?: string }).market_status
  }
  return status === 'closed' ? false : 30_000
}

export function computeDailyChange(data: PriceHistory[]): { close: number; prevClose: number; change: number } | null {
  const valid = data.filter((d) => isFinite(d.close)).slice(-2)
  if (valid.length < 2) return null
  return {
    close: valid[1].close,
    prevClose: valid[0].close,
    change: ((valid[1].close - valid[0].close) / valid[0].close) * 100,
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1)
  d.setUTCDate(diff)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
