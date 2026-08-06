import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Credits } from '@/types/api'

export function useCredits() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const res = await api.get('/api/v1/credits')
      return res.data as Credits
    },
    staleTime: 30_000,
  })

  return {
    ...query,
    balance: query.data?.credits,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['credits'] }),
  }
}
