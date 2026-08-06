import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { StatCard } from '@/components/shared/StatCard'
import { parsePrice, parseChange } from '@/lib/parse'
import api from '@/lib/api'
import type { RateEntry } from '@/types/api'

interface StatCardWidgetConfig {
  titleKey?: string
  dataSource?: 'gold' | 'currency'
  pair?: string
}

export default function StatCardWidget({ config }: { config?: Record<string, unknown> }) {
  const { t } = useTranslation()
  const cfg = config as StatCardWidgetConfig | undefined

  const isGold = cfg?.dataSource === 'gold'
  const queryKey = isGold ? 'gold' : 'rates'
  const endpoint = isGold ? '/api/v1/economy/gold-prices' : '/api/v1/economy/currency'

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await api.get(endpoint)
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  let price: number | null = null
  let change: number | null = null

  if (isGold) {
    const goldEntry = data?.['gram-altin']
    price = goldEntry ? parsePrice(goldEntry.Buying) : null
    change = goldEntry ? parseChange(goldEntry.Change) : null
  } else if (cfg?.pair && data) {
    const entry = data[cfg.pair]
    price = entry ? parsePrice(entry.Buying) : null
    change = entry ? parseChange(entry.Change) : null
  }

  const title = cfg?.titleKey ? t(cfg.titleKey) : '—'
  const value = price
    ? `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: isGold ? 0 : 2, maximumFractionDigits: isGold ? 0 : 2 })}`
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
