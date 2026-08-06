import { create } from 'zustand'
import api from '@/lib/api'

interface MaintenanceState {
  disabledFeatures: string[]
  loading: boolean
  fetchDisabled: () => Promise<void>
  isDisabled: (feature: string) => boolean
}

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  disabledFeatures: [],
  loading: true,
  fetchDisabled: async () => {
    try {
      const res = await api.get('/api/v1/maintenance')
      set({ disabledFeatures: res.data.disabled_features || [], loading: false })
    } catch {
      set({ disabledFeatures: [], loading: false })
    }
  },
  isDisabled: (feature) => get().disabledFeatures.includes(feature),
}))
