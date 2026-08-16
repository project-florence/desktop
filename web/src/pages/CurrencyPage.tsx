import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { parsePrice, parseChange } from '@/lib/parse'
import { PortfolioBuySell } from '@/components/shared/PortfolioBuySell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useEconomyQuotes } from '@/hooks/useEconomyQuotes'
import { currencySymbol } from '@/lib/economy'
import { EconomyChartPanel, type EconomySymbolOption } from '@/components/economy/EconomyChartPanel'
import { RecordsPanel } from '@/components/economy/RecordsPanel'
import { ProvidersPanel } from '@/components/economy/ProvidersPanel'
import type { Quote } from '@/types/api'

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', CHF: '🇨🇭', JPY: '🇯🇵',
  CAD: '🇨🇦', AUD: '🇦🇺', RUB: '🇷🇺', CNY: '🇨🇳', INR: '🇮🇳',
  BRL: '🇧🇷', MXN: '🇲🇽', KRW: '🇰🇷', TRY: '🇹🇷', SEK: '🇸🇪',
  NOK: '🇳🇴', DKK: '🇩🇰', ZAR: '🇿🇦', SGD: '🇸🇬', HKD: '🇭🇰',
  NZD: '🇳🇿', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', ILS: '🇮🇱',
}

function CurrencyCard({ code, entry, index = 0 }: { code: string; entry: Quote; index?: number }) {
  const { t } = useTranslation()
  const price = parsePrice(entry.buying)
  const change = parseChange(entry.change_pct)
  const symbol = currencySymbol(entry.currency)

  return (
    <div className="animate-slideUp" style={{ animationDelay: `${(index % 10) * 60}ms` }}>
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{CURRENCY_FLAGS[code] || '💱'}</span>
          <span className="font-mono font-bold text-primary">{code}</span>
          <span className="text-xs text-muted-foreground truncate">{t(`currencies.${code}`, code)}</span>
          {entry.stale && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] text-amber-600 shrink-0">
              {t('economy.stale')}
            </Badge>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.buy')}</span>
            <span className="font-medium tabular-nums">{price != null ? `${symbol}${price.toFixed(4)}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.sell')}</span>
            <span className="font-medium tabular-nums">{entry.selling != null ? `${symbol}${entry.selling.toFixed(4)}` : '—'}</span>
          </div>
        </div>
        {change !== null ? (
          <div className={cn(
            'flex items-center gap-1 mt-2 text-xs font-semibold',
            change >= 0 ? 'text-success' : 'text-destructive',
          )}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </div>
        ) : (
          // Backend yönergesi: Change null ise "—" göster (0.00 asla üretilmez).
          <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-muted-foreground">—</div>
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

  // ?symbols=USD,EUR filtresi: yalnızca istenen kurlar istenir (backend destekler).
  const [searchParams] = useSearchParams()
  const symbolsParam = searchParams.get('symbols')
  const requested = symbolsParam
    ? symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : undefined

  const { data: bundle, isLoading, isError, refetch } = useEconomyQuotes('fx', requested)
  const quotes = bundle?.quotes ?? {}
  const quotesEmpty = !bundle || Object.keys(quotes).length === 0

  const pinned = ['USD', 'EUR', 'GBP', 'CHF', 'JPY']
  const pinnedPairs = pinned.filter((c) => quotes[c]).map((c) => [c, quotes[c]] as const)
  const otherPairs = Object.entries(quotes).filter(([code]) => !pinned.includes(code))

  const chartSymbols: EconomySymbolOption[] = [
    'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'RUB', 'CNY', 'SEK', 'NOK', 'DKK',
  ].map((c) => ({ value: c, label: t(`currencies.${c}`, c) }))

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : isError || quotesEmpty ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Döviz verisi alınamadı. Veri sağlayıcıya ulaşılamıyor olabilir.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t('economy.source')}: {bundle?.source ?? '—'} · {t('economy.updatedAt')}:{' '}
            {bundle?.ts ? new Date(bundle.ts).toLocaleString('tr-TR') : '—'}
          </p>
          {requested ? (
            <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Object.entries(quotes).map(([code, entry], i) => (
                <CurrencyCard key={code} code={code} entry={entry} index={i} />
              ))}
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('currency.major')}</h3>
                <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {pinnedPairs.map(([code, entry], i) => (
                    <CurrencyCard key={code} code={code} entry={entry} index={i} />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('currency.other')}</h3>
                <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {otherPairs.map(([code, entry], i) => (
                    <CurrencyCard key={code} code={code} entry={entry} index={i + 5} />
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <EconomyChartPanel symbols={chartSymbols} defaultSymbol="USD" />
            <ProvidersPanel />
          </div>
          <RecordsPanel symbols={requested ?? Object.keys(quotes)} />
        </>
      )}
    </div>
  )
}
