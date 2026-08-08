import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { processPriceData } from '@/lib/price'
import api from '@/lib/api'
import type { PriceHistory } from '@/types/api'

// klinecharts agir (~226 kB); sadece widget gercekten render edilince yuklenir.
const StockChart = lazy(() => import('@/components/shared/StockChart').then((m) => ({ default: m.StockChart })))

const PERIODS = [
  { label: '1g', value: '1d' },
  { label: '1h', value: '1wk' },
  { label: '1a', value: '1mo' },
  { label: '3a', value: '3mo' },
  { label: '6a', value: '6mo' },
  { label: '1y', value: '1y' },
] as const

const INTERVALS = [
  { label: '5dk', value: '5m' },
  { label: '30dk', value: '30m' },
  { label: '1s', value: '1h' },
  { label: '1g', value: '1d' },
] as const

const PERIOD_VALUES = PERIODS.map((p) => p.value)
const INTERVAL_MAX_PERIOD: Record<string, string> = {
  '5m': '1d',
  '30m': '5d',
  '1h': '1mo',
}

function clampPeriod(interval: string, period: string): string {
  const max = INTERVAL_MAX_PERIOD[interval]
  if (!max) return period
  const maxIdx = PERIOD_VALUES.indexOf(max as typeof PERIOD_VALUES[number])
  if (maxIdx === -1) return period
  const curIdx = PERIOD_VALUES.indexOf(period as typeof PERIOD_VALUES[number])
  if (curIdx > maxIdx) return max
  return period
}

export default function StockChartWidget({ config }: { config?: Record<string, unknown> }) {
  const ticker = (config?.ticker as string) || 'THYAO'
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(PERIODS[PERIOD_VALUES.indexOf(clampPeriod('5m', PERIODS[0].value) as typeof PERIOD_VALUES[number])])
  const [interval, setInterval] = useState<string>('5m')

  useEffect(() => {
    const clamped = clampPeriod(interval, period.value)
    if (clamped !== period.value) {
      setPeriod(PERIODS[PERIOD_VALUES.indexOf(clamped as typeof PERIOD_VALUES[number])])
    }
  }, [interval])

  const { data, isLoading } = useQuery({
    queryKey: ['price-history', ticker, period.value, interval],
    queryFn: async () => {
      const res = await api.get(`/api/v1/price/history/${ticker}`, {
        params: { period: period.value, interval },
      })
      return res.data as PriceHistory[]
    },
    enabled: !!ticker,
    staleTime: interval === '5m' ? 30_000 : 5 * 60_000,
  })

  const processed = useMemo(() => {
    if (!data) return { data: [] as PriceHistory[], from: 0, to: 0 }
    return processPriceData(data, period.value, interval)
  }, [data, period.value, interval])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{ticker}</CardTitle>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period.value === p.value ? 'gradient' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="text-[10px] h-6 px-1.5"
              >
                {p.label}
              </Button>
            ))}
            <span className="text-[10px] text-muted-foreground mx-0.5">|</span>
            {INTERVALS.map((i) => (
              <Button
                key={i.value}
                variant={interval === i.value ? 'gradient' : 'ghost'}
                size="sm"
                onClick={() => setInterval(i.value)}
                className="text-[10px] h-6 px-1.5"
              >
                {i.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data && data.length > 0 ? (
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <StockChart data={processed.data} loading={false} visibleRange={{ from: processed.from, to: processed.to }} height="100%" className="min-h-[240px]" />
          </Suspense>
        ) : (
          <p className="text-xs text-muted-textforeground">No data</p>
        )}
      </CardContent>
    </Card>
  )
}
