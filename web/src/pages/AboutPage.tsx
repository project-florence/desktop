import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ContributorCard } from '@/components/shared/ContributorCard'
import api from '@/lib/api'

interface AboutResponse {
  lang: string
  content: string
}

export default function AboutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['about', i18n.language],
    queryFn: async () => {
      const res = await api.get('/api/v1/about', { params: { lang: i18n.language } })
      return res.data as AboutResponse
    },
  })

  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: async () => {
      const res = await api.get('/api/v1/version')
      return res.data.version as string
    },
    staleTime: 1000 * 60 * 60,
  })

  return (
    <div className="max-w-3xl mx-auto pt-6 md:pt-8 pb-6 md:pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('common.back')}
      </Button>
      <h1 className="text-2xl font-bold mb-6">{t('footer.about')}</h1>
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
      <div className="mt-10 pt-8 border-t border-border/40">
        {version && (
          <p className="text-xs text-muted-foreground mb-6">
            {t('about.version')}: v{version}
          </p>
        )}
        <ContributorCard />
      </div>
    </div>
  )
}
