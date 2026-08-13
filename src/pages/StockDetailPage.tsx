import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FlaskConical, FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { StockSearch } from '@/components/shared/StockSearch'
import { StockChart } from '@/components/shared/StockChart'
import { StatCard } from '@/components/shared/StatCard'
import { RecommendationsGauge } from '@/components/shared/RecommendationsGauge'
import { FavoriteButton } from '@/components/shared/FavoriteButton'
import { PortfolioBuySell } from '@/components/shared/PortfolioBuySell'
import { QuoteChange } from '@/components/shared/QuoteChange'
import { useNavStore } from '@/stores/navStore'
import { usePageTitle } from '@/hooks/usePageTitle'
import { processPriceData } from '@/lib/price'
import api from '@/lib/api'
import { safeExternalUrl } from '@/lib/safeUrl'
import { trackWithTicker } from '@/lib/telemetry'
import type { CompanyInfo, PriceHistory, NewsItem } from '@/types/api'
import { stockQuoteResponseSchema, parseApi } from '@/lib/apiSchemas'
import type { StockQuote } from '@/types/api'

const PERIODS = [
  { label: '1ay', value: '1mo' },
  { label: '3ay', value: '3mo' },
  { label: '6ay', value: '6mo' },
  { label: '1y', value: '1y' },
  { label: '5y', value: '5y' },
] as const

const INTERVALS = [
  { label: '5dk', value: '5m' },
  { label: '30dk', value: '30m' },
  { label: '1s', value: '1h' },
  { label: '1g', value: '1d' },
  { label: '1h', value: '1wk' },
  { label: '1a', value: '1mo' },
] as const

const INTERVAL_MAX_PERIOD: Record<string, string> = {
  '5m': '1d',
  '30m': '5d',
  '1h': '1mo',
}

const PERIOD_VALUES = PERIODS.map((p) => p.value)

function clampPeriod(interval: string, period: string): string {
  const max = INTERVAL_MAX_PERIOD[interval]
  if (!max) return period
  const maxIdx = PERIOD_VALUES.indexOf(max as typeof PERIOD_VALUES[number])
  if (maxIdx === -1) return period
  const curIdx = PERIOD_VALUES.indexOf(period as typeof PERIOD_VALUES[number])
  if (curIdx > maxIdx) return max
  return period
}

function safeFixed(n: number | null | undefined, digits: number, fallback = '—'): string {
  if (n === null || n === undefined) return fallback
  return n.toFixed(digits)
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  if (Math.abs(n) >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `%${n.toFixed(2)}`
}

function pctChange(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined || b === 0) return undefined
  return ((a - b) / b) * 100
}

