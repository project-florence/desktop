import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardGrid } from '@/components/shared/DashboardGrid'
import { usePreferences } from '@/hooks/usePreferences'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DEFAULT_LAYOUT } from '@/types/widget'
import type { WidgetLayout } from '@/types/widget'

export default function DashboardPage() {
  const { t } = useTranslation()
  usePageTitle(t('dashboard.title'))
  const { preferences, isLoading } = usePreferences()

  const layout: WidgetLayout[] = (() => {
    if (!preferences?.layout || preferences.layout === 'default') {
      return DEFAULT_LAYOUT.layout
    }
    return preferences.layout
  })()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardGrid layout={layout} editing={false} />
    </div>
  )
}
