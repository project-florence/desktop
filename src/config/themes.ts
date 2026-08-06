export interface ThemeCharts {
  upColor: string
  downColor: string
  gridColor: string
  textColor: string
  crosshairColor: string
}

export interface ThemePreview {
  background: string
  border: string
  primary: string
  accent: string
  success: string
}

export interface ThemeDefinition {
  name: string
  mode: 'dark' | 'light'
  charts: ThemeCharts
  preview: ThemePreview
}

export const themes: Record<string, ThemeDefinition> = {
  'florence': {
    name: 'Florence',
    mode: 'dark',
    charts: {
      upColor: '#22c55e',
      downColor: '#ef4444',
      gridColor: '#2d2d4a',
      textColor: '#94a3b8',
      crosshairColor: '#3d3d63',
    },
    preview: {
      background: '#0a0a0f',
      border: '#2d2d4a',
      primary: '#2563eb',
      accent: '#f59e0b',
      success: '#22c55e',
    },
  },
  'ocean': {
    name: 'Okyanus',
    mode: 'dark',
    charts: {
      upColor: '#22c55e',
      downColor: '#ef4444',
      gridColor: '#1d4262',
      textColor: '#7dd3fc',
      crosshairColor: '#2a557f',
    },
    preview: {
      background: '#0a0f1a',
      border: '#1e3a5f',
      primary: '#06b6d4',
      accent: '#2dd4bf',
      success: '#22c55e',
    },
  },
  'emerald': {
    name: 'Zümrüt',
    mode: 'dark',
    charts: {
      upColor: '#22c55e',
      downColor: '#ef4444',
      gridColor: '#143a2e',
      textColor: '#6ee7b7',
      crosshairColor: '#1c5440',
    },
    preview: {
      background: '#0a0f0f',
      border: '#14532d',
      primary: '#10b981',
      accent: '#34d399',
      success: '#22c55e',
    },
  },
  'midnight': {
    name: 'Geceyarısı',
    mode: 'dark',
    charts: {
      upColor: '#22c55e',
      downColor: '#ef4444',
      gridColor: '#2e1a57',
      textColor: '#a78bfa',
      crosshairColor: '#43237d',
    },
    preview: {
      background: '#0a0a0f',
      border: '#2e1065',
      primary: '#8b5cf6',
      accent: '#a78bfa',
      success: '#22c55e',
    },
  },
  'sunset': {
    name: 'Günbatımı',
    mode: 'dark',
    charts: {
      upColor: '#22c55e',
      downColor: '#ef4444',
      gridColor: '#52350f',
      textColor: '#fbbf24',
      crosshairColor: '#7a4b15',
    },
    preview: {
      background: '#0f0f0a',
      border: '#78350f',
      primary: '#f59e0b',
      accent: '#fb923c',
      success: '#22c55e',
    },
  },
  'sepia': {
    name: 'Sepya',
    mode: 'light',
    charts: {
      upColor: '#4a8a5c',
      downColor: '#b35549',
      gridColor: '#d9c8a7',
      textColor: '#7c6a4c',
      crosshairColor: '#b7a27c',
    },
    preview: {
      background: '#ece1cc',
      border: '#d0bf9d',
      primary: '#8f5a1e',
      accent: '#4f7a5a',
      success: '#4a8a5c',
    },
  },
  'rose': {
    name: 'Gül',
    mode: 'dark',
    charts: {
      upColor: '#84a653',
      downColor: '#be123c',
      gridColor: '#4a1a2b',
      textColor: '#fda4af',
      crosshairColor: '#6b2438',
    },
    preview: {
      background: '#12090d',
      border: '#542033',
      primary: '#e11d48',
      accent: '#fb7185',
      success: '#84a653',
    },
  },
  'graphite': {
    name: 'Grafit',
    mode: 'dark',
    charts: {
      upColor: '#a3a3a3',
      downColor: '#737373',
      gridColor: '#22272e',
      textColor: '#9ca3af',
      crosshairColor: '#3f454d',
    },
    preview: {
      background: '#0b0d0f',
      border: '#363b43',
      primary: '#9ca3af',
      accent: '#cbd5e1',
      success: '#a3a3a3',
    },
  },
  'orchid': {
    name: 'Orkide',
    mode: 'dark',
    charts: {
      upColor: '#86a95b',
      downColor: '#e879a5',
      gridColor: '#37204a',
      textColor: '#d8b4fe',
      crosshairColor: '#5a3a76',
    },
    preview: {
      background: '#120d18',
      border: '#51366a',
      primary: '#c084fc',
      accent: '#f0abfc',
      success: '#86a95b',
    },
  },
  'amber': {
    name: 'Amber',
    mode: 'dark',
    charts: {
      upColor: '#84a653',
      downColor: '#c2410c',
      gridColor: '#3d2c0c',
      textColor: '#fcd34d',
      crosshairColor: '#6e4d14',
    },
    preview: {
      background: '#0d0b05',
      border: '#5b410c',
      primary: '#f59e0b',
      accent: '#fbbf24',
      success: '#84a653',
    },
  },
  'arctic': {
    name: 'Arctic',
    mode: 'light',
    charts: {
      upColor: '#15803d',
      downColor: '#dc2626',
      gridColor: '#cde2ef',
      textColor: '#52718b',
      crosshairColor: '#a9c8da',
    },
    preview: {
      background: '#f1f7fb',
      border: '#c8dce9',
      primary: '#0284c7',
      accent: '#14b8a6',
      success: '#15803d',
    },
  },
  'light': {
    name: 'Aydınlık',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      gridColor: '#e2e8f0',
      textColor: '#475569',
      crosshairColor: '#cbd5e1',
    },
    preview: {
      background: '#f8fafc',
      border: '#e2e8f0',
      primary: '#2563eb',
      accent: '#f59e0b',
      success: '#16a34a',
    },
  },
  'florence-light': {
    name: 'Florence (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      gridColor: '#d7e2f2',
      textColor: '#5b6b84',
      crosshairColor: '#b6c7dd',
    },
    preview: {
      background: '#f4f7fc',
      border: '#d4dfee',
      primary: '#2563eb',
      accent: '#f59e0b',
      success: '#16a34a',
    },
  },
  'ocean-light': {
    name: 'Okyanus (Açık)',
    mode: 'light',
    charts: {
      upColor: '#0f9d58',
      downColor: '#e11d48',
      gridColor: '#c8e8f0',
      textColor: '#3f7584',
      crosshairColor: '#96cbd8',
    },
    preview: {
      background: '#edfbfd',
      border: '#bfe0e8',
      primary: '#0e9cb8',
      accent: '#0f8f7a',
      success: '#0f9d58',
    },
  },
  'emerald-light': {
    name: 'Zümrüt (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      gridColor: '#c9ecda',
      textColor: '#3d7d62',
      crosshairColor: '#97d1b8',
    },
    preview: {
      background: '#f0fbf5',
      border: '#bfe4d4',
      primary: '#059669',
      accent: '#10b981',
      success: '#16a34a',
    },
  },
  'midnight-light': {
    name: 'Geceyarısı (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#e11d48',
      gridColor: '#dbd4fa',
      textColor: '#6a6294',
      crosshairColor: '#b9aee9',
    },
    preview: {
      background: '#f5f4ff',
      border: '#d4ccf5',
      primary: '#7c3aed',
      accent: '#8b5cf6',
      success: '#16a34a',
    },
  },
  'sunset-light': {
    name: 'Günbatımı (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      gridColor: '#efdcb8',
      textColor: '#8a6a2e',
      crosshairColor: '#d8bd8c',
    },
    preview: {
      background: '#fff7ea',
      border: '#ecd9b5',
      primary: '#d97706',
      accent: '#ea6a18',
      success: '#16a34a',
    },
  },
  'rose-light': {
    name: 'Gül (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#be123c',
      gridColor: '#f5d0da',
      textColor: '#94546a',
      crosshairColor: '#e3a3b2',
    },
    preview: {
      background: '#fdf3f5',
      border: '#f0c9d2',
      primary: '#e11d48',
      accent: '#fb7185',
      success: '#16a34a',
    },
  },
  'graphite-light': {
    name: 'Grafit (Açık)',
    mode: 'light',
    charts: {
      upColor: '#15803d',
      downColor: '#dc2626',
      gridColor: '#dce0e3',
      textColor: '#5f666d',
      crosshairColor: '#c0c5ca',
    },
    preview: {
      background: '#f5f6f7',
      border: '#d7dade',
      primary: '#52525b',
      accent: '#71717a',
      success: '#15803d',
    },
  },
  'orchid-light': {
    name: 'Orkide (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#e11d48',
      gridColor: '#e7caf8',
      textColor: '#7a5c94',
      crosshairColor: '#cf9fe6',
    },
    preview: {
      background: '#faf5fe',
      border: '#e2c9f0',
      primary: '#a855f7',
      accent: '#c084fc',
      success: '#16a34a',
    },
  },
  'amber-light': {
    name: 'Amber (Açık)',
    mode: 'light',
    charts: {
      upColor: '#16a34a',
      downColor: '#dc2626',
      gridColor: '#f1deb0',
      textColor: '#8a6a2e',
      crosshairColor: '#dec792',
    },
    preview: {
      background: '#fdf8e8',
      border: '#efdfb4',
      primary: '#d97706',
      accent: '#f59e0b',
      success: '#16a34a',
    },
  },
}

export type ThemeName = keyof typeof themes
