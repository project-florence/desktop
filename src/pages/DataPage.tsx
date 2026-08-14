import { useTranslation } from 'react-i18next'
import { ExportsSection } from '@/components/shared/ExportsSection'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function DataPage() {
  const { t } = useTranslation()
  usePageTitle(t('page.marketData'))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t('page.marketData')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('exports.pageDesc')}</p>
      </div>
      <ExportsSection />
    </div>
  )
}
