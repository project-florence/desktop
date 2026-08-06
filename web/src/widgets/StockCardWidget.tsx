import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/lib/api'
import { marketRefetchInterval } from '@/lib/price'
import type { CompanySummary } from '@/types/api'
import { companySummaryResponseSchema, parseApi } from '@/lib/apiSchemas'
import { QuoteChange } from '@/components/shared/QuoteChange'

export default function StockCardWidget({ config }: { config?: Record<string, unknown> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ticker = (config?.ticker as string) || 'THYAO'

  const { data, isLoading } = useQuery({
    queryKey: ['stock-card', ticker],
    queryFn: async () => {
      const res = await api.get('/api/v1/companies/summary', { params: { limit: 1, tickers: ticker } })
      return (parseApi(companySummaryResponseSchema, res.data) as { data: CompanySummary[] }).data[0]
    },
    enabled: !!ticker,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: marketRefetchInterval,
  })

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="p-4 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    )
  }

  const ch = data.change_pct

  return (
    <Card className="h-full cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200" onClick={() => navigate(`/stocks/${data.ticker}`)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono font-bold text-sm text-primary">{data.ticker}</span>
          <QuoteChange
            change={ch}
            changeWindow={data.change_window}
            marketStatus={data.market_status}
            isStale={data.is_stale}
            asOf={data.as_of ?? data.price_updated_at}
            compact
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{data.name}</p>
        {data.last_price !== null && (
          <p className="text-lg font-bold mt-2">₺{data.last_price.toFixed(2)}</p>
        )}
      </CardContent>
    </Card>
  )
}
