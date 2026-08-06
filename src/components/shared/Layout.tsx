import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { TitleBar } from './TitleBar'
import { ThemeOnboardingDialog } from './ThemeOnboardingDialog'
import { useNavStore } from '@/stores/navStore'
import { useThemeStore } from '@/stores/themeStore'
import { usePreferences } from '@/hooks/usePreferences'
import { themes } from '@/config/themes'
import { isTauri } from '@/lib/desktop'
import { cn } from '@/lib/utils'

export function Layout() {
  const collapsed = useNavStore((s) => s.sidebarCollapsed)
  const { preferences } = usePreferences()
  const applyStoredTheme = useThemeStore((s) => s.applyStoredTheme)

  useEffect(() => {
    if (!preferences?.theme) return
    if (themes[preferences.theme]) applyStoredTheme(preferences.theme)
  }, [preferences, applyStoredTheme])

  return (
    <div className={cn('flex min-h-screen relative', isTauri() && 'pt-9')}>
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/[0.03] -z-10" />
      <TitleBar />
      <Sidebar />
      <div className={cn(
        'flex-1 transition-all duration-300 flex flex-col ml-0',
        collapsed ? 'md:ml-16' : 'md:ml-64',
      )}>
        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ThemeOnboardingDialog />
    </div>
  )
}
