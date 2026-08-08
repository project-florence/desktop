import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { usePageTracking } from '@/hooks/usePageTracking'
import { track } from '@/lib/telemetry'
import { useTranslation } from 'react-i18next'
import { PwaInstallPrompt } from '@/components/shared/PwaInstallPrompt'
import { ThemeScope } from '@/components/shared/ThemeScope'
import { useThemeStore } from '@/stores/themeStore'
import { themes } from '@/config/themes'

const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Layout = lazy(() => import('@/components/shared/Layout').then((m) => ({ default: m.Layout })))
const ProtectedRoute = lazy(() => import('@/components/shared/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute })))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const StocksPage = lazy(() => import('@/pages/StocksPage'))
const StockDetailPage = lazy(() => import('@/pages/StockDetailPage'))
const WatchlistPage = lazy(() => import('@/pages/WatchlistPage'))
const SimulationPage = lazy(() => import('@/pages/SimulationPage'))
const AdvisorPage = lazy(() => import('@/pages/AdvisorPage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const ReportDetailPage = lazy(() => import('@/pages/ReportDetailPage'))
const IposPage = lazy(() => import('@/pages/IposPage'))
const CurrencyPage = lazy(() => import('@/pages/CurrencyPage'))
const MetalsPage = lazy(() => import('@/pages/MetalsPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'))
const DownloadsPage = lazy(() => import('@/pages/DownloadsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const LegalPage = lazy(() => import('@/pages/LegalPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2,
    },
  },
})

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function TelemetryProvider() {
  usePageTracking()
  const { i18n } = useTranslation()

  useEffect(() => {
    const handler = (lng: string) => {
      track('language_change', { language: lng })
    }
    i18n.on('languageChanged', handler)
    return () => { i18n.off('languageChanged', handler) }
  }, [i18n])

  return null
}

export default function App() {
  useEffect(() => {
    useMaintenanceStore.getState().fetchDisabled()
  }, [])

  const themeName = useThemeStore((s) => s.themeName)
  const toasterTheme = themes[themeName]?.mode ?? 'light'

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <TelemetryProvider />
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<ThemeScope />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/downloads" element={<DownloadsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal/:policy" element={<LegalPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="stocks" element={<StocksPage />} />
                <Route path="stocks/:ticker" element={<StockDetailPage />} />
                <Route path="watchlist" element={<WatchlistPage />} />
                <Route path="simulation" element={<SimulationPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/:id" element={<ReportDetailPage />} />
                <Route path="advisor" element={<AdvisorPage />} />
                <Route path="ipos" element={<IposPage />} />
                <Route path="currency" element={<CurrencyPage />} />
                <Route path="metals" element={<MetalsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="portfolios" element={<PortfolioPage />} />
                <Route path="portfolios/:portfolioId" element={<PortfolioPage />} />
              </Route>
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        <Toaster
          position={typeof window !== 'undefined' && window.innerWidth < 768 ? 'bottom-center' : 'top-right'}
          richColors
          closeButton
          theme={toasterTheme}
        />
        <PwaInstallPrompt />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
