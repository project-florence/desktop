import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StockSearch } from '@/components/shared/StockSearch'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { CompanyCard } from '@/components/shared/CompanyCard'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useNavStore } from '@/stores/navStore'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import { marketRefetchInterval } from '@/lib/price'
import type { CompanySummaryResponse } from '@/types/api'
import { companySummaryResponseSchema, parseApi } from '@/lib/apiSchemas'

const PER_PAGE = 50

const SORT_OPTIONS = [
  { value: 'popular', labelKey: 'stocks.sortPopular' },
  { value: 'alphabetical', labelKey: 'stocks.sortAlphabetical' },
  { value: 'gainers', labelKey: 'stocks.sortGainers' },
  { value: 'losers', labelKey: 'stocks.sortLosers' },
  { value: 'price_high', labelKey: 'stocks.sortPriceHigh' },
  { value: 'price_low', labelKey: 'stocks.sortPriceLow' },
  { value: 'volume', labelKey: 'stocks.sortVolume' },
  { value: 'market_cap', labelKey: 'stocks.sortMarketCap' },
]

export default function StocksPage() {
  const { t } = useTranslation()
  usePageTitle(t('stocks.title'))
  const navigate = useNavigate()
  const savedPage = useNavStore((s) => s.stocksPage)
  const setStocksPage = useNavStore((s) => s.setStocksPage)
  const [page, setPage] = useState(savedPage)
  const [sort, setSort] = useState('popular')

  useEffect(() => {
    setStocksPage(page)
  }, [page, setStocksPage])

  useEffect(() => {
    setPage(1)
  }, [sort])

  const offset = (page - 1) * PER_PAGE

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies-summary', page, sort],
    queryFn: async () => {
      const res = await api.get('/api/v1/companies/summary', {
        params: { limit: PER_PAGE, offset, sort },
      })
       return parseApi(companySummaryResponseSchema, res.data) as CompanySummaryResponse
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: true,
    refetchInterval: marketRefetchInterval,
  })

  const companies = data?.data ?? []
  const totalPages = data ? Math.ceil(data.total / PER_PAGE) : 0
  const isLastPage = page >= totalPages

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => v && setSort(v)}>
            <SelectTrigger className="w-40 h-9">
              <span>{t(SORT_OPTIONS.find((o) => o.value === sort)?.labelKey ?? '')}</span>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-sm">
        <StockSearch
          onSelect={(ticker) => navigate(`/stocks/${ticker}`)}
          autoFocus
        />
      </div>

      {!isLoading && !isError && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[5rem] text-center">
              {data ? `${page}/${totalPages}` : `${t('stocks.page')} ${page}`}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={isLastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isError ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Hisse verileri yüklenemedi.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
          </CardContent>
        </Card>
      ) : <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: PER_PAGE }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : companies.map((company, i) => (
              <div key={company.ticker} className="animate-slideUp" style={{ animationDelay: `${(i % 12) * 50}ms` }}>
                <CompanyCard
                  company={company}
                  action={<FavoriteButton ticker={company.ticker} />}
                />
              </div>
            ))}
      </div>}
    </div>
  )
}
