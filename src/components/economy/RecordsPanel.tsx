import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import api from '@/lib/api'
import type { EconomyRecord } from '@/types/api'

function fmt(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Kanonik records endpoint'i — sembol bazında rekor tablosu (rapor ⑮). */
export function RecordsPanel({
  symbols,
  title,
}: {
  symbols: string[]
  title?: string
}) {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['economy-records'],
    queryFn: async () => {
      const res = await api.get('/api/v1/economy/records')
      return res.data as Record<string, EconomyRecord>
    },
    staleTime: 5 * 60_000,
  })

  const rows = useMemo(
    () =>
      symbols
        .map((sym) => data?.[sym])
        .filter((r): r is EconomyRecord =>
          !!r && (r.last_close != null || r.high_52w != null || r.low_52w != null || r.all_time_high != null),
        ),
    [data, symbols],
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title ?? t('economy.records')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t('economy.noData')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('economy.symbol')}</TableHead>
                <TableHead className="text-right">{t('economy.lastClose')}</TableHead>
                <TableHead className="text-right">{t('economy.high52w')}</TableHead>
                <TableHead className="text-right">{t('economy.low52w')}</TableHead>
                <TableHead className="text-right">{t('economy.allTimeHigh')}</TableHead>
                <TableHead className="text-right">{t('economy.rank52w')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.symbol}>
                  <TableCell className="font-mono text-xs">{r.symbol}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(r.last_close)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(r.high_52w)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(r.low_52w)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmt(r.all_time_high)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.rank_in_52w != null ? `%${(r.rank_in_52w * 100).toFixed(0)}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
