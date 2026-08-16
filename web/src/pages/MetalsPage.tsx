import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Gem } from 'lucide-react'
import { parseChange } from '@/lib/parse'
import { PortfolioBuySell } from '@/components/shared/PortfolioBuySell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useEconomyQuotes } from '@/hooks/useEconomyQuotes'
import { CANONICAL_TO_LEGACY, currencySymbol, unitLabel } from '@/lib/economy'
import { EconomyChartPanel, type EconomySymbolOption } from '@/components/economy/EconomyChartPanel'
import { AnalysisPanel } from '@/components/economy/AnalysisPanel'
import { RecordsPanel } from '@/components/economy/RecordsPanel'
import { ProvidersPanel } from '@/components/economy/ProvidersPanel'
import type { Quote } from '@/types/api'

const METAL_KEYS: Record<string, string> = {
  ons: 'goldOz',
  'gram-altin': 'goldGram',
  'gram-has-altin': 'goldPure',
  'ceyrek-altin': 'goldQuarter',
  'yarim-altin': 'goldHalf',
  'tam-altin': 'goldFull',
  'cumhuriyet-altini': 'goldRepublic',
  'ata-altin': 'goldAta',
  '14-ayar-altin': 'gold14k',
  '18-ayar-altin': 'gold18k',
  '22-ayar-bilezik': 'gold22k',
  'ikibucuk-altin': 'gold25',
  'gremse-altin': 'goldGremse',
  'resat-altin': 'goldResat',
  'besli-altin': 'gold5',
  'hamit-altin': 'goldHamit',
  'gumus': 'silver',
  'gram-palatin': 'platinum',
  'gram-platin': 'platinum',
  'gram-paladyum': 'palladium',
}

// Kanonik sıralama (backend `_GOLD_CANONICAL` aynası) — altın grid düzenini korur.
const GOLD_CANONICAL_ORDER = [
  'XAU-ONS', 'XAU-GRAM', 'XAU-HAS', 'XAU-CEYREK', 'XAU-YARIM', 'XAU-TAM',
  'XAU-CUMHURIYET', 'XAU-ATA', 'XAU-14-AYAR', 'XAU-18-AYAR', 'XAU-22-BILEZIK',
  'XAU-IKIBUCUK', 'XAU-BESLI', 'XAU-GREMSE', 'XAU-RESAT', 'XAU-HAMIT',
]

const OTHER_METAL_CANONICAL = ['XAG-GRAM', 'XPT-GRAM', 'XPD-GRAM']

function PriceText({ value, entry }: { value: number | null | undefined; entry: Quote }) {
  const { t } = useTranslation()
  const unit = unitLabel(entry.unit)
  const unitText = unit === 'gram' ? t('economy.unitGram') : unit === 'ounce' ? t('economy.unitOunce') : ''
  if (value === null || value === undefined) return <span>—</span>
  return (
    <span>
      {currencySymbol(entry.currency)}
      {value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      {unitText ? ` ${unitText}` : ''}
    </span>
  )
}

function MetalCard({ id, entry, index = 0 }: { id: string; entry: Quote; index?: number }) {
  const { t } = useTranslation()
  const change = parseChange(entry.change_pct)
  return (
    <div className="animate-slideUp" style={{ animationDelay: `${(index % 12) * 60}ms` }}>
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{id.includes('altin') || id === 'ons' ? '🥇' : '🥈'}</span>
          <span className="font-medium text-sm">{t(`metals.${METAL_KEYS[id]}`) || id}</span>
          {entry.stale && (
            <Badge variant="outline" className="h-4 px-1 text-[9px] text-amber-600">
              {t('economy.stale')}
            </Badge>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.buy')}</span>
            <span className="font-medium tabular-nums">
              <PriceText value={entry.buying ?? entry.price} entry={entry} />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.sell')}</span>
            <span className="font-medium tabular-nums">
              <PriceText value={entry.selling} entry={entry} />
            </span>
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
          <PortfolioBuySell ticker={id} variant="compact" />
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

export default function MetalsPage() {
  const { t } = useTranslation()
  usePageTitle(t('nav.metals'))

  // Tek kanonik istek: legacy gold-prices + silver + platin + paladyum çağrılarının yerine.
  const { data: bundle, isLoading, isError, refetch } = useEconomyQuotes('metal')
  const quotes = bundle?.quotes ?? {}
  const quotesEmpty = !bundle || Object.keys(quotes).length === 0

  const goldPairs = GOLD_CANONICAL_ORDER
    .filter((sym) => quotes[sym] && CANONICAL_TO_LEGACY[sym])
    .map((sym) => [CANONICAL_TO_LEGACY[sym], sym] as const)

  const otherPairs = OTHER_METAL_CANONICAL
    .filter((sym) => quotes[sym] && CANONICAL_TO_LEGACY[sym])
    .map((sym) => [CANONICAL_TO_LEGACY[sym], sym] as const)

  const chartSymbols: EconomySymbolOption[] = [
    { value: 'XAU-ONS', label: t('metals.goldOz') },
    { value: 'XAU-GRAM', label: t('metals.goldGram') },
    { value: 'XAU-CEYREK', label: t('metals.goldQuarter') },
    { value: 'XAU-YARIM', label: t('metals.goldHalf') },
    { value: 'XAU-TAM', label: t('metals.goldFull') },
    { value: 'XAU-CUMHURIYET', label: t('metals.goldRepublic') },
    { value: 'XAU-ATA', label: t('metals.goldAta') },
    { value: 'XAU-14-AYAR', label: t('metals.gold14k') },
    { value: 'XAU-18-AYAR', label: t('metals.gold18k') },
    { value: 'XAU-22-BILEZIK', label: t('metals.gold22k') },
    { value: 'XAG-ONS', label: `${t('metals.silver')} (ons)` },
    { value: 'XAG-GRAM', label: t('metals.silver') },
    { value: 'XPT-ONS', label: `${t('metals.platinum')} (ons)` },
    { value: 'XPT-GRAM', label: t('metals.platinum') },
    { value: 'XPD-ONS', label: `${t('metals.palladium')} (ons)` },
    { value: 'XPD-GRAM', label: t('metals.palladium') },
  ]

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : isError || quotesEmpty ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Kıymetli maden verisi alınamadı. Veri sağlayıcıya ulaşılamıyor olabilir.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {t('economy.source')}: {bundle?.source ?? '—'} · {t('economy.updatedAt')}:{' '}
            {bundle?.ts ? new Date(bundle.ts).toLocaleString('tr-TR') : '—'}
          </p>
          {goldPairs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Gem className="h-4 w-4" /> Altın
              </h3>
              <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {goldPairs.map(([id, sym], i) => (
                  <MetalCard key={id} id={id} entry={quotes[sym]} index={i} />
                ))}
              </div>
            </div>
          )}
          {otherPairs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Diğer Değerli Metaller</h3>
              <div className="grid gap-4 items-stretch grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {otherPairs.map(([id, sym], i) => (
                  <MetalCard key={id} id={id} entry={quotes[sym]} index={i + 14} />
                ))}
              </div>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <EconomyChartPanel symbols={chartSymbols} defaultSymbol="XAU-GRAM" />
            <AnalysisPanel symbols={chartSymbols} defaultSymbol="XAU-GRAM" />
          </div>
          <RecordsPanel symbols={[...GOLD_CANONICAL_ORDER, ...OTHER_METAL_CANONICAL]} />
          <ProvidersPanel />
        </>
      )}
    </div>
  )
}
