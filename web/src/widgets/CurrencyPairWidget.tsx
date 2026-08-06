import { useQuery } from '@tanstack/react-query'
import { StatCard } from '@/components/shared/StatCard'
import { parsePrice, parseChange } from '@/lib/parse'
import api from '@/lib/api'
import type { RateEntry } from '@/types/api'

export default function CurrencyPairWidget({ config }: { config?: Record<string, unknown> }) {
  const code = (config?.code as string) || 'USD'

  const { data, isLoading } = useQuery({
    queryKey: ['currency-all'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/currency')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const entry = data?.[code]
  const price = entry ? parsePrice(entry.Buying) : null
  const change = entry ? parseChange(entry.Change) : null

  return (
    <StatCard
      title={code}
      value={price ? `₺${price.toFixed(4)}` : undefined}
      change={change}
      loading={isLoading}
    />
  )
}
