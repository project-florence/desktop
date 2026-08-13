import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, TrendingUp, ExternalLink, Coins, Sparkles, Download, Clock, FileText } from 'lucide-react'
import api from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { safeExternalUrl } from '@/lib/safeUrl'
import type { ReportDetail } from '@/types/api'

const sentimentColors: Record<string, string> = {
  positive: 'border-success/40 bg-success/5',
  negative: 'border-destructive/40 bg-destructive/5',
  neutral: 'border-muted-foreground/30 bg-muted/30',
}

const sentimentBadge: Record<string, string> = {
  positive: 'bg-success/10 text-success border-success/30',
  negative: 'bg-destructive/10 text-destructive border-destructive/30',
  neutral: 'bg-muted text-muted-foreground border-border',
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['report-detail', Number(id)],
    queryFn: async () => {
      const res = await api.get(`/api/v1/reports/${id}`)
      return res.data as ReportDetail
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  })

  usePageTitle(detail?.title ?? t('reports.title'))

  const download = async (ftype: 'md' | 'pdf' | 'docx') => {
    try {
      const res = await api.post('/api/v1/reports/download', undefined, {
        params: { report_id: id, ftype },
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${detail?.about ?? 'report'}.${ftype}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const lang = i18n.language === 'tr' ? 'tr' : 'en'
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return d
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="w-72 space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('reports.backToReports')}
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {t('common.error')}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('reports.backToReports')}
        </Button>
        <Badge variant="outline" className="font-mono">{detail.about}</Badge>
        <Badge variant="secondary">
          {detail.type === 'quick_report' ? t('reports.quickReport') : t('reports.deepReport')}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['md', 'pdf', 'docx'] as const).map((ftype) => (
          <Button
            key={ftype}
            variant="outline"
            size="sm"
            onClick={() => download(ftype)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {ftype === 'md' ? t('reports.downloadMd') : ftype === 'pdf' ? t('reports.downloadPdf') : t('reports.downloadDocx')}
          </Button>
        ))}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold leading-snug">{detail.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(detail.created_at)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(`/stocks/${detail.about}`)}
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs leading-relaxed space-y-0.5">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-0.5">{children}</h3>,
                    p: ({ children }) => <p className="text-xs text-muted-foreground leading-relaxed mb-1">{children}</p>,
                    li: ({ children }) => <li className="text-xs text-muted-foreground ml-4 list-disc">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  }}
                >
                  {detail.report}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-72 space-y-3 shrink-0">
          {detail.sentiments?.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t('reports.sentiments')}</span>
                </div>
                {detail.sentiments.map((s, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-lg border text-xs space-y-1',
                      sentimentColors[s.sentiment] || sentimentColors.neutral,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0', sentimentBadge[s.sentiment])}
                      >
                        {s.sentiment === 'positive'
                          ? t('reports.sentimentPositive')
                          : s.sentiment === 'negative'
                            ? t('reports.sentimentNegative')
                            : t('reports.sentimentNeutral')}
                      </Badge>
                      {safeExternalUrl(s.url) ? (
                        <a href={safeExternalUrl(s.url) ?? '#'} target="_blank" rel="noopener noreferrer" className="ml-auto">
                          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs ml-auto">[invalid url]</span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{s.reasoning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-500" />
                  {t('reports.cost')}
                </span>
                <span className="font-mono font-semibold">{detail.credits_spend?.toFixed(2) ?? '—'} 🪙</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t('reports.tokens')}
                </span>
                <span className="font-mono">{detail.token_usage.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{detail.about}</span>
              </div>
              <p className="pt-1">{detail.type === 'quick_report' ? t('reports.quickReport') : t('reports.deepReport')}</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(detail.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
