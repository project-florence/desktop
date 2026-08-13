import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePreferences } from '@/hooks/usePreferences'
import { useThemeStore } from '@/stores/themeStore'
import { themes } from '@/config/themes'
import type { UserPreferences } from '@/types/api'

/**
 * Tema + dil seçicileri. Dashboard normal modunda (düzenleme dışında) gösterilir.
 * Seçim anında kaydedilir.
 */
export function PreferenceControls() {
  const { t, i18n } = useTranslation()
  const { preferences, save } = usePreferences()
  const { themeName, applyTheme } = useThemeStore()

  const currentTheme = (preferences?.theme && preferences.theme !== 'default')
    ? preferences.theme
    : themeName
  const currentLang = (preferences?.language && preferences.language !== 'default')
    ? preferences.language
    : i18n.language

  return (
    <div className="flex items-center gap-2">
      <Select value={currentTheme} onValueChange={(v) => v && (applyTheme(v), save({ theme: v } as Partial<UserPreferences>))}>
        <SelectTrigger className="w-32" aria-label={t('customization.theme')}>
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
      <Select value={currentLang} onValueChange={(v) => v && (i18n.changeLanguage(v), save({ language: v } as Partial<UserPreferences>))}>
        <SelectTrigger className="w-28" aria-label={t('customization.language')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tr">Türkçe</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
