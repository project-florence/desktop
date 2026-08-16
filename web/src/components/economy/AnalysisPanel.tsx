import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import type { EconomyAnalysis } from '@/types/api'
import type { EconomySymbolOption } from './EconomyChartPanel'

function Metric({ label, value, format = 'num' }: {
  label: string
  value: number | null | undefined
  format?: 'num' | 'pct' | 'rank'
}) {
  const formatted = (() => {
    if (value === null || value === undefined) return '—'
    if (format === 'pct') return `%${value.toFixed(2)}`
    if (format === 'rank') return `%${(value * 100).toFixed(0)}`
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  })()
  return (
    <div className="rounded-lg border p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums mt-0.5">{formatted}</p>
    </div>
  )
}

/** Kanonik analysis endpoint'i — teknik metrikler + 52 hafta rekorları (rapor ⑮). */
export function AnalysisPanel({
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

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['economy-analysis', symbol],
    queryFn: async () => {
      const res = await api.get(`/api/v1/economy/analysis/${symbol}`)
      return res.data as EconomyAnalysis
    },
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: false,
  })

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium">{title ?? t('economy.analysis')}</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-muted-foreground">{t('economy.analysisNoData')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              {t('common.retry')}
            </Button>
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Metric label={t('economy.sma5')} value={data.sma_5} />
            <Metric label={t('economy.sma20')} value={data.sma_20} />
            <Metric label={t('economy.sma50')} value={data.sma_50} />
            <Metric label={t('economy.sma200')} value={data.sma_200} />
            <Metric label={t('economy.rsi14')} value={data.rsi_14} />
            <Metric label={t('economy.volatility20d')} value={data.volatility_20d} format="pct" />
            <Metric label={t('economy.priceVsSma20')} value={data.price_vs_sma_20} format="pct" />
            <Metric label={t('economy.changeDaily')} value={data.change_daily_pct} format="pct" />
            <Metric label={t('economy.changeWeek')} value={data.change_week_pct} format="pct" />
            <Metric label={t('economy.changeMonth')} value={data.change_month_pct} format="pct" />
            <Metric label={t('economy.high52w')} value={data.high_52w} />
            <Metric label={t('economy.low52w')} value={data.low_52w} />
            <Metric label={t('economy.allTimeHigh')} value={data.all_time_high} />
            <Metric label={t('economy.allTimeLow')} value={data.all_time_low} />
            <Metric label={t('economy.rank52w')} value={data.rank_in_52w} format="rank" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