export default function StockDetailPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const { t } = useTranslation()
  usePageTitle(ticker ?? t('stocks.title'))
  const navigate = useNavigate()
  const setLastStockTicker = useNavStore((s) => s.setLastStockTicker)
  const PERIODS_TR = PERIODS.map((p) => ({ ...p, label: t(`time.${p.value}`) }))
  const INTERVALS_TR = INTERVALS.map((i) => ({ ...i, label: t(`time.${i.value}`, i.label) }))

  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(PERIODS[PERIOD_VALUES.indexOf(clampPeriod('5m', PERIODS[0].value) as typeof PERIOD_VALUES[number])])
  const [interval, setIntervalLocal] = useState<string>('5m')

  useEffect(() => {
    const clamped = clampPeriod(interval, period.value)
    if (clamped !== period.value) {
      setPeriod(PERIODS[PERIOD_VALUES.indexOf(clamped as typeof PERIOD_VALUES[number])])
    }
  }, [interval])

  useEffect(() => {
    if (ticker) setLastStockTicker(ticker)
  }, [ticker, setLastStockTicker])

  const { data: info, isLoading: infoLoading, isError: infoError } = useQuery({
    queryKey: ['company-info', ticker],
    queryFn: async () => {
      const res = await api.get(`/api/v1/companies/info/${ticker}`)
      return res.data as CompanyInfo
    },
    enabled: !!ticker,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const { data: priceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['price-history', ticker, period.value, interval],
    queryFn: async () => {
      const res = await api.get(`/api/v1/price/history/${ticker}`, {
        params: { period: period.value, interval },
      })
      return res.data as PriceHistory[]
    },
    enabled: !!ticker,
    staleTime: interval === '5m' ? 30_000 : 5 * 60_000,
  })

  const { data: livePrice } = useQuery({
    queryKey: ['current-price', ticker],
    queryFn: async () => {
      const res = await api.get('/api/v1/price/current', { params: { ticker, interval: '5m' } })
      return parseApi(stockQuoteResponseSchema, res.data) as StockQuote
    },
    enabled: !!ticker,
    staleTime: 10_000,
    refetchInterval: (query) => query.state.data?.market_status === 'closed' ? false : 30_000,
  })

  const m = info?.market
  const v = info?.valuation
  const f = info?.financials
  const tData = info?.trading
  const bs = info?.balanceSheet
  const companyName = info?.name || ticker

  const processed = useMemo(() => {
    if (!priceHistory) return { data: [] as PriceHistory[], from: 0, to: 0 }
    return processPriceData(priceHistory, period.value, interval)
  }, [priceHistory, period.value, interval])

  const currentPrice = livePrice?.price ?? m?.currentPrice

  const dailyChange = livePrice?.change_pct ?? null

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ['news', ticker],
    queryFn: async () => {
      const res = await api.get(`/api/v1/news/${ticker}`, { params: { amount: 10 } })
      return res.data as NewsItem[]
    },
    enabled: !!ticker,
    staleTime: 5 * 60_000,
  })

  if (infoError && !info) {
    return (
      <div className="space-y-6 pt-8 md:pt-12">
        <Button variant="ghost" size="sm" onClick={() => navigate('/stocks')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">Hisse bilgisi yüklenemedi</h2>
          <p className="text-muted-foreground mb-4">{ticker} için veri alınamadı.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  if (infoLoading && !info) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  const sliced = processed.data
  const periodLatest = sliced[sliced.length - 1]?.close
  const periodStart = sliced[0]?.close
  const periodChange = pctChange(periodLatest, periodStart)

  const isDailyInterval = interval === '1d'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/stocks')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>
        <div className="max-w-xs flex-1">
          <StockSearch
            onSelect={(t) => navigate(`/stocks/${t}`)}
            placeholder={t('stocks.search')}
          />
        </div>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <QuoteChange
              change={dailyChange}
              changeWindow={livePrice?.change_window ?? 'previous_session_close'}
              marketStatus={livePrice?.market_status}
              isStale={livePrice?.is_stale}
              asOf={livePrice?.as_of}
            />
          </div>
          <p className={cn(
            'mt-1 font-medium',
            dailyChange !== null && (dailyChange >= 0 ? 'text-success' : 'text-destructive'),
          )}>{companyName}</p>
          {info?.sector && <p className="text-xs text-muted-foreground">{info.sector} · {info.industry}</p>}
        </div>
        {ticker && (
            <div className="flex items-center gap-2 flex-wrap">
              <FavoriteButton ticker={ticker} />
              <PortfolioBuySell ticker={ticker} />
              <Button variant="outline" size="sm" onClick={() => { trackWithTicker('feature_click', ticker, { feature: 'simulation_button' }); navigate(`/simulation?ticker=${ticker}`) }}>
                <FlaskConical className="h-4 w-4 mr-1" />
                Simülasyon
              </Button>
              <Button variant="outline" size="sm" onClick={() => { trackWithTicker('feature_click', ticker, { feature: 'report_button' }); navigate(`/reports?ticker=${ticker}`) }}>
                <FileText className="h-4 w-4 mr-1" />
                Rapor
              </Button>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const res = await api.get(`/api/v1/companies/info/${encodeURIComponent(ticker)}/md`, { responseType: 'blob' })
                  const url = URL.createObjectURL(res.data as Blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${ticker}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                 } catch {
                   toast.error(t('common.error'))
                 }
              }}>
                <Download className="h-4 w-4 mr-1" />
                Özet
              </Button>
            </div>
          )}
      </div>

      {m && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard title={t('stockDetail.price')} value={fmtCurrency(currentPrice)} positive={dailyChange !== null ? dailyChange >= 0 : undefined} />
          <StatCard title={t('stockDetail.marketCap')} value={fmt(m.marketCap)} />
          <StatCard title={t('stockDetail.dayRange')} value={fmtCurrency(m.dayLow)} sub={`— ${fmtCurrency(m.dayHigh)}`} />
          <StatCard title={t('stockDetail.volume')} value={fmt(m.regularMarketVolume)} />
          <StatCard title={t('stockDetail.high52')} value={fmtCurrency(m.fiftyTwoWeekHigh)} positive />
          <StatCard title={t('stockDetail.low52')} value={fmtCurrency(m.fiftyTwoWeekLow)} positive={false} />
        </div>
      )}

      {info?.recommendations?.[0] && (
        <RecommendationsGauge
          data={info.recommendations[0]}
          targetMean={v?.targetMeanPrice ?? null}
          targetLow={v?.targetLowPrice ?? null}
          targetHigh={v?.targetHighPrice ?? null}
          currentPrice={currentPrice ?? null}
          analystCount={v?.numberOfAnalystOpinions ?? null}
        />
      )}

      {v && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <StatCard title={t('stockDetail.pe')} value={safeFixed(v.trailingPE, 2)} />
          <StatCard title={t('stockDetail.peForward')} value={safeFixed(v.forwardPE, 2)} />
          <StatCard title={t('stockDetail.pb')} value={safeFixed(v.priceToBook, 2)} />
          <StatCard title={t('stockDetail.peg')} value={safeFixed(v.pegRatio, 2)} />
          <StatCard title={t('stockDetail.ps')} value={safeFixed(v.priceToSalesTrailing12Months, 2)} />
          <StatCard title={t('stockDetail.enterpriseValue')} value={fmt(v.enterpriseValue)} />
          <StatCard title={t('stockDetail.dividendYield')} value={v.dividendYield ? `%${safeFixed(v.dividendYield, 2)}` : '—'} />
          <StatCard title={t('stockDetail.targetPrice')} value={fmtCurrency(v.targetMeanPrice)} />
        </div>
      )}

      {tData && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <StatCard title={t('stockDetail.beta')} value={safeFixed(tData.beta, 2)} positive={tData.beta < 1 ? true : tData.beta > 1 ? false : undefined} />
          <StatCard title={t('stockDetail.avgVolume')} value={fmt(tData.averageVolume)} />
          <StatCard title={t('stockDetail.avgVolume10d')} value={fmt(tData.averageVolume10days)} />
          <StatCard title={t('stockDetail.ma50')} value={fmtCurrency(tData.fiftyDayAverage)} />
          <StatCard title={t('stockDetail.ma200')} value={fmtCurrency(tData.twoHundredDayAverage)} />
          <StatCard title={t('stockDetail.sharesOutstanding')} value={fmt(tData.sharesOutstanding)} />
          <StatCard title={t('stockDetail.sharesFloat')} value={fmt(tData.floatShares)} />
          <StatCard title={t('stockDetail.insiderRatio')} value={`%${(tData.heldPercentInsiders * 100).toFixed(1)}`} />
          <StatCard title={t('stockDetail.institutionalRatio')} value={`%${(tData.heldPercentInstitutions * 100).toFixed(1)}`} />
          <StatCard title={t('stockDetail.shortRatio')} value={tData.shortRatio !== null ? safeFixed(tData.shortRatio, 1) : '—'} />
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-medium">{t('stockDetail.period')}:</span>
            <div className="flex gap-1">
              {PERIODS_TR.map((p) => (
                <Button
                  key={p.value}
                  variant={period.value === p.value ? 'gradient' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(PERIODS.find((x) => x.value === p.value)!)}
                  className="text-xs"
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <span className="text-sm text-muted-foreground mx-1">|</span>
            <span className="text-sm font-medium">{t('stockDetail.interval')}:</span>
            <div className="flex gap-1">
              {INTERVALS_TR.map((i) => (
                <Button
                  key={i.value}
                  variant={interval === i.value ? 'gradient' : 'outline'}
                  size="sm"
                  onClick={() => setIntervalLocal(i.value)}
                  className="text-xs"
                >
                  {i.label}
                </Button>
              ))}
            </div>
            {!isDailyInterval && periodChange !== undefined && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium">
                <span>{period.label} değişim:</span>
                <QuoteChange
                  change={periodChange}
                  changeWindow="selected_period"
                  marketStatus={livePrice?.market_status}
                  isStale={false}
                  asOf={sliced[sliced.length - 1]?.ts}
                  compact
                />
              </span>
            )}
          </div>
          <StockChart data={sliced} loading={historyLoading} visibleRange={{ from: processed.from, to: processed.to }} />
        </CardContent>
      </Card>

      <Tabs defaultValue="news">
        <TabsList className="overflow-x-auto flex-nowrap">
          <TabsTrigger value="news">{t('stockDetail.news')}</TabsTrigger>
          {f && <TabsTrigger value="financials">{t('stockDetail.financialsTitle')}</TabsTrigger>}
          {bs && <TabsTrigger value="balance">{t('stockDetail.balanceTitle')}</TabsTrigger>}
        </TabsList>

        <TabsContent value="news" className="mt-4">
          <div className="space-y-3">
            {newsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))
              : news?.map((item, i) => (
                  <a key={i} href={safeExternalUrl(item.url) ?? '#'} target="_blank" rel="noopener noreferrer">
                    <Card className="hover:bg-muted/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </p>
                      </CardContent>
                    </Card>
                  </a>
                ))}
          </div>
        </TabsContent>

        {f && (
          <TabsContent value="financials" className="mt-4">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard title="Gelir" value={fmt(f.totalRevenue)} />
              <StatCard title="Net Kar" value={fmt(f.netIncomeToCommon)} />
              <StatCard title="Kar Marjı" value={fmtPct(f.profitMargins * 100)} />
              <StatCard title="Brüt Marj" value={fmtPct(f.grossMargins * 100)} />
              <StatCard title="EBITDA" value={fmt(f.ebitda)} />
              <StatCard title="EBITDA Marj" value={fmtPct(f.ebitdaMargins * 100)} />
              <StatCard title="Ciro Büyüme" value={f.revenueGrowth ? fmtPct(f.revenueGrowth * 100) : '—'} />
              <StatCard title="Öz Sermaye Kârlılığı" value={fmtPct(f.returnOnEquity * 100)} />
              <StatCard title="Aktif Kârlılığı" value={fmtPct(f.returnOnAssets * 100)} />
              <StatCard title="Serbest Nakit Akışı" value={fmt(f.freeCashflow)} />
            </div>
          </TabsContent>
        )}

        {bs && (
          <TabsContent value="balance" className="mt-4">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard title="Nakit" value={fmt(bs.totalCash)} />
              <StatCard title="Hisse Başı Nakit" value={fmtCurrency(bs.totalCashPerShare)} />
              <StatCard title="Borç" value={fmt(bs.totalDebt)} />
              <StatCard title="Borç/Öz Sermaye" value={safeFixed(bs.debtToEquity, 1)} />
              <StatCard title="Cari Oran" value={safeFixed(bs.currentRatio, 2)} positive={bs.currentRatio >= 1 ? true : false} />
              <StatCard title="Likidite Oranı" value={safeFixed(bs.quickRatio, 2)} positive={bs.quickRatio >= 1 ? true : false} />
              <StatCard title={t('stockDetail.peValue')} value={m && f?.netIncomeToCommon ? safeFixed(m.marketCap / f.netIncomeToCommon, 2) : '—'} />
              <StatCard title="Hisse Başı Kâr" value={fmtCurrency(f?.netIncomeToCommon ? v?.trailingEps : null)} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
