import { useTranslation } from 'react-i18next'
import { PALETTE_ITEMS } from '@/types/widget'
import { Button } from '@/components/ui/button'
import { Sparkles, Star, TrendingUp, Globe, Building2, LineChart, FlaskConical, Newspaper, DollarSign, Gem, Activity, Plus } from 'lucide-react'

const ICON_MAP: Record<string, typeof Sparkles> = {
  'sparkles': Sparkles,
  'star': Star,
  'trending-up': TrendingUp,
  'globe': Globe,
  'building-2': Building2,
  'line-chart': LineChart,
  'flask-conical': FlaskConical,
  'newspaper': Newspaper,
  'dollar-sign': DollarSign,
  'gem': Gem,
  'activity': Activity,
}

interface WidgetPaletteProps {
  onAdd: (type: string, config?: Record<string, unknown>) => void
}

export function WidgetPalette({ onAdd }: WidgetPaletteProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1">
      {PALETTE_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon] || Sparkles
        return (
          <Button
            key={item.type}
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs h-8"
            onClick={() => onAdd(item.type, item.defaultConfig)}
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{t(item.labelKey)}</span>
            <Plus className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
          </Button>
        )
      })}
    </div>
  )
}
