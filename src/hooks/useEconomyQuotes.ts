import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { QuoteBundle } from '@/types/api'

export type EconomyGroup = 'fx' | 'metal'

/**
 * Kanonik quotes endpoint'ine (GET /api/v1/economy/quotes) tek kaynaklı erişim.
 * Aynı `group` için aynı queryKey kullanıldığından dashboard'daki tüm ekonomi
 * widget'ları (MetalPriceWidget, CurrencyPairWidget, StatCardWidget, sayfalar)
 * tek ağ isteği paylaşır; `symbols` verilirse yalnızca o küme istenir.
 */
export function useEconomyQuotes(group: EconomyGroup, symbols?: string[]) {
  const symbolsKey = symbols && symbols.length > 0 ? symbols.join(',') : undefined
  return useQuery({
    queryKey: ['economy-quotes', group, symbolsKey],
    queryFn: async () => {
      const params: Record<string, string> = { group }
      if (symbolsKey) params.symbols = symbolsKey
      const res = await api.get('/api/v1/economy/quotes', { params })
      return res.data as QuoteBundle
    },
    staleTime: 60_000,
  })
}
