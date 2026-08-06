import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { FileText, Search, Sparkles, TrendingUp, ExternalLink, ChevronRight, Coins, Clock } from 'lucide-react'
import { StockSearch } from '@/components/shared/StockSearch'
import { CreditCostTooltip } from '@/components/shared/CreditCostTooltip'
import api from '@/lib/api'
import { usePageTitle } from '@/hooks/usePageTitle'
import { safeExternalUrl } from '@/lib/safeUrl'
import type { ReportInfo, ReportHistoryItem, ReportDetail, ReportSentiment, ReportTypeInfo } from '@/types/api'

type Tab = 'new' | 'history'

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

export default function ReportsPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('reports.title'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [tab, setTab] = useState<Tab>('new')
  const [ticker, setTicker] = useState(searchParams.get('ticker') || '')
  const [reportType, setReportType] = useState('quick_report')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: reportInfo } = useQuery({
    queryKey: ['report-info'],
    queryFn: async () => {
      const res = await api.get('/api/v1/reports/info')
      return res.data as ReportInfo
    },
    staleTime: 5 * 60_000,
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['report-history', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch) {
        const res = await api.get('/api/v1/reports/search', {
          params: { q: debouncedSearch, limit: 50 },
        })
        return res.data as ReportHistoryItem[]
      }
      const res = await api.get('/api/v1/reports/history', {
        params: { sort: 'created_at', order: 'desc' },
      })
      return res.data as ReportHistoryItem[]
    },
    staleTime: 30_000,
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/v1/reports/generate', undefined, {
        params: { ticker, type: reportType },
        timeout: 600_000,
      })
      return res.data as ReportDetail
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credits'] })
      queryClient.invalidateQueries({ queryKey: ['report-history'] })
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(t('reportGen.reportReady'), { body: `${data.about} — ${data.title}` })
      } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) => {
          if (p === 'granted') new Notification(t('reportGen.reportReady'), { body: `${data.about} — ${data.title}` })
        })
      }
    },
    onError: (err) => {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string }
      const detail = axiosErr.response?.data?.detail || (axiosErr.message && !axiosErr.response ? axiosErr.message : undefined)
      toast.error(detail || t('reports.error'))
    },
  })

  const startTimeRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)
  const statuses = [
    t('reportGen.scanningNews'),
    t('reportGen.analyzingFinancials'),
    t('reportGen.calculatingSentiment'),
    t('reportGen.writingReport'),
    t('reportGen.finalizing'),
  ]

  useEffect(() => {
    if (!generateMutation.isPending) {
      startTimeRef.current = null
      setElapsed(0)
      setStatusIndex(0)
      return
    }
    startTimeRef.current = Date.now()
    const statusTimer = setInterval(() => setStatusIndex((p) => (p + 1) % statuses.length), 8000)
    const elapsedTimer = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000)), 1000)
    return () => {
      clearInterval(statusTimer)
      clearInterval(elapsedTimer)
    }
  }, [generateMutation.isPending])

  const types = reportInfo ? [reportInfo.quick_report, reportInfo.deep_report].filter(Boolean) : []
  const selectedType = types.find((t) => t?.type === reportType) ?? null
  const estCost = selectedType?.est_cost ?? 0

  const lang = i18n.language === 'tr' ? 'tr' : 'en'
  const typeName = (rt: ReportTypeInfo) => lang === 'tr' ? rt.name_tr : rt.name_en
  const typeDesc = (rt: ReportTypeInfo) => lang === 'tr' ? rt.description_tr : rt.description

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

  const Markdown = ({ content }: { content: string | null | undefined }) => {
    if (!content) return null
    return (
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
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'new', label: t('reports.newReport') },
    { key: 'history', label: t('reports.history') },
  ]

  return (
    <div className="max-w-full md:max-w-lg mx-auto space-y-6">
      <div className="flex gap-2">
        {tabs.map((tabItem) => (
          <Button
            key={tabItem.key}
            variant={tab === tabItem.key ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => setTab(tabItem.key)}
          >
            {tabItem.label}
          </Button>
        ))}
      </div>

      {tab === 'new' ? (
        <>
          <StockSearch
            onSelect={(t) => setTicker(t)}
            placeholder={t('reports.selectStock')}
          />

          {ticker && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-lg">{ticker}</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {t('reports.reportType')}
                  </label>
                  <div className="space-y-2">
                    {types.map((rt) => rt && (
                      <button
                        key={rt.type}
                        type="button"
                        onClick={() => setReportType(rt.type)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-colors',
                          reportType === rt.type
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{typeName(rt)}</span>
                          <span className="text-xs text-amber-500 font-mono">~{rt.est_cost} 🪙</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {typeDesc(rt)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <CreditCostTooltip cost={estCost}>
                  <Button
                    variant="gradient"
                    className="w-full h-10"
                    disabled={generateMutation.isPending}
                    onClick={() => generateMutation.mutate()}
                  >
                    <Sparkles className="h-4 w-4 mr-2 shrink-0" />
                    <span className="mr-1">{t('reports.generate')}</span>
                    <span className="text-xs opacity-80">~{estCost}🪙</span>
                  </Button>
                </CreditCostTooltip>
              </CardContent>
            </Card>
          )}

          {generateMutation.isPending && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
              <CardContent className="p-8 space-y-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center animate-spin">
                    <Coins className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t('reportGen.creating')}</p>
                    <p className="text-xs text-muted-foreground mt-1 animate-pulse">
                      {statuses[statusIndex]}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-1000"
                    style={{ width: `${Math.min(95, (elapsed / 120) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground text-center tabular-nums">
                  ⏱ {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / ~3:00 dk
                </p>
              </CardContent>
            </Card>
          )}

          {generateMutation.error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-destructive">
                  {(() => {
                    const axiosErr = generateMutation.error as { response?: { data?: { detail?: string } }; message?: string }
                    return axiosErr.response?.data?.detail || (axiosErr.message && !axiosErr.response ? axiosErr.message : t('reports.error'))
                  })()}
                </p>
              </CardContent>
            </Card>
          )}

          {generateMutation.data && (
            <div className="space-y-3 animate-fadeIn">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{generateMutation.data.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {generateMutation.data.type === 'quick_report'
                            ? t('reports.quickReport') : t('reports.deepReport')}
                          {' · '}
                          {generateMutation.data.about}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => navigate(`/stocks/${generateMutation.data.about}`)}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Markdown content={generateMutation.data.report} />
                </CardContent>
              </Card>

              {generateMutation.data.sentiments?.length > 0 && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('reports.sentiments')}</span>
                    </div>
                    {generateMutation.data.sentiments.map((s: ReportSentiment, i: number) => (
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
                          <a
                            href={safeExternalUrl(s.url) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground ml-auto"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-muted-foreground">{s.reasoning}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-amber-500" />
                      {t('reports.cost')}
                    </span>
                    <span className="font-mono">{generateMutation.data.credits_spend?.toFixed(2) ?? '—'} 🪙</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t('reports.tokens')}
                    </span>
                    <span className="font-mono">{generateMutation.data.token_usage.total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t('reports.search')}
              className="h-9 pl-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <Card
                  key={item.id}
                  className="transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => navigate(`/reports/${item.id}`)}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {item.ticker}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {item.type === 'quick_report' ? t('reports.quickReport') : t('reports.deepReport')}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1 leading-snug line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground text-sm">
                {t('reports.noResults')}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
