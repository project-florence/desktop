import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, TrendingUp, ExternalLink, Building2, Calendar, MapPin } from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import type { IpoListItem, IpoDetail } from '@/types/api'

type Tab = 'active' | 'draft'

export default function IposPage() {
  const { t } = useTranslation()
  usePageTitle(t('ipos.title'))
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('active')
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  const activeQuery = useQuery({
    queryKey: ['ipos', 'active'],
    queryFn: async () => {
      const res = await api.get('/api/v1/ipos/active')
      return res.data as IpoListItem[]
    },
    staleTime: 60_000,
  })

  const draftQuery = useQuery({
    queryKey: ['ipos', 'draft'],
    queryFn: async () => {
      const res = await api.get('/api/v1/ipos/draft')
      return res.data as IpoListItem[]
    },
    staleTime: 60_000,
  })

  const list = tab === 'active' ? activeQuery.data : draftQuery.data
  const listLoading = tab === 'active' ? activeQuery.isLoading : draftQuery.isLoading

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['ipo-detail', expandedSlug],
    queryFn: async () => {
      const res = await api.get(`/api/v1/ipos/${expandedSlug}`)
      return res.data as IpoDetail
    },
    enabled: !!expandedSlug,
    staleTime: 5 * 60_000,
  })

  const infoFields = [
    { key: 'Halka Arz Fiyatı/Aralığı', label: t('ipo.price'), icon: '₺' },
    { key: 'Pay', label: t('ipo.shareAmount') },
    { key: 'Pazar', label: t('ipo.market') },
    { key: 'Bist İlk İşlem Tarihi', label: t('ipo.firstTradeDate') },
    { key: 'Halka Arz Büyüklüğü', label: t('ipo.size') },
    { key: 'Halka Arz İskontosu', label: t('ipo.discountRate') },
    { key: 'Fiili Dolaşımdaki Pay Oranı (%)', label: t('ipo.circulatingRatio') },
  ]

  const sectionKeys = [
    { dataKey: 'Halka Arz Şekli', label: t('ipo.method') },
    { dataKey: 'Fonun Kullanım Yeri', label: t('ipo.fundUsage') },
    { dataKey: 'Halka Arz Satış Yöntemi', label: t('ipo.saleMethod') },
    { dataKey: 'Tahsisat Grupları', label: t('ipo.allocationGroups') },
    { dataKey: 'Dağıtılan Pay Miktarı *', label: t('ipo.distributedAmount') },
    { dataKey: 'Fiyat İstikrarı', label: t('ipo.priceStabilization') },
    { dataKey: 'Satmama Taahhüdü', label: t('ipo.lockUp') },
    { dataKey: 'Halka Açıklık', label: t('ipo.publicFloat') },
  ]

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return d
    }
  }

  const toggleExpand = (slug: string) => {
    setExpandedSlug(expandedSlug === slug ? null : slug)
  }

  const tabs: { key: Tab; label: string; icon: typeof TrendingUp }[] = [
    { key: 'active', label: t('ipo.active'), icon: TrendingUp },
    { key: 'draft', label: t('ipo.draft'), icon: Building2 },
  ]

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex gap-2">
        {tabs.map((tabItem) => (
          <Button
            key={tabItem.key}
            variant={tab === tabItem.key ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => { setTab(tabItem.key); setExpandedSlug(null) }}
          >
            <tabItem.icon className="h-4 w-4 mr-1.5" />
            {tabItem.label}
            <span className="ml-1 text-xs opacity-70">
              ({tabItem.key === 'active' ? activeQuery.data?.length ?? '?' : draftQuery.data?.length ?? '?'})
            </span>
          </Button>
        ))}
      </div>

      {listLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : list && list.length > 0 ? (
        <div className="space-y-2">
          {list.map((ipo) => {
            const isExpanded = expandedSlug === ipo.slug
            return (
              <div key={ipo.id} className="space-y-0">
                <Card
                  className={cn(
                    'transition-all duration-200 cursor-pointer',
                    isExpanded
                      ? 'border-primary/30 shadow-sm shadow-primary/5'
                      : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
                  )}
                  onClick={() => toggleExpand(ipo.slug)}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm leading-snug line-clamp-1">{ipo.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ipo.date)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={ipo.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {isExpanded && (
                  <div className="animate-slideUp">
                    {detailLoading && expandedSlug === ipo.slug ? (
                      <Card className="border-t-0 rounded-t-none">
                        <CardContent className="p-4 space-y-3">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </Card>
                    ) : detail && detail.slug === ipo.slug ? (
                      <Card className="border-t-0 rounded-t-none border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          {detail.ticker && (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-sm px-3 py-1"
                                onClick={() => navigate(`/stocks/${detail.ticker}`)}
                              >
                                <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-primary" />
                                {detail.ticker}
                              </Badge>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 overflow-x-auto">
                            {infoFields.map((field) => {
                              const val = detail.info[field.key]
                              if (!val) return null
                              return (
                                <div key={field.key} className="text-xs">
                                  <span className="text-muted-foreground">{field.label}</span>
                                  <p className="font-medium">{field.icon}{val}</p>
                                </div>
                              )
                            })}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {detail.company.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Kuruluş: {detail.company.founded}
                            </span>
                          </div>

                          <div className="space-y-3 pt-1 border-t border-border">
                            {sectionKeys.map((sk) => {
                              const val = detail.sections[sk.dataKey]
                              if (!val) return null
                              return (
                                <div key={sk.dataKey}>
                                  <p className="text-xs font-medium text-primary mb-0.5">{sk.label}</p>
                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{val}</p>
                                </div>
                              )
                            })}
                          </div>

                          <p className="text-[10px] text-muted-foreground text-right">
                            Güncelleme: {detail.updated_at}
                          </p>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            {t('common.noData')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
