import { StatCard } from '@/components/shared/StatCard'
import { useEconomyQuotes } from '@/hooks/useEconomyQuotes'
import { currencySymbol, toCanonicalSymbol } from '@/lib/economy'

const METAL_NAMES: Record<string, string> = {
  'gram-altin': 'Gram Altın',
  gumus: 'Gümüş',
  ons: 'Ons Altın',
  'ceyrek-altin': 'Çeyrek Altın',
}

export default function MetalPriceWidget({ config }: { config?: Record<string, unknown> }) {
  const metal = (config?.metal as string) || 'gram-altin'
  const canonical = toCanonicalSymbol(metal)

  const { data, isLoading } = useEconomyQuotes('metal')

  const quote = data?.quotes[canonical]
  const price = quote?.buying ?? quote?.price ?? null
  const change = quote?.change_pct ?? null

  return (
    <StatCard
      title={METAL_NAMES[metal] || metal}
      value={price != null ? `${currencySymbol(quote?.currency)}${price.toLocaleString('tr-TR')}` : undefined}
      change={change}
      loading={isLoading}
    />
  )
}
