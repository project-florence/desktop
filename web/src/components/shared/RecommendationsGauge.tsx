import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TriangleAlert, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/types/api'

const segments = [
  { key: 'strongSell', label: 'Kuv. Sat', bg: 'bg-destructive' },
  { key: 'sell', label: 'Sat', bg: 'bg-orange-500' },
  { key: 'hold', label: 'Tut', bg: 'bg-muted-foreground' },
  { key: 'buy', label: 'Al', bg: 'bg-emerald-500' },
  { key: 'strongBuy', label: 'Kuv. Al', bg: 'bg-green-600' },
] as const

interface RecommendationsGaugeProps {
  data: Recommendation
  targetMean?: number | null
  targetLow?: number | null
  targetHigh?: number | null
  currentPrice?: number | null
  analystCount?: number | null
}

function fmtCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return `₺${n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RecommendationsGauge({
  data,
  targetMean,
  targetLow,
  targetHigh,
  currentPrice,
  analystCount,
}: RecommendationsGaugeProps) {
  const { t } = useTranslation()

  const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell
  if (total === 0) return null

  const hasTarget = targetMean != null || targetLow != null || targetHigh != null
  const potential = targetMean != null && currentPrice != null && currentPrice > 0
    ? ((targetMean - currentPrice) / currentPrice) * 100
    : null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium">{t('advisorNote')}</span>
            <Tooltip>
              <TooltipTrigger>
                <TriangleAlert className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {t('common.disclaimer')}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="h-2 rounded-full overflow-hidden flex">
            {segments.map((seg) => {
              const val = data[seg.key as keyof Recommendation] as number
              const pct = (val / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={seg.key}
                  className={seg.bg}
                  style={{ width: `${pct}%` }}
                />
              )
            })}
          </div>

          <div className="flex mt-2">
            {segments.map((seg) => {
              const val = data[seg.key as keyof Recommendation] as number
              return (
                <div key={seg.key} className="flex-1 text-center">
                  <p className="text-xs font-semibold">{Math.round((val / total) * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">{seg.label}</p>
                </div>
              )
            })}
          </div>

          {analystCount != null && analystCount > 0 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {t('stockDetail.analystCount', { count: analystCount })}
            </p>
          )}
        </CardContent>
      </Card>

      {hasTarget && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('stockDetail.targetPrice')}</span>
            </div>

            <p className="text-2xl font-bold">{fmtCurrency(targetMean)}</p>

            {(targetLow != null || targetHigh != null) && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('stockDetail.targetRange')}: {fmtCurrency(targetLow)} – {fmtCurrency(targetHigh)}
              </p>
            )}

            {potential != null && (
              <p className={cn('text-sm font-semibold mt-2', potential >= 0 ? 'text-success' : 'text-destructive')}>
                {t('stockDetail.potential')}: {potential >= 0 ? '+' : ''}{potential.toFixed(2)}%
              </p>
            )}

            {currentPrice != null && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {t('stockDetail.price')}: {fmtCurrency(currentPrice)}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
