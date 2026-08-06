import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { UserPreferences } from '@/types/api'

export function usePreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await api.get('/api/v1/user/preferences')
      return res.data as UserPreferences
    },
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: async (prefs: Partial<UserPreferences>) => {
      const res = await api.put('/api/v1/user/preferences', { prefs })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save: mutation.mutate,
    isSaving: mutation.isPending,
  }
}
