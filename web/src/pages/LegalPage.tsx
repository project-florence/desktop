import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

const POLICY_NAMES: Record<string, string> = {
  terms: 'legal.terms',
  privacy_policy: 'legal.privacyPolicy',
  cookie_policy: 'legal.cookiePolicy',
  disclaimer: 'legal.disclaimer',
}

interface LegalResponse {
  policy: string
  lang: string
  last_updated: string
  content: string
}

export default function LegalPage() {
  const { t, i18n } = useTranslation()
  const { policy } = useParams<{ policy: string }>()
  const navigate = useNavigate()

  const apiPolicy = policy ?? ''
  const titleKey = POLICY_NAMES[apiPolicy] || 'legal.terms'

  const { data, isLoading, error } = useQuery({
    queryKey: ['legal', apiPolicy, i18n.language],
    queryFn: async () => {
      const res = await api.get('/api/v1/legal', { params: { policy: apiPolicy, lang: i18n.language } })
      return res.data as LegalResponse
    },
    enabled: !!apiPolicy,
  })

  return (
    <div className="max-w-3xl mx-auto pt-6 md:pt-8 pb-6 md:pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('common.back')}
      </Button>
      <h1 className="text-2xl font-bold mb-2">{t(titleKey)}</h1>
      {data?.last_updated && (
        <p className="text-xs text-muted-foreground mb-6">
          {t('legal.lastUpdated')}: {data.last_updated}
        </p>
      )}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/6" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{t('common.error')}</p>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {data?.content}
        </div>
      )}
    </div>
  )
}
