import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StockSearch } from '@/components/shared/StockSearch'
import { Search, BarChart3, TrendingUp, Shield, X, Sparkles, Target, Wrench } from 'lucide-react'
import api from '@/lib/api'
import { useMaintenanceStore } from '@/stores/maintenanceStore'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { StockFitResult, StockFitResponse, PortfolioProfileResponse } from '@/types/api'

type Mode = 'fit' | 'portfolio'

function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? 'bg-success' : value >= 0.4 ? 'bg-amber-500' : 'bg-destructive'
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">%{pct}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function VectorBars({ vector }: { vector: [number, number, number] }) {
  const labels = ['Vade', 'Kâr', 'Risk']
  const colors = ['bg-primary', 'bg-amber-500', 'bg-destructive']
  return (
    <div className="flex items-center gap-2">
      {vector.map((v, i) => (
        <div key={i} className="flex-1">
          <div className="h-10 rounded-md bg-muted relative overflow-hidden">
            <div
              className={cn('absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500', colors[i])}
              style={{ height: `${Math.round(v * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-0.5">{labels[i]}</p>
        </div>
      ))}
    </div>
  )
}

function ChipGroup({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? 'gradient' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
          className="flex-1 text-xs h-8"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

function FitResultCard({ result, rank }: { result: StockFitResult; rank: number }) {
  const navigate = useNavigate()
  return (
    <Card
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 cursor-pointer animate-slideUp"
      style={{ animationDelay: `${rank * 80}ms` }}
      onClick={() => navigate(`/stocks/${result.ticker}`)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
            <span className="text-primary-foreground font-bold text-xs">{rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="font-mono font-bold text-primary text-base">{result.ticker}</span>
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  <Sparkles className="h-3 w-3 mr-0.5" />
                  %{Math.round(result.score * 100)}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                δ {result.distance.toFixed(3)}
              </span>
            </div>
            <ScoreBar value={result.score} label="Uygunluk" />
            <div className="mt-2">
              <VectorBars vector={result.vector} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdvisorPage() {
  const { t } = useTranslation()
  usePageTitle(t('scout.title'))
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('fit')
  const [horizon, setHorizon] = useState('medium')
  const [profitability, setProfitability] = useState('medium')
  const [risk, setRisk] = useState('medium')
  const [runFit, setRunFit] = useState(false)
  const [selectedTickers, setSelectedTickers] = useState<string[]>([])
  const [runPortfolio, setRunPortfolio] = useState(false)

  const { data: fitData, isLoading: fitLoading } = useQuery({
    queryKey: ['stock-fit', horizon, profitability, risk],
    queryFn: async () => {
      const res = await api.post('/api/v1/stocks/fit', {
        horizon,
        profitability,
        risk_tolerance: risk,
      })
      return res.data as StockFitResponse
    },
    enabled: runFit,
  })

  const { data: portfolioData, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-profile', selectedTickers],
    queryFn: async () => {
      const res = await api.post('/api/v1/portfolio/profile', {
        tickers: selectedTickers,
      })
      return res.data as PortfolioProfileResponse
    },
    enabled: runPortfolio && selectedTickers.length > 0,
  })

  const hazardLabel = (v: number) => {
    if (v >= 0.6) return t('scout.high')
    if (v >= 0.3) return t('scout.medium')
    return t('scout.low')
  }

  const advisorDisabled = useMaintenanceStore((s) => s.isDisabled('advisor'))

  return (
    <div className="max-w-full md:max-w-lg mx-auto space-y-6">
      {advisorDisabled && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-sm">
          <Wrench className="h-4 w-4 shrink-0" />
          <span>{t('maintenance.advisor') || 'Hisse dedektifi özelliği geçici olarak bakımdadır.'}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant={mode === 'fit' ? 'gradient' : 'outline'}
          onClick={() => { setMode('fit'); setRunFit(false); setRunPortfolio(false) }}
          size="sm"
        >
          <Search className="h-4 w-4 mr-1.5" />
          {t('scout.stockFit')}
        </Button>
        <Button
          variant={mode === 'portfolio' ? 'gradient' : 'outline'}
          onClick={() => { setMode('portfolio'); setRunFit(false); setRunPortfolio(false) }}
          size="sm"
        >
          <BarChart3 className="h-4 w-4 mr-1.5" />
          {t('scout.portfolio')}
        </Button>
      </div>

      {mode === 'fit' ? (
        <>
          <Card className="bg-gradient-to-br from-primary/[0.04] to-transparent border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                {t('scout.results')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('scout.horizon')}</label>
                  <ChipGroup
                    options={[
                      { value: 'short', label: t('scout.shortTerm') },
                      { value: 'medium', label: t('scout.mediumTerm') },
                      { value: 'long', label: t('scout.longTerm') },
                    ]}
                    value={horizon}
                    onChange={setHorizon}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('scout.profitability')}</label>
                  <ChipGroup
                    options={[
                      { value: 'low', label: t('scout.profitLow') },
                      { value: 'medium', label: t('scout.profitMedium') },
                      { value: 'high', label: t('scout.profitHigh') },
                    ]}
                    value={profitability}
                    onChange={setProfitability}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('scout.riskTolerance')}</label>
                  <ChipGroup
                    options={[
                      { value: 'low', label: t('scout.low') },
                      { value: 'medium', label: t('scout.medium') },
                      { value: 'high', label: t('scout.high') },
                    ]}
                    value={risk}
                    onChange={setRisk}
                  />
                </div>
              </div>
              <Button
                variant="gradient"
                className="w-full h-10"
                onClick={() => setRunFit(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                {t('scout.analyze')}
              </Button>
            </CardContent>
          </Card>

          {fitLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          )}

          {fitData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {fitData.results.length} hisse bulundu
              </div>
              {fitData.results.map((result, i) => (
                <FitResultCard key={result.ticker} result={result} rank={i + 1} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-primary/[0.04] to-transparent border-primary/10">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t('scout.portfolio')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t('scout.portfolioDesc')}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('scout.yourPortfolio')}</label>
                <StockSearch
                  onSelect={(ticker) => {
                    if (!selectedTickers.includes(ticker)) {
                      setSelectedTickers([...selectedTickers, ticker])
                    }
                  }}
                  placeholder={t('scout.addTicker')}
                />
                {selectedTickers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTickers.map((tkr) => (
                      <Badge key={tkr} variant="secondary" className="gap-1 px-2 py-1 text-xs">
                        <span className="font-mono">{tkr}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => setSelectedTickers(selectedTickers.filter((t) => t !== tkr))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="gradient"
                className="w-full h-10"
                disabled={selectedTickers.length === 0}
                onClick={() => setRunPortfolio(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('scout.analyze')}
              </Button>
            </CardContent>
          </Card>

          {portfolioLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          )}

          {portfolioData && (
            <div className="space-y-4 animate-fadeIn">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('scout.estimatedProfile')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {t('scout.horizon')}: {hazardLabel(portfolioData.avg_vector[0])}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <Target className="h-3 w-3 text-amber-500" />
                      {t('scout.profitability')}: {hazardLabel(portfolioData.avg_vector[1])}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <Shield className="h-3 w-3 text-destructive" />
                      {t('scout.riskTolerance')}: {hazardLabel(portfolioData.avg_vector[2])}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('scout.yourPortfolio')}</h3>
                <div className="space-y-3">
                  {portfolioData.portfolio.map((stock) => (
                    <Card key={stock.ticker} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer" onClick={() => navigate(`/stocks/${stock.ticker}`)}>
                      <CardContent className="p-2.5">
                        <span className="font-mono font-bold text-primary">{stock.ticker}</span>
                        <div className="mt-2">
                          <VectorBars vector={stock.vector} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {portfolioData.similar_stocks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('scout.similarStocks')}</h3>
                  <div className="space-y-3">
                    {portfolioData.similar_stocks.map((stock, i) => (
                      <FitResultCard key={stock.ticker} result={stock} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
