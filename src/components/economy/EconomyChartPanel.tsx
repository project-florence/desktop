import { useState, useMemo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import type { EconomyCandle, PriceHistory } from '@/types/api'

// klinecharts agir (~226 kB); yalnizca panel render edilince yuklenir.
const StockChart = lazy(() => import('@/components/shared/StockChart').then((m) => ({ default: m.StockChart })))

export interface EconomySymbolOption {
  value: string
  label: string
}

const PERIODS = ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'] as const

/** Kanonik history endpoint'i + StockChart ile metal/döviz grafiği (rapor ⑭). */
export function EconomyChartPanel({
  symbols,
  defaultSymbol,
  title,
}: {
  symbols: EconomySymbolOption[]
  defaultSymbol?: string
  title?: string
}) {
  const { t } = useTranslation()
  const [symbol, setSymbol] = useState(defaultSymbol ?? symbols[0]?.value ?? '')
  const [period, setPeriod] = useState<string>('1y')

  const { data, isLoading } = useQuery({
    queryKey: ['economy-history', symbol, period],
    queryFn: async () => {
      const res = await api.get(`/api/v1/economy/history/${symbol}`, {
        params: { period, interval: '1d' },
      })
      return res.data as EconomyCandle[]
    },
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const history: PriceHistory[] = useMemo(
    () => (data ?? []).map((c) => ({
      ts: c.ts,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume ?? 0,
    })),
    [data],
  )

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium">{title ?? t('economy.chart')}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={symbol} onValueChange={(v) => v && setSymbol(v)}>
              <SelectTrigger className="w-36 h-8">
                <span className="font-mono text-xs">{symbol}</span>
              </SelectTrigger>
              <SelectContent>
                {symbols.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-0.5">
              {PERIODS.map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="text-[10px] h-8 px-1.5"
                >
                  {t(`time.${p}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : history.length > 0 ? (
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <StockChart data={history} loading={false} height={300} />
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            {t('economy.noData')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
