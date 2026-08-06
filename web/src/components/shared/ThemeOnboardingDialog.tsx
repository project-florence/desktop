import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePreferences } from '@/hooks/usePreferences'
import { useThemeStore } from '@/stores/themeStore'
import { themes, type ThemeDefinition, type ThemeName } from '@/config/themes'
import type { UserPreferences } from '@/types/api'
import { cn } from '@/lib/utils'

const INITIAL_THEMES = ['light', 'sepia', 'florence', 'ocean', 'emerald', 'midnight']

export function ThemeOnboardingDialog() {
  const { t } = useTranslation()
  const { preferences, save } = usePreferences()
  const themeName = useThemeStore((s) => s.themeName)
  const applyTheme = useThemeStore((s) => s.applyTheme)

  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const seenRef = useRef(false)
  const pickedRef = useRef(false)

  useEffect(() => {
    if (!preferences || seenRef.current) return
    const stored = preferences.theme
    if (!stored || stored === 'default') {
      seenRef.current = true
      setOpen(true)
    }
  }, [preferences])

  const allEntries = Object.entries(themes) as [string, ThemeDefinition][]
  const visibleEntries: [string, ThemeDefinition][] = expanded
    ? allEntries
    : INITIAL_THEMES
        .filter((key) => themes[key])
        .map((key) => [key, themes[key]] as [string, ThemeDefinition])

  const handleSelect = (key: ThemeName) => {
    pickedRef.current = true
    applyTheme(key)
    save({ theme: key } as Partial<UserPreferences>)
    setOpen(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen && !pickedRef.current) {
      save({ theme: 'light' } as Partial<UserPreferences>)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('onboarding.title')}</DialogTitle>
          <DialogDescription>{t('onboarding.description')}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1 sm:grid-cols-3">
          {visibleEntries.map(([key, theme]) => {
            const isActive = themeName === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(key as ThemeName)}
                className={cn(
                  'cursor-pointer rounded-lg border p-2.5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-(--shadow-pop)',
                  isActive ? 'ring-2 ring-primary' : '',
                )}
              >
                <div className="flex gap-1 mb-1.5">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: theme.preview.success }}
                  />
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{
                      backgroundColor: theme.preview.background,
                      border: `1px solid ${theme.preview.border}`,
                    }}
                  />
                </div>
                <p className="truncate text-xs font-medium leading-tight">{theme.name}</p>
                <p className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                  {theme.mode === 'dark' ? t('onboarding.dark') : t('onboarding.light')}
                </p>
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? t('onboarding.collapse') : t('onboarding.expand')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
