import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { PortfolioTransactionDialog } from './PortfolioTransactionDialog'
import api from '@/lib/api'
import type { Portfolio, PortfolioValuation } from '@/types/api'

interface Props {
  ticker: string
  variant?: 'default' | 'compact'
}

export function PortfolioBuySell({ ticker, variant = 'default' }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [dialogType, setDialogType] = useState<'BUY' | 'SELL' | null>(null)

  const { data: currentPrice } = useQuery({
    queryKey: ['current-price', ticker],
    queryFn: async () => {
      const res = await api.get('/api/v1/price/current', { params: { ticker, interval: '5m' } })
      return (res.data as { ticker: string; interval: string; price: number }).price
    },
    staleTime: 10_000,
  })

  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const res = await api.get('/api/v1/portfolios')
      return res.data as Portfolio[]
    },
  })

  const { data: valuation } = useQuery({
    queryKey: ['portfolio-valuation', selectedPortfolioId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/portfolios/${selectedPortfolioId}/valuation`)
      return res.data as PortfolioValuation
    },
    enabled: !!selectedPortfolioId,
  })

  const selectedAsset = valuation?.assets?.find((a) => a.ticker === ticker)
  const ownedQuantity = selectedAsset?.amount
  const availableBalance = valuation?.cash_balance

  const count = portfolios?.length ?? 0

  if (count === 0) {
    return (
      <Button variant="outline" size="sm" onClick={() => navigate('/portfolios')}>
        + {t('portfolio.create')}
      </Button>
    )
  }

  const handleClick = (type: 'BUY' | 'SELL') => {
    if (count === 1) {
      setSelectedPortfolioId(portfolios![0].metadata.id)
      setDialogType(type)
    } else {
      setDialogType(type)
    }
  }

  const buttonClass = variant === 'compact'
    ? 'h-7 px-2 text-[11px]'
    : 'h-8 px-3 text-xs'

  return (
    <>
      <div className="flex items-center gap-1">
        {count > 1 && (
          <Select
            value={selectedPortfolioId ?? ''}
            onValueChange={(v) => setSelectedPortfolioId(v)}
          >
            <SelectTrigger className="h-7 text-xs w-auto min-w-[80px]">
              <SelectValue placeholder={t('portfolio.selectPortfolio')} />
            </SelectTrigger>
            <SelectContent>
              {portfolios?.map((p) => (
                <SelectItem key={p.metadata.id} value={p.metadata.id} className="text-xs">
                  {p.metadata.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="gradient"
          size="sm"
          className={buttonClass}
          onClick={() => handleClick('BUY')}
          disabled={count > 1 && !selectedPortfolioId}
        >
          {t('portfolio.buy')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={buttonClass + ' text-destructive hover:text-destructive border-destructive/30 hover:border-destructive'}
          onClick={() => handleClick('SELL')}
          disabled={count > 1 && !selectedPortfolioId}
        >
          {t('portfolio.sell')}
        </Button>
      </div>

      {dialogType && selectedPortfolioId && (
        <PortfolioTransactionDialog
          open
          onOpenChange={(open) => { if (!open) setDialogType(null) }}
          portfolioId={selectedPortfolioId}
          ticker={ticker}
          type={dialogType}
          currentPrice={currentPrice}
          maxQuantity={dialogType === 'SELL' ? ownedQuantity : undefined}
          availableBalance={availableBalance}
        />
      )}
    </>
  )
}
