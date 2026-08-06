import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { marketRefetchInterval } from '@/lib/price'
import type { CompanySummary, FavoritesResponse } from '@/types/api'
import { companySummaryResponseSchema, favoritesResponseSchema, parseApi } from '@/lib/apiSchemas'
import { QuoteChange } from '@/components/shared/QuoteChange'

export default function FavoritesBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: favorites, isError: favoritesError, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get('/api/v1/favorites')
      return parseApi(favoritesResponseSchema, res.data).favorites as FavoritesResponse['favorites']
    },
    staleTime: 30_000,
  })

  const { data: favoriteSummaries, isError: summariesError, refetch: refetchSummaries } = useQuery({
    queryKey: ['favorite-summaries-dash', favorites],
    queryFn: async () => {
      const res = await api.get('/api/v1/companies/summary', {
        params: { limit: 10, tickers: favorites!.slice(0, 10).join(',') },
      })
      return parseApi(companySummaryResponseSchema, res.data).data as CompanySummary[]
    },
    enabled: !!favorites?.length,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: marketRefetchInterval,
  })

  const displayFavorites = favoriteSummaries ?? []
  const hasMore = (favorites?.length ?? 0) > displayFavorites.length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">{t('watchlist.title')}</CardTitle>
        </div>
        {hasMore && (
          <Button variant="ghost" size="sm" className="text-xs gap-0.5" onClick={() => navigate('/watchlist')}>
            {t('watchlist.title')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {favoritesError || summariesError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">Takip listesi yüklenemedi.</p>
            <Button variant="outline" size="sm" onClick={() => { void refetchFavorites(); void refetchSummaries() }}>
              Tekrar dene
            </Button>
          </div>
        ) : displayFavorites.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {displayFavorites.map((company) => {
              const ch = company.change_pct
              return (
                <Card
                  key={company.ticker}
                  className="flex-1 min-w-[140px] max-w-[200px] cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                  onClick={() => navigate(`/stocks/${company.ticker}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-sm text-primary">{company.ticker}</span>
                        <QuoteChange
                          change={ch}
                          changeWindow={company.change_window}
                          marketStatus={company.market_status}
                          isStale={company.is_stale}
                          asOf={company.as_of ?? company.price_updated_at}
                          compact
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{company.name}</p>
                    {company.last_price !== null && (
                      <p className="text-sm font-bold mt-1">₺{company.last_price.toFixed(2)}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Takip listeniz boş. Hisseler sayfasından hisse ekleyebilirsiniz.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
