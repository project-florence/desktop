import type { ComponentType } from 'react'

export interface WidgetLayout {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  config?: Record<string, unknown>
}

export interface DashboardLayout {
  layout: WidgetLayout[]
}

export type WidgetComponent = ComponentType<{ config?: Record<string, unknown> }>

export interface PaletteItem {
  type: string
  labelKey: string
  icon: string
  defaultW: number
  defaultH: number
  defaultConfig?: Record<string, unknown>
}

export const WIDGET_TYPES = {
  WELCOME_HERO: 'welcome_hero',
  FAVORITES_BAR: 'favorites_bar',
  STAT_CARD: 'stat_card',
  MACROECONOMY: 'macroeconomy',
  STOCK_CARD: 'stock_card',
  STOCK_CHART: 'stock_chart',
  SIMULATION: 'simulation',
  NEWS_FEED: 'news_feed',
  CURRENCY_PAIR: 'currency_pair',
  METAL_PRICE: 'metal_price',
  MARKET_STATUS: 'market_status',
} as const

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: WIDGET_TYPES.WELCOME_HERO, labelKey: 'customization.widgetWelcome', icon: 'sparkles', defaultW: 12, defaultH: 4 },
  { type: WIDGET_TYPES.FAVORITES_BAR, labelKey: 'customization.widgetFavorites', icon: 'star', defaultW: 12, defaultH: 3 },
  { type: WIDGET_TYPES.STAT_CARD, labelKey: 'customization.widgetStatCard', icon: 'trending-up', defaultW: 4, defaultH: 2, defaultConfig: { titleKey: 'dashboard.gold', dataSource: 'gold' } },
  { type: WIDGET_TYPES.MACROECONOMY, labelKey: 'customization.widgetMacro', icon: 'globe', defaultW: 12, defaultH: 3 },
  { type: WIDGET_TYPES.STOCK_CARD, labelKey: 'customization.widgetStockCard', icon: 'building-2', defaultW: 3, defaultH: 2, defaultConfig: { ticker: 'THYAO' } },
  { type: WIDGET_TYPES.STOCK_CHART, labelKey: 'customization.widgetChart', icon: 'line-chart', defaultW: 6, defaultH: 3, defaultConfig: { ticker: 'THYAO' } },
  { type: WIDGET_TYPES.SIMULATION, labelKey: 'customization.widgetSimulation', icon: 'flask-conical', defaultW: 6, defaultH: 3, defaultConfig: { ticker: 'THYAO' } },
  { type: WIDGET_TYPES.NEWS_FEED, labelKey: 'customization.widgetNews', icon: 'newspaper', defaultW: 4, defaultH: 3, defaultConfig: { ticker: 'THYAO' } },
  { type: WIDGET_TYPES.CURRENCY_PAIR, labelKey: 'customization.widgetCurrency', icon: 'dollar-sign', defaultW: 3, defaultH: 2, defaultConfig: { code: 'USD' } },
  { type: WIDGET_TYPES.METAL_PRICE, labelKey: 'customization.widgetMetal', icon: 'gem', defaultW: 3, defaultH: 2, defaultConfig: { metal: 'gram-altin' } },
  { type: WIDGET_TYPES.MARKET_STATUS, labelKey: 'customization.widgetMarketStatus', icon: 'activity', defaultW: 4, defaultH: 2 },
]

export const DEFAULT_LAYOUT: DashboardLayout = {
  layout: [
    { id: 'welcome', type: WIDGET_TYPES.WELCOME_HERO, x: 0, y: 0, w: 12, h: 4 },
    { id: 'favorites', type: WIDGET_TYPES.FAVORITES_BAR, x: 0, y: 4, w: 12, h: 3 },
    { id: 'gold', type: WIDGET_TYPES.STAT_CARD, x: 0, y: 7, w: 4, h: 2, config: { titleKey: 'dashboard.gold', dataSource: 'gold' } },
    { id: 'usd', type: WIDGET_TYPES.STAT_CARD, x: 4, y: 7, w: 4, h: 2, config: { titleKey: 'dashboard.usd', dataSource: 'currency', pair: 'USD' } },
    { id: 'eur', type: WIDGET_TYPES.STAT_CARD, x: 8, y: 7, w: 4, h: 2, config: { titleKey: 'dashboard.eur', dataSource: 'currency', pair: 'EUR' } },
    { id: 'macro', type: WIDGET_TYPES.MACROECONOMY, x: 0, y: 9, w: 12, h: 3 },
    { id: 'market', type: WIDGET_TYPES.MARKET_STATUS, x: 0, y: 12, w: 4, h: 2 },
  ],
}
