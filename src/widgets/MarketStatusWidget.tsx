import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CalendarDays, Moon, TrendingUp } from 'lucide-react'
import { useMarketStatus, formatMarketTime } from '@/hooks/useMarketStatus'

export default function MarketStatusWidget() {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useMarketStatus()

  const nextOpen = formatMarketTime(data?.next_open_at)

  const isHoliday = Boolean(data?.is_holiday)
  const isOpen = Boolean(data?.open && !isHoliday)

  const statusClass = isHoliday
    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
    : isOpen
      ? 'bg-success/10 text-success border-success/30'
      : 'bg-destructive/10 text-destructive border-destructive/30'

  const statusLabel = isHoliday ? t('marketStatus.holiday') : isOpen ? t('marketStatus.open') : t('marketStatus.closed')

  return (
    <Card className="h-full p-5">
      {isLoading ? (
        <div className="flex items-center gap-5">
          <Skeleton className="h-16 w-40" />
          <Skeleton className="h-14 w-44" />
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Sol: büyük durum bloğu */}
          <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 min-w-0', statusClass)}>
            {isHoliday ? (
              <CalendarDays className="h-8 w-8 shrink-0" />
            ) : isOpen ? (
              <TrendingUp className="h-8 w-8 shrink-0" />
            ) : (
              <Moon className="h-8 w-8 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-tight whitespace-nowrap">{statusLabel}</p>
              {isHoliday && data?.holiday_name && (
                <p className="text-xs font-medium truncate max-w-36">{data.holiday_name}</p>
              )}
            </div>
            <span
              className={cn(
                'h-3 w-3 rounded-full shrink-0',
                isHoliday ? 'bg-amber-500' : isOpen ? 'bg-success animate-pulse' : 'bg-destructive/70',
              )}
            />
          </div>

          {/* Sağ: bilgiler */}
          <div className="min-w-0 flex-1 space-y-1">
            {nextOpen && (
              <p className="text-xs text-muted-foreground">
                {t('marketStatus.nextOpen')}:{' '}
                <span className="font-medium text-foreground tabular-nums">{nextOpen}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('marketStatus.timezone')}: {data?.timezone || 'Europe/Istanbul'}
            </p>
            {data?.as_of && (
              <p className="text-[10px] text-muted-foreground/70">
                {t('marketStatus.asOf')}:{' '}
                {new Date(data.as_of).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
