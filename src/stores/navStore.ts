import { create } from 'zustand'

interface NavState {
  lastStockTicker: string | null
  stocksPage: number
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  setLastStockTicker: (ticker: string | null) => void
  setStocksPage: (page: number) => void
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
}

export const useNavStore = create<NavState>((set) => ({
  lastStockTicker: null,
  stocksPage: 1,
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  setLastStockTicker: (ticker) => set({ lastStockTicker: ticker }),
  setStocksPage: (page) => set({ stocksPage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}))
