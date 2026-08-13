import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { parsePrice, parseChange } from '@/lib/parse'
import { PortfolioBuySell } from '@/components/shared/PortfolioBuySell'
import { isEconomyEmpty } from '@/lib/economy'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import type { RateEntry } from '@/types/api'

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', CHF: '🇨🇭', JPY: '🇯🇵',
  CAD: '🇨🇦', AUD: '🇦🇺', RUB: '🇷🇺', CNY: '🇨🇳', INR: '🇮🇳',
  BRL: '🇧🇷', MXN: '🇲🇽', KRW: '🇰🇷', TRY: '🇹🇷', SEK: '🇸🇪',
  NOK: '🇳🇴', DKK: '🇩🇰', ZAR: '🇿🇦', SGD: '🇸🇬', HKD: '🇭🇰',
  NZD: '🇳🇿', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', ILS: '🇮🇱',
}

function CurrencyCard({ code, entry, index = 0 }: { code: string; entry: RateEntry; index?: number }) {
  const { t } = useTranslation()
  const price = parsePrice(entry.Buying)
  const change = parseChange(entry.Change)

  return (
    <div className="animate-slideUp" style={{ animationDelay: `${(index % 10) * 60}ms` }}>
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{CURRENCY_FLAGS[code] || '💱'}</span>
          <span className="font-mono font-bold text-primary">{code}</span>
          <span className="text-xs text-muted-foreground truncate">{t(`currencies.${code}`, code)}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.buy')}</span>
            <span className="font-medium">{price ? price.toFixed(4) : entry.Buying}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.sell')}</span>
            <span className="font-medium">{entry.Selling}</span>
          </div>
        </div>
        {change !== null && (
          <div className={cn(
            'flex items-center gap-1 mt-2 text-xs font-semibold',
            change >= 0 ? 'text-success' : 'text-destructive',
          )}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        )}
        <div className="mt-2">
          <PortfolioBuySell ticker={code} variant="compact" />
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

export default function CurrencyPage() {
  const { t } = useTranslation()
  usePageTitle(t('nav.currency'))

  const { data: rates, isLoading, isError, refetch } = useQuery({
    queryKey: ['currency-all'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/currency')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const pinned = ['USD', 'EUR', 'GBP', 'CHF', 'JPY']
  const pinnedRates = pinned.filter((c) => rates?.[c]).map((c) => [c, rates![c]] as const)
  const otherRates = rates
    ? Object.entries(rates).filter(([code]) => !pinned.includes(code))
    : []

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : isError || isEconomyEmpty(rates as Record<string, unknown>) ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Döviz verisi alınamadı. Veri sağlayıcıya ulaşılamıyor olabilir.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('currency.major')}</h3>
            <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pinnedRates.map(([code, entry], i) => (
                <CurrencyCard key={code} code={code} entry={entry} index={i} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('currency.other')}</h3>
            <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {otherRates.map(([code, entry], i) => (
                <CurrencyCard key={code} code={code} entry={entry} index={i + 5} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
