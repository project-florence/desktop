import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Gem } from 'lucide-react'
import { parseChange } from '@/lib/parse'
import { PortfolioBuySell } from '@/components/shared/PortfolioBuySell'
import { isEconomyEmpty } from '@/lib/economy'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import type { RateEntry } from '@/types/api'

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

function MetalCard({ id, entry, index = 0 }: { id: string; entry: RateEntry; index?: number }) {
  const { t } = useTranslation()
  const change = parseChange(entry.Change)
  return (
    <div className="animate-slideUp" style={{ animationDelay: `${(index % 12) * 60}ms` }}>
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{id.includes('altin') || id === 'ons' ? '🥇' : '🥈'}</span>
          <span className="font-medium text-sm">{t(`metals.${METAL_KEYS[id]}`) || id}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('currency.buy')}</span>
            <span className="font-medium">{entry.Buying}</span>
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

  const { data: gold, isLoading: goldLoading, isError: goldError, refetch: refetchGold } = useQuery({
    queryKey: ['gold-all'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/gold-prices')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const { data: silver } = useQuery({
    queryKey: ['silver'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/silver-price')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const { data: platinum } = useQuery({
    queryKey: ['platinum'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/gram-platinum-price')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const { data: palladium } = useQuery({
    queryKey: ['palladium'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/gram-palladium-price')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const otherMetals = {
    ...(silver || {}),
    ...(platinum || {}),
    ...(palladium || {}),
  }

  return (
    <div className="space-y-6">
      {goldLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : goldError || isEconomyEmpty(gold as Record<string, unknown>) ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">Kıymetli maden verisi alınamadı. Veri sağlayıcıya ulaşılamıyor olabilir.</p>
            <Button variant="outline" size="sm" onClick={() => refetchGold()}>Tekrar dene</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {gold && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Gem className="h-4 w-4" /> Altın
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Object.entries(gold).map(([id, entry], i) => (
                  <MetalCard key={id} id={id} entry={entry} index={i} />
                ))}
              </div>
            </div>
          )}
          {Object.keys(otherMetals).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Diğer Değerli Metaller</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Object.entries(otherMetals).map(([id, entry], i) => (
                  <MetalCard key={id} id={id} entry={entry} index={i + 14} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
