import { StatCard } from '@/components/shared/StatCard'
import { useEconomyQuotes } from '@/hooks/useEconomyQuotes'
import { currencySymbol } from '@/lib/economy'

export default function CurrencyPairWidget({ config }: { config?: Record<string, unknown> }) {
  const code = ((config?.code as string) || 'USD').toUpperCase()

  const { data, isLoading } = useEconomyQuotes('fx')

  const quote = data?.quotes[code]
  const price = quote?.buying ?? null
  const change = quote?.change_pct ?? null

  return (
    <StatCard
      title={code}
      value={price != null ? `${currencySymbol(quote?.currency)}${price.toFixed(4)}` : undefined}
      change={change}
      loading={isLoading}
    />
  )
}
