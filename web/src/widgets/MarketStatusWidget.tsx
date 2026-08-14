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

  const statusLabel = isHoliday
    ? data?.holiday_name
      ? t('marketStatus.holidayWithName', { name: data.holiday_name })
      : t('marketStatus.holiday')
    : isOpen
      ? t('marketStatus.open')
      : t('marketStatus.closed')

  return (
    <Card className="h-full p-5 overflow-hidden">
      {isLoading ? (
        <div className="flex h-full flex-col justify-center gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <div className="flex h-full flex-col gap-4">
          {/* Büyük, net durum bloğu */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 md:gap-4 md:px-5 md:py-4 min-w-0',
              statusClass,
            )}
          >
            <div
              className={cn(
                'h-11 w-11 shrink-0 rounded-lg flex items-center justify-center',
                isHoliday
                  ? 'bg-amber-500/15'
                  : isOpen
                    ? 'bg-success/15'
                    : 'bg-destructive/15',
              )}
            >
              {isHoliday ? (
                <CalendarDays className="h-6 w-6" />
              ) : isOpen ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <Moon className="h-6 w-6" />
              )}
            </div>
            <p className="min-w-0 flex-1 text-xl md:text-2xl font-extrabold leading-snug">
              {statusLabel}
            </p>
            <span
              className={cn(
                'h-3.5 w-3.5 shrink-0 rounded-full',
                isHoliday
                  ? 'bg-amber-500'
                  : isOpen
                    ? 'bg-success animate-pulse'
                    : 'bg-destructive/70',
              )}
            />
          </div>

          {/* Bilgiler */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {nextOpen && (
              <p className="text-xs md:text-sm text-muted-foreground">
                {t('marketStatus.nextOpen')}:{' '}
                <span className="font-semibold text-foreground tabular-nums">{nextOpen}</span>
              </p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground">
              {t('marketStatus.timezone')}: {data?.timezone || 'Europe/Istanbul'}
            </p>
            {data?.as_of && (
              <p className="text-[10px] md:text-xs text-muted-foreground/70">
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
