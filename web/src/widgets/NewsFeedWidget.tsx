import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Newspaper, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { safeExternalUrl } from '@/lib/safeUrl'
import type { NewsItem } from '@/types/api'
import { newsItemsSchema, parseApi } from '@/lib/apiSchemas'

export default function NewsFeedWidget({ config }: { config?: Record<string, unknown> }) {
  const { t } = useTranslation()
  const ticker = (config?.ticker as string) || 'THYAO'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['news-widget', ticker],
    queryFn: async () => {
      const res = await api.get(`/api/v1/news/${ticker}`)
       return parseApi(newsItemsSchema, res.data) as NewsItem[]
    },
    enabled: !!ticker,
    staleTime: 5 * 60_000,
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          {t('stockDetail.news')} — {ticker}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-xs text-destructive">Haberler yüklenemedi.</p>
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => refetch()}>
              Tekrar dene
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((item, i) => (
              <a
                key={i}
                href={safeExternalUrl(item.url) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs hover:text-primary transition-colors group"
              >
                <span className="line-clamp-2 group-hover:underline">{item.title}</span>
                <span className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                  {item.date}
                  <ExternalLink className="h-2.5 w-2.5" />
                </span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
