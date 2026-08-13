import { create } from 'zustand'
import api from '@/lib/api'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await api.get('/api/v1/maintenance')
        set({ disabledFeatures: res.data.disabled_features || [], loading: false })
        return
      } catch {
        if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS)
      }
    }
    set({ disabledFeatures: [], loading: false })
  },
  isDisabled: (feature) => get().disabledFeatures.includes(feature),
}))
