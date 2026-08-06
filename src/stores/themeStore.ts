import { create } from 'zustand'
import { themes, type ThemeName } from '@/config/themes'
import { track } from '@/lib/telemetry'

function applyThemeToDOM(name: ThemeName) {
  const theme = themes[name]
  if (!theme) return
  const root = document.documentElement
  root.dataset.theme = name
  if (theme.mode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = theme.preview.background
}

interface ThemeState {
  themeName: ThemeName
  applyTheme: (name: ThemeName) => void
  applyStoredTheme: (name: ThemeName) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  themeName: 'light' as ThemeName,
  applyTheme: (name: ThemeName) => {
    const theme = themes[name]
    if (!theme) return
    const prev = document.documentElement.getAttribute('data-theme')
    applyThemeToDOM(name)
    set({ themeName: name })
    track('theme_change', { from: prev, to: name })
  },
  applyStoredTheme: (name: ThemeName) => {
    const theme = themes[name]
    if (!theme) return
    applyThemeToDOM(name)
    set({ themeName: name })
  },
}))
