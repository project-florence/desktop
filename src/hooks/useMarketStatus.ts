import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export interface MarketStatus {
  open: boolean
  next_open_at: string | null
  timezone: string
  is_holiday: boolean
  holiday_name: string | null
  as_of: string | null
}

/** Borsa açıklık durumu: açıkken 60s, kapalıyken 300s aralıkla tazelenir. */
export function useMarketStatus() {
  return useQuery({
    queryKey: ['market-status'],
    queryFn: async () => {
      const res = await api.get('/api/v1/market/status')
      return res.data as MarketStatus
    },
    staleTime: 30_000,
    refetchInterval: (query) => (query.state.data?.open ? 60_000 : 300_000),
  })
}

/** next_open_at'i Europe/Istanbul saat diliminde "HH:MM" olarak biçimlendirir. */
export function formatMarketTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  })
}
