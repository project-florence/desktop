import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import api from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioId: string
  ticker: string
  type: 'BUY' | 'SELL'
  currentPrice?: number
  maxQuantity?: number
  availableBalance?: number
}

export function PortfolioTransactionDialog({ open, onOpenChange, portfolioId, ticker, type, currentPrice, maxQuantity, availableBalance }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState('')

  const COMMISSION_RATE = parseFloat(import.meta.env.VITE_PORTFOLIO_COMMISSION_RATE || '0.001')

  const qty = parseFloat(quantity) || 0
  const subtotal = currentPrice != null ? qty * currentPrice : null
  const commission = subtotal != null ? subtotal * COMMISSION_RATE : null
  const total = subtotal != null && commission != null
    ? (type === 'BUY' ? subtotal + commission : subtotal - commission)
    : null

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/portfolios/${portfolioId}/transactions`, {
        ticker,
        type,
        quantity: parseFloat(quantity),
      })
    },
    onSuccess: () => {
      toast.success(type === 'BUY' ? t('portfolio.buySuccess') : t('portfolio.sellSuccess'))
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio', portfolioId] })
      queryClient.invalidateQueries({ queryKey: ['portfolio-valuation', portfolioId] })
      setQuantity('')
      onOpenChange(false)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || t('common.error')
      toast.error(msg)
    },
  })

  const insufficientBalance = type === 'BUY' && total != null && availableBalance != null && total > availableBalance
  const insufficientQuantity = type === 'SELL' && maxQuantity != null && qty > maxQuantity
  const cannotSubmit = !quantity || qty <= 0 || mutation.isPending || insufficientBalance || insufficientQuantity

  let disableReason = ''
  if (insufficientBalance) disableReason = 'Yetersiz bakiye'
  else if (insufficientQuantity) disableReason = `Maksimum ${Number.isInteger(maxQuantity) ? maxQuantity : maxQuantity?.toFixed(2)} adet`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'BUY' ? t('portfolio.buy') : t('portfolio.sell')} — {ticker}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('portfolio.quantity')}</label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {subtotal != null && subtotal > 0 && (
            <div className="space-y-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Hisse tutarı</span>
                <span className="font-medium">{subtotal.toFixed(2)} TL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Komisyon (%{(COMMISSION_RATE * 100).toFixed(1)})</span>
                <span className="font-medium">{commission!.toFixed(2)} TL</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                <span className="text-muted-foreground font-medium">
                  {type === 'BUY' ? 'Toplam ödenecek' : 'Net alınacak'}
                </span>
                <span className="font-bold">{total!.toFixed(2)} TL</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={type === 'BUY' ? 'gradient' : 'destructive'}
            disabled={cannotSubmit}
            title={disableReason || undefined}
            onClick={() => mutation.mutate()}
          >
            {type === 'BUY' ? t('portfolio.buy') : t('portfolio.sell')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
