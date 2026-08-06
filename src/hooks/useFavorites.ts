import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import type { FavoritesResponse } from '@/types/api'
import { favoritesResponseSchema, parseApi } from '@/lib/apiSchemas'

export function useFavorites() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get('/api/v1/favorites')
      return parseApi(favoritesResponseSchema, res.data).favorites as FavoritesResponse['favorites']
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const addMutation = useMutation({
    mutationFn: async (ticker: string) => {
      await api.post(`/api/v1/favorites/${ticker}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (ticker: string) => {
      await api.delete(`/api/v1/favorites/${ticker}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const isFavorite = (ticker: string) => favorites?.includes(ticker) ?? false

  const toggle = (ticker: string) => {
    if (!isAuthenticated) {
      toast.error(t('favorite.loginRequired'))
      return
    }
    if (addMutation.isPending || removeMutation.isPending) return
    if (isFavorite(ticker)) {
      removeMutation.mutate(ticker)
    } else {
      addMutation.mutate(ticker)
    }
  }

  return { favorites, isFavorite, toggle, addMutation, removeMutation }
}
