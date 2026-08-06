import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TriangleAlert } from 'lucide-react'
import type { Recommendation } from '@/types/api'

const segments = [
  { key: 'strongSell', label: 'Kuv. Sat', bg: 'bg-destructive' },
  { key: 'sell', label: 'Sat', bg: 'bg-orange-500' },
  { key: 'hold', label: 'Tut', bg: 'bg-muted-foreground' },
  { key: 'buy', label: 'Al', bg: 'bg-emerald-500' },
  { key: 'strongBuy', label: 'Kuv. Al', bg: 'bg-green-600' },
] as const

export function RecommendationsGauge({ data }: { data: Recommendation }) {
  const { t } = useTranslation()

  const total = data.strongBuy + data.buy + data.hold + data.sell + data.strongSell
  if (total === 0) return null

  return (
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
                <p className="text-xs font-semibold">{val}</p>
                <p className="text-[10px] text-muted-foreground">{seg.label}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
