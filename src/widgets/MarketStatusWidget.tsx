import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMarketStatus, formatMarketTime } from '@/hooks/useMarketStatus'

export default function MarketStatusWidget() {
  const { t } = useTranslation()
  const { data, isLoading } = useMarketStatus()

  const nextOpen = formatMarketTime(data?.next_open_at)

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-2">{t('market.title')}</p>
        {isLoading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                className={cn(
                  'gap-1',
                  data?.open
                    ? 'bg-success/15 text-success border-success/30'
                    : 'bg-muted text-muted-foreground border-border',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', data?.open ? 'bg-success animate-pulse' : 'bg-muted-foreground/60')} />
                {data?.open ? t('market.open') : t('market.closed')}
              </Badge>
              {data?.is_holiday && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-amber-600 border-amber-500/40">
                  {t('market.holiday')}
                </Badge>
              )}
            </div>
            {data?.holiday_name && (
              <p className="text-xs text-muted-foreground mt-1.5 truncate">{data.holiday_name}</p>
            )}
            {nextOpen && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('market.nextOpen')}: <span className="font-medium text-foreground tabular-nums">{nextOpen}</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {t('market.timezone')}: {data?.timezone || 'Europe/Istanbul'}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
