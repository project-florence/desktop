import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings2, PackageOpen } from 'lucide-react'
import { DashboardGrid } from '@/components/shared/DashboardGrid'
import { CustomizationPanel } from '@/components/shared/CustomizationPanel'
import { usePreferences } from '@/hooks/usePreferences'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DEFAULT_LAYOUT, PALETTE_ITEMS } from '@/types/widget'
import type { WidgetLayout } from '@/types/widget'
import type { UserPreferences } from '@/types/api'

let nextWidgetId = 100

export default function DashboardPage() {
  const { t } = useTranslation()
  usePageTitle(t('dashboard.title'))
  const { preferences, isLoading, save, isSaving } = usePreferences()
  const [editing, setEditing] = useState(false)
  const [workingLayout, setWorkingLayout] = useState<WidgetLayout[]>([])

  const layout: WidgetLayout[] = (() => {
    if (!preferences?.layout || preferences.layout === 'default') {
      return DEFAULT_LAYOUT.layout
    }
    return preferences.layout
  })()

  useEffect(() => {
    if (editing) {
      setWorkingLayout([...layout])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const handleLayoutChange = (newLayout: WidgetLayout[]) => {
    setWorkingLayout(newLayout)
  }

  const handleAddWidget = (type: string, config?: Record<string, unknown>) => {
    const paletteItem = PALETTE_ITEMS.find((p) => p.type === type)
    const newWidget: WidgetLayout = {
      id: `${type}-${nextWidgetId++}`,
      type,
      x: 0,
      y: workingLayout.length > 0 ? Math.max(...workingLayout.map((l) => l.y + l.h)) : 0,
      w: paletteItem?.defaultW ?? 4,
      h: paletteItem?.defaultH ?? 2,
      config,
    }
    setWorkingLayout((prev) => [...prev, newWidget])
  }

  const handleDeleteWidget = (id: string) => {
    setWorkingLayout((prev) => prev.filter((l) => l.id !== id))
  }

  const handleSave = () => {
    save({ layout: workingLayout } as Partial<UserPreferences>, {
      onSuccess: () => setEditing(false),
    })
  }

  const handleReset = () => {
    save({ layout: 'default' } as Partial<UserPreferences>, {
      onSuccess: () => setEditing(false),
    })
  }

  const handleCancel = () => {
    setEditing(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Skeleton className="h-9 w-24" />
        </div>
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
      <div className="flex items-center justify-end gap-2">
        <Link to="/downloads">
          <Button variant="outline" size="sm">
            <PackageOpen className="h-4 w-4 mr-1" />
            {t('downloads.pageTitle')}
          </Button>
        </Link>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Settings2 className="h-4 w-4 mr-1" />
            {t('customization.edit')}
          </Button>
        )}
        {editing && (
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {t('customization.cancel')}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <DashboardGrid
              layout={workingLayout}
              editing
              onLayoutChange={handleLayoutChange}
              onDeleteWidget={handleDeleteWidget}
            />
          </div>
          <CustomizationPanel
            onAddWidget={handleAddWidget}
            onSave={handleSave}
            onReset={handleReset}
            isSaving={isSaving}
          />
        </div>
      ) : (
        <DashboardGrid
          layout={layout}
          editing={false}
        />
      )}
    </div>
  )
}
