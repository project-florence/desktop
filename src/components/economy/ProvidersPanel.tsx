import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Activity, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { EconomyProviderStatus } from '@/types/api'

function fmtTs(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
}

/** Kanonik providers endpoint'i — veri kaynağı sağlık göstergesi (rapor ⑮). */
export function ProvidersPanel({ title }: { title?: string }) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['economy-providers'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/providers')
      return res.data as EconomyProviderStatus[]
    },
    staleTime: 5 * 60_000,
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title ?? t('economy.providers')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('economy.noData')}</p>
        ) : (
          <div className="space-y-2">
            {data.map((p) => (
              <div key={p.provider} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{t(`economy.providers.${p.provider}`, p.provider)}</span>
                    {p.circuit_open ? (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{t('economy.providerDown')}</Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{t('economy.providerOk')}</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">
                    {t('economy.lastSuccess')}: {fmtTs(p.last_success)} · {t('economy.failures')}: {p.consecutive_failures}
                  </p>
                  {p.last_error_msg && (
                    <p className={cn(
                      'text-[11px] mt-0.5 flex items-center gap-1',
                      p.circuit_open ? 'text-destructive' : 'text-amber-600',
                    )}>
                      <CircleAlert className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p.last_error_msg}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
