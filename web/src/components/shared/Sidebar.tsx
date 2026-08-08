import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  TrendingUp,
  Star,
  Briefcase,
  BarChart3,
  FileText,
  Search,
  Rocket,
  DollarSign,
  Gem,
  User,
  PanelLeftClose,
  PanelLeft,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavStore } from '@/stores/navStore'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { CreditDisplay } from '@/components/shared/CreditDisplay'
import { track } from '@/lib/telemetry'
import type { MouseEvent } from 'react'
import florenceLogo from '@/assets/florence_logo.svg'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true, activeCheck: (p: string) => p === '/dashboard' },
  { to: '/stocks', icon: TrendingUp, labelKey: 'nav.stocks', stocks: true, activeCheck: (p: string) => p.startsWith('/stocks') },
  { to: '/watchlist', icon: Star, labelKey: 'nav.watchlist', activeCheck: (p: string) => p === '/watchlist' },
  { to: '/portfolios', icon: Briefcase, labelKey: 'nav.portfolio', activeCheck: (p: string) => p === '/portfolios' || p.startsWith('/portfolios/') },
  { to: '/simulation', icon: BarChart3, labelKey: 'nav.simulation', feature: 'simulation', activeCheck: (p: string) => p === '/simulation' },
  { to: '/reports', icon: FileText, labelKey: 'nav.reports', activeCheck: (p: string) => p === '/reports' },
  { to: '/advisor', icon: Search, labelKey: 'nav.scout', feature: 'advisor', activeCheck: (p: string) => p === '/advisor' },
  { to: '/ipos', icon: Rocket, labelKey: 'nav.ipos', activeCheck: (p: string) => p === '/ipos' },
  { to: '/currency', icon: DollarSign, labelKey: 'nav.currency', activeCheck: (p: string) => p === '/currency' },
  { to: '/metals', icon: Gem, labelKey: 'nav.metals', activeCheck: (p: string) => p === '/metals' },
]

export function Sidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const lastStockTicker = useNavStore((s) => s.lastStockTicker)
  const collapsed = useNavStore((s) => s.sidebarCollapsed)
  const mobileSidebarOpen = useNavStore((s) => s.mobileSidebarOpen)
  const toggleSidebar = useNavStore((s) => s.toggleSidebar)
  const closeMobileSidebar = useNavStore((s) => s.closeMobileSidebar)
  const isDisabled = useMaintenanceStore((s) => s.isDisabled)

  const handleNavClick = (label: string) => {
    track('nav_click', { from: location.pathname, to: label })
    closeMobileSidebar()
  }

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group whitespace-nowrap',
      active
        ? 'bg-primary/10 text-primary border-l-2 border-primary rounded-l-none'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted hover:translate-x-0.5',
      collapsed && 'border-l-0 rounded-lg justify-center px-2',
    )

  const handleStocksClick = (e: MouseEvent) => {
    closeMobileSidebar()
    if (lastStockTicker) {
      e.preventDefault()
      navigate(`/stocks/${lastStockTicker}`)
    }
  }

  const sidebarContent = (
    <>
      <div className={cn('flex items-center gap-2 px-2 py-4 mb-4', collapsed && 'justify-center px-0', 'md:block')}>
        <img src={florenceLogo} alt="Florence" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <>
            <span className="font-semibold text-lg">{t('app.name')}</span>
            <button
              type="button"
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden md:inline-flex"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
        {collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors absolute -right-3 top-5 bg-sidebar border border-border rounded-full shadow-sm hidden md:block"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <nav className={cn('flex-1 space-y-1', collapsed && 'space-y-2')}>
        {navItems.map((item) => {
          const active = item.activeCheck(location.pathname)
          const disabled = item.feature ? isDisabled(item.feature) : false
          return (
            <NavLink
              key={item.to}
              to={disabled ? '#' : item.to}
              onClick={(e) => { if (disabled) e.preventDefault(); handleNavClick(item.labelKey); if (item.stocks && !disabled) handleStocksClick(e) }}
              className={cn(linkClass(active), disabled && 'opacity-40 cursor-not-allowed')}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 shrink-0" />
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {t(item.labelKey)}
                  {disabled && <Wrench className="h-3 w-3 text-amber-500" />}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={cn('border-t border-border pt-3 space-y-2', collapsed && 'flex flex-col items-center pt-2')}>
        <div className={cn(collapsed && 'flex justify-center')}>
          <CreditDisplay size="sm" />
        </div>
        <NavLink
          to="/profile"
          onClick={() => handleNavClick('profile')}
          className={linkClass(location.pathname === '/profile')}
        >
          <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 shrink-0" />
          {!collapsed && t('nav.profile')}
        </NavLink>
      </div>
    </>
  )

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity duration-300',
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={closeMobileSidebar}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-dvh border-r border-border bg-sidebar p-3 flex flex-col transition-all duration-300',
          'md:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
