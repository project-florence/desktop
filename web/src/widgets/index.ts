import { type ComponentType } from 'react'
import WelcomeHero from './WelcomeHero'
import FavoritesBar from './FavoritesBar'
import StatCardWidget from './StatCardWidget'
import MacroeconomyWidget from './MacroeconomyWidget'
import StockCardWidget from './StockCardWidget'
import StockChartWidget from './StockChartWidget'
import SimulationWidget from './SimulationWidget'
import NewsFeedWidget from './NewsFeedWidget'
import CurrencyPairWidget from './CurrencyPairWidget'
import MetalPriceWidget from './MetalPriceWidget'

export type WidgetComponent = ComponentType<{ config?: Record<string, unknown> }>

export const WIDGET_MAP: Record<string, WidgetComponent> = {
  welcome_hero: WelcomeHero,
  favorites_bar: FavoritesBar,
  stat_card: StatCardWidget,
  macroeconomy: MacroeconomyWidget,
  stock_card: StockCardWidget,
  stock_chart: StockChartWidget,
  simulation: SimulationWidget,
  news_feed: NewsFeedWidget,
  currency_pair: CurrencyPairWidget,
  metal_price: MetalPriceWidget,
}
