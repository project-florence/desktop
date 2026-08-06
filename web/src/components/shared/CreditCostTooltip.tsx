import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Coins } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'

export function CreditCostTooltip({
  cost,
  children,
}: {
  cost: number
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const { balance } = useCredits()

  return (
    <Tooltip>
      <TooltipTrigger>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex items-center gap-1.5 text-xs">
          <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          {cost > 0 ? `${cost.toFixed(3)} 🪙 ${t('tooltip.costDesc')}` : '🪙 —'} · {t('tooltip.remaining')} {balance !== undefined ? balance.toFixed(2) : '—'}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
