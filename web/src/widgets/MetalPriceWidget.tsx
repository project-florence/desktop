import { useQuery } from '@tanstack/react-query'
import { StatCard } from '@/components/shared/StatCard'
import { parsePrice, parseChange } from '@/lib/parse'
import api from '@/lib/api'
import type { RateEntry } from '@/types/api'

export default function MetalPriceWidget({ config }: { config?: Record<string, unknown> }) {
  const metal = (config?.metal as string) || 'gram-altin'

  const { data, isLoading } = useQuery({
    queryKey: ['gold'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/gold-prices')
      return res.data as Record<string, RateEntry>
    },
    staleTime: 60_000,
  })

  const entry = data?.[metal]
  const price = entry ? parsePrice(entry.Buying) : null
  const change = entry ? parseChange(entry.Change) : null

  const metalNames: Record<string, string> = {
    'gram-altin': 'Gram Altın',
    'gumus': 'Gümüş',
    'ons': 'Ons Altın',
    'ceyrek-altin': 'Çeyrek Altın',
  }

  return (
    <StatCard
      title={metalNames[metal] || metal}
      value={price ? `₺${price.toLocaleString('tr-TR')}` : undefined}
      change={change}
      loading={isLoading}
    />
  )
}
