import { useTranslation } from 'react-i18next'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { CalendarDays, Clock, Newspaper, RotateCw } from 'lucide-react'
import type { Digest, DigestSlot } from '@/types/api'

interface Props {
  data: Digest | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const SLOT_LABEL_KEY: Record<DigestSlot, string> = {
  morning: 'digest.slotMorning',
  noon: 'digest.slotNoon',
  evening: 'digest.slotEvening',
}

export default function DigestCard({ data, isLoading, isError, onRetry }: Props) {
  const { t } = useTranslation()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          {t('digest.title')}
        </CardTitle>
        {data && (
          <CardAction>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {data.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {t(SLOT_LABEL_KEY[data.slot])}
              </span>
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-destructive">{t('digest.error')}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="h-3.5 w-3.5" />
              {t('common.retry')}
            </Button>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-foreground">{t('digest.noContent')}</p>
            <p className="text-xs text-muted-foreground">{t('digest.noContentHint')}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="h-3.5 w-3.5" />
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold">{data.title}</h3>
            <p className="text-sm whitespace-pre-wrap">{data.content}</p>
            {data.sections.map((section, i) => (
              <section key={i} className="space-y-1.5">
                <h4 className="text-sm font-semibold">{section.heading}</h4>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}