import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WidgetPalette } from './WidgetPalette'
import { usePreferences } from '@/hooks/usePreferences'
import { useThemeStore } from '@/stores/themeStore'
import { themes } from '@/config/themes'
import { toast } from 'sonner'
import type { UserPreferences } from '@/types/api'

interface CustomizationPanelProps {
  onAddWidget: (type: string, config?: Record<string, unknown>) => void
  onSave: () => void
  onReset: () => void
  isSaving: boolean
}

export function CustomizationPanel({ onAddWidget, onSave, onReset, isSaving }: CustomizationPanelProps) {
  const { t, i18n } = useTranslation()
  const { preferences, save } = usePreferences()
  const { themeName, applyTheme } = useThemeStore()

  const currentTheme = (preferences?.theme && preferences.theme !== 'default')
    ? preferences.theme
    : themeName
  const currentLang = (preferences?.language && preferences.language !== 'default')
    ? preferences.language
    : i18n.language

  const handleThemeChange = (v: string) => {
    applyTheme(v)
    save({ theme: v } as Partial<UserPreferences>)
  }

  const handleLangChange = (v: string) => {
    i18n.changeLanguage(v)
    save({ language: v } as Partial<UserPreferences>)
  }

  return (
    <div className="w-full lg:w-72 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card/50 backdrop-blur-sm p-4 space-y-4 overflow-y-auto max-h-none lg:max-h-[calc(100dvh-8rem)]">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('customization.widgets')}
        </h3>
        <WidgetPalette onAdd={onAddWidget} />
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('customization.theme')}</label>
          <Select value={currentTheme} onValueChange={(v) => v && handleThemeChange(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(themes).map(([key, theme]) => (
                <SelectItem key={key} value={key}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('customization.language')}</label>
          <Select value={currentLang} onValueChange={(v) => v && handleLangChange(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Button
          variant="gradient"
          size="sm"
          className="w-full"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? t('common.loading') : t('customization.save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            onReset()
            toast.success(t('customization.resetSuccess'))
          }}
        >
          {t('customization.reset')}
        </Button>
      </div>
    </div>
  )
}
