import { TrendingDown, TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface QuoteChangeProps {
  change: number | null | undefined
  changeWindow?: string | null
  marketStatus?: string | null
  isStale?: boolean | null
  asOf?: string | null
  compact?: boolean
}

function getBasisLabel(changeWindow?: string | null) {
  if (changeWindow === 'previous_session_close') return 'Önceki seans kapanışına göre değişim'
  if (changeWindow === 'last_session_change') return 'Son tamamlanan seansın kapanış değişimi'
  if (changeWindow === 'selected_period') return 'Seçilen dönemin başlangıcına göre değişim'
  return 'Önceki geçerli fiyata göre değişim'
}

export function QuoteChange({ change, changeWindow, marketStatus, isStale, asOf, compact = false }: QuoteChangeProps) {
  if (change === null || change === undefined) return null

  const updatedAt = asOf
    ? new Date(asOf).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
    : null
  const freshness = isStale ? 'Veri gecikmeli' : 'Veri güncel'
  const status = marketStatus === 'closed' ? 'Piyasa kapalı' : 'Piyasa açık'

  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          className={cn(
            'inline-flex cursor-help items-center gap-0.5 font-semibold',
            compact ? 'text-[10px]' : 'text-sm',
            change >= 0 ? 'text-success' : 'text-destructive',
          )}
        >
          {change >= 0 ? <TrendingUp className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} /> : <TrendingDown className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getBasisLabel(changeWindow)}</p>
        <p>{status} · {freshness}</p>
        {updatedAt && <p>Güncelleme: {updatedAt}</p>}
      </TooltipContent>
    </Tooltip>
  )
}
