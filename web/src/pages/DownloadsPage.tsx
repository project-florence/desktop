import { useTranslation } from 'react-i18next'
import { DownloadsContent } from '@/components/shared/DownloadsContent'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function DownloadsPage() {
  const { t } = useTranslation()
  usePageTitle(t('downloads.pageTitle'))

  return (
    <div className="space-y-6 max-w-5xl">
      <DownloadsContent />
    </div>
  )
}
