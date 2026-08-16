import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/shared/StatCard'
import { useEconomyQuotes } from '@/hooks/useEconomyQuotes'
import { currencySymbol } from '@/lib/economy'

interface StatCardWidgetConfig {
  titleKey?: string
  dataSource?: 'gold' | 'currency'
  pair?: string
}

export default function StatCardWidget({ config }: { config?: Record<string, unknown> }) {
  const { t } = useTranslation()
  const cfg = config as StatCardWidgetConfig | undefined

  const isGold = cfg?.dataSource === 'gold'
  const group: 'fx' | 'metal' = isGold ? 'metal' : 'fx'
  const symbol = isGold ? 'XAU-GRAM' : (cfg?.pair ?? '').toUpperCase()

  const { data, isLoading } = useEconomyQuotes(group)

  const quote = symbol ? data?.quotes[symbol] : undefined
  const price = quote?.buying ?? quote?.price ?? null
  const change = quote?.change_pct ?? null

  const title = cfg?.titleKey ? t(cfg.titleKey) : '—'
  const value = price != null
    ? `${currencySymbol(quote?.currency)}${price.toLocaleString('tr-TR', {
        minimumFractionDigits: isGold ? 0 : 2,
        maximumFractionDigits: isGold ? 0 : 2,
      })}`
    : undefined

  return (
    <StatCard
      title={title}
      value={value}
      change={change}
      loading={isLoading}
    />
  )
}
