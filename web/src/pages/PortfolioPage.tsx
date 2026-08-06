import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, ArrowLeft, Pencil, Trash2, Copy, Download, Undo2, Wallet, BarChart3, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PortfolioTransactionDialog } from '@/components/shared/PortfolioTransactionDialog'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import type { Portfolio, PortfolioValuation } from '@/types/api'

function fmtAmount(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2)
}

export default function PortfolioPage() {
  const { portfolioId } = useParams()

  if (portfolioId) {
    return <PortfolioDetail portfolioId={portfolioId} />
  }

  return <PortfolioList />
}

function PortfolioList() {
  const { t } = useTranslation()
  usePageTitle(t('portfolio.title'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBalance, setNewBalance] = useState('')

  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const res = await api.get('/api/v1/portfolios')
      return res.data as Portfolio[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/portfolios', {
        name: newName,
        initial_balance: parseFloat(newBalance),
      })
    },
    onSuccess: () => {
      toast.success(t('portfolio.transactionAdded'))
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setCreateOpen(false)
      setNewName('')
      setNewBalance('')
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('portfolio.new')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : !portfolios?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{t('portfolio.noPortfolios')}</p>
            <p className="text-sm text-muted-foreground/60 mt-1">{t('portfolio.createFirst')}</p>
            <Button variant="gradient" className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('portfolio.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <PortfolioCard key={p.metadata.id} portfolio={p} onClick={() => navigate(`/portfolios/${p.metadata.id}`)} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('portfolio.create')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder={t('portfolio.name')} value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input type="number" min="0" step="0.01" placeholder={t('portfolio.initialBalance')} value={newBalance} onChange={(e) => setNewBalance(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="gradient" disabled={!newName || !newBalance || parseFloat(newBalance) <= 0 || createMutation.isPending} onClick={() => createMutation.mutate()}>
              {t('portfolio.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PortfolioCard({ portfolio, onClick }: { portfolio: Portfolio; onClick: () => void }) {
  const { t } = useTranslation()
  const m = portfolio.metadata
  return (
    <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold truncate">{m.name}</h3>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('portfolio.cashBalance')}</span>
            <span className="font-medium">{m.balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground/60">
            <span>{t('portfolio.initialBalance')}</span>
            <span>{m.initial_balance.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PortfolioDetail({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [duplicateName, setDuplicateName] = useState('')
  const [txDialog, setTxDialog] = useState<{ ticker: string; type: 'BUY' | 'SELL' } | null>(null)

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}`)
      return res.data as Portfolio
    },
  })

  const { data: valuation } = useQuery({
    queryKey: ['portfolio-valuation', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}/valuation`)
      return res.data as PortfolioValuation
    },
    enabled: !!portfolio,
  })

  usePageTitle(portfolio?.metadata?.name ?? t('portfolio.title'))

  const renameMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/v1/portfolios/${portfolioId}`, { name: renameValue })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setRenameOpen(false)
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/portfolios/${portfolioId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      navigate('/portfolios', { replace: true })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/portfolios/${portfolioId}/duplicate`, { name: duplicateName })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      setDuplicateOpen(false)
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const undoMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/portfolios/${portfolioId}/transactions/undo`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-valuation', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-history', portfolioId] })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Portfolio not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/portfolios')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('common.back')}
        </Button>
      </div>
    )
  }

  const m = portfolio.metadata
  const v = valuation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/portfolios')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(m.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setRenameValue(m.name); setRenameOpen(true) }}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {t('portfolio.rename')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setDuplicateName(`${m.name} (copy)`); setDuplicateOpen(true) }}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            {t('portfolio.duplicate')}
          </Button>
          {portfolio.transactions.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => undoMutation.mutate()} disabled={undoMutation.isPending}>
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              {t('portfolio.undo')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const res = await api.get(`/api/v1/portfolios/${portfolioId}/export/csv`)
              const blob = new Blob([res.data as string], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `${m.name}.csv`; a.click()
              URL.revokeObjectURL(url)
            } catch { toast.error(t('common.error')) }
          }}>
            <Download className="h-3.5 w-3.5 mr-1" />
            {t('portfolio.exportCSV')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {t('portfolio.delete')}
          </Button>
        </div>
      </div>

      {/* Valuation overview */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalValue')}</p>
            <p className="text-xl font-bold">{v?.total_value.toFixed(2) ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.cashBalance')}</p>
            <p className="text-xl font-bold">{v?.cash_balance != null ? v.cash_balance.toFixed(2) : m.balance.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.holdingsValue')}</p>
            <p className="text-xl font-bold">{v?.holdings_value.toFixed(2) ?? '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalPnl')}</p>
            <p className={cn('text-xl font-bold', (v?.total_pnl ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>
              {v?.total_pnl != null ? `${v.total_pnl >= 0 ? '+' : ''}${v.total_pnl.toFixed(2)}` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">
            <Wallet className="h-4 w-4 mr-2" />
            {t('portfolio.assets')}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <FileText className="h-4 w-4 mr-2" />
            {t('portfolio.transactions')}
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('portfolio.analysis')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{t('portfolio.assets')}</CardTitle>
              {txDialog && (() => {
                const a = valuation?.assets?.find((x) => x.ticker === txDialog.ticker)
                return (
                  <PortfolioTransactionDialog
                    open
                    onOpenChange={() => setTxDialog(null)}
                    portfolioId={portfolioId}
                    ticker={txDialog.ticker}
                    type={txDialog.type}
                    currentPrice={a?.current_price ?? undefined}
                    maxQuantity={txDialog.type === 'SELL' ? a?.amount : undefined}
                    availableBalance={valuation?.cash_balance}
                  />
                )
              })()}
            </CardHeader>
            <CardContent>
              {!v?.assets?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('portfolio.noTransactions')}</p>
              ) : (
                <div className="space-y-2">
                  {v.assets.map((a) => (
                    <div key={a.ticker} className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{a.ticker}</p>
                        <p className="text-xs text-muted-foreground">{fmtAmount(a.amount)} adet &middot; ortalama {a.weighted_avg_cost.toFixed(2)} TL</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{a.total_value?.toFixed(2) ?? '-'}</p>
                        {a.unrealized_pnl != null && (
                          <p className={cn('text-xs', a.unrealized_pnl >= 0 ? 'text-success' : 'text-destructive')}>
                            {a.unrealized_pnl >= 0 ? '+' : ''}{a.unrealized_pnl.toFixed(2)} ({a.unrealized_pnl_pct?.toFixed(2) ?? '-'}%)
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-success" onClick={() => setTxDialog({ ticker: a.ticker, type: 'BUY' })}>
                          {t('portfolio.buy')}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => setTxDialog({ ticker: a.ticker, type: 'SELL' })}>
                          {t('portfolio.sell')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {!portfolio.transactions.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">{t('portfolio.noTransactions')}</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {[...portfolio.transactions].reverse().map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-xs font-semibold px-1.5 py-0.5 rounded',
                          tx.type === 'BUY' ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10',
                        )}>
                          {tx.type}
                        </span>
                        <span className="text-sm font-medium">{tx.ticker}</span>
                      </div>
                      <div className="text-right text-sm">
                        <span>{fmtAmount(tx.quantity)} × {tx.price.toFixed(2)}</span>
                        <span className="text-muted-foreground ml-2">= {(tx.quantity * tx.price).toFixed(2)} TL</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <PortfolioAnalysis portfolioId={portfolioId} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('portfolio.rename')}</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="gradient" disabled={!renameValue || renameMutation.isPending} onClick={() => renameMutation.mutate()}>
              {t('portfolio.rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('portfolio.duplicate')}</DialogTitle></DialogHeader>
          <Input value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="gradient" disabled={!duplicateName || duplicateMutation.isPending} onClick={() => duplicateMutation.mutate()}>
              {t('portfolio.duplicate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('portfolio.delete')}</DialogTitle>
            <DialogDescription>{t('portfolio.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {t('portfolio.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PortfolioAnalysis({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation()

  const { data: returns } = useQuery({
    queryKey: ['portfolio-returns', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}/returns?period=max`)
      return res.data as { absolute_return: number; total_return_percentage: number | null; cagr_percentage: number | null }
    },
  })

  const { data: risk } = useQuery({
    queryKey: ['portfolio-risk', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}/risk?period=1y`)
      return res.data as { volatility: number | null; max_drawdown: number | null; sharpe_ratio: number | null }
    },
  })

  const { data: benchmark } = useQuery({
    queryKey: ['portfolio-benchmark', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}/benchmark?ticker=XU100`)
      return res.data as { portfolio_return_pct: number; benchmark_return_pct: number; difference_pct: number; outperformed: boolean }
    },
  })

  const { data: diversification } = useQuery({
    queryKey: ['portfolio-diversification', portfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${portfolioId}/diversification`)
      return res.data as { total_value: number; cash_allocation_pct: number; assets: { ticker: string; allocation_pct: number; type: string }[] }
    },
  })

  const r = returns
  const k = risk
  const bm = benchmark
  const div = diversification

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalPnl')}</p>
            <p className={cn('text-lg font-bold', (r?.absolute_return ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>
              {r?.absolute_return != null ? `${r.absolute_return >= 0 ? '+' : ''}${r.absolute_return.toFixed(2)}` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">CAGR</p>
            <p className={cn('text-lg font-bold', (r?.cagr_percentage ?? 0) >= 0 ? 'text-success' : 'text-destructive')}>
              {r?.cagr_percentage != null ? `${r.cagr_percentage >= 0 ? '+' : ''}${r.cagr_percentage.toFixed(2)}%` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{t('portfolio.totalValue')}</p>
            <p className="text-lg font-bold">{r?.absolute_return != null ? (r.absolute_return + (r?.cagr_percentage ?? 0)).toFixed(2) : '-'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Risk Metrikleri</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Volatilite</span><span>{k?.volatility != null ? `${k.volatility.toFixed(2)}%` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max Drawdown</span><span className="text-destructive">{k?.max_drawdown != null ? `-${k.max_drawdown.toFixed(2)}%` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sharpe Ratio</span><span>{k?.sharpe_ratio != null ? k.sharpe_ratio.toFixed(2) : '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Benchmark (XU100)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {bm?.portfolio_return_pct != null ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Portföy</span><span className={bm.portfolio_return_pct >= 0 ? 'text-success' : 'text-destructive'}>{bm.portfolio_return_pct >= 0 ? '+' : ''}{bm.portfolio_return_pct.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">XU100</span><span>{bm.benchmark_return_pct >= 0 ? '+' : ''}{bm.benchmark_return_pct.toFixed(2)}%</span></div>
                <div className="flex justify-between pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">Fark</span>
                  <span className={bm.outperformed ? 'text-success' : 'text-destructive'}>{bm.difference_pct >= 0 ? '+' : ''}{bm.difference_pct.toFixed(2)}%</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Veri yok</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('portfolio.diversification')}</CardTitle></CardHeader>
        <CardContent>
          {div ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nakit</span>
                <span>{div.cash_allocation_pct != null ? `${div.cash_allocation_pct.toFixed(1)}%` : '-'}</span>
              </div>
              {div.assets?.map((a) => (
                <div key={a.ticker} className="flex justify-between">
                  <span className="text-muted-foreground">{a.ticker} <span className="text-[10px]">({a.type})</span></span>
                  <span>{a.allocation_pct != null ? `${a.allocation_pct.toFixed(1)}%` : '-'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t('portfolio.noTransactions')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
