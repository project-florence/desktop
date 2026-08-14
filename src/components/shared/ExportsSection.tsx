import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, FileDown, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createExport, listExports } from '@/lib/exportsApi'
import type { ExportRecord, ExportStatus } from '@/types/api'

const MIN_YEAR = 1990

const STATUS_META: Record<
  ExportStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  queued: { label: 'exports.queued', variant: 'secondary' },
  processing: { label: 'exports.processing', variant: 'outline' },
  ready: { label: 'exports.ready', variant: 'default' },
  sent: { label: 'exports.sent', variant: 'secondary' },
  failed: { label: 'exports.failed', variant: 'destructive' },
}

/** Backend şemasına göre token veya download_url alanından indirme linkini çözer. */
function resolveDownloadUrl(record: ExportRecord): string | null {
  if (record.download_url) return record.download_url
  if (record.token) return `/api/v1/data/export/download/${record.token}`
  return null
}

export function ExportsSection() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(String(currentYear - 1))
  const [format, setFormat] = useState<'csv' | 'json'>('csv')

  const yearNum = Number(year)
  const yearValid = Number.isInteger(yearNum) && yearNum >= MIN_YEAR && yearNum <= currentYear

  const { data: records, isLoading } = useQuery({
    queryKey: ['data-exports'],
    queryFn: listExports,
    refetchInterval: (query) => {
      const data = query.state.data as ExportRecord[] | undefined
      const active = data?.some((r) => r.status === 'queued' || r.status === 'processing')
      return active ? 10_000 : 0
    },
  })

  const createMutation = useMutation({
    mutationFn: () => createExport(yearNum, format),
    onSuccess: () => {
      toast.success(t('exports.requestReceived'))
      setYear(String(currentYear - 1))
      queryClient.invalidateQueries({ queryKey: ['data-exports'] })
    },
    onError: () => toast.error(t('exports.error')),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileDown className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('exports.create')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (yearValid && !createMutation.isPending) createMutation.mutate()
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="export-year" className="text-xs font-medium text-muted-foreground">
                  {t('exports.year')}
                </label>
                <Input
                  id="export-year"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={currentYear}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={String(currentYear - 1)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('exports.format')}</label>
                <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">{t('exports.csv')}</SelectItem>
                    <SelectItem value="json">{t('exports.json')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" variant="gradient" size="sm" disabled={!yearValid || createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {t('exports.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('exports.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !records?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('exports.empty')}</p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => {
                const status = STATUS_META[record.status] ?? STATUS_META.failed
                const resolvedUrl = resolveDownloadUrl(record)
                // Tolerans: downloadable alanı gelmezse bile URL çözülebiliyorsa butonu göster;
                // yalnızca açıkça false ise gizle.
                const downloadHref = record.downloadable !== false ? resolvedUrl : null
                return (
                  <div key={String(record.id)} className="rounded-lg border border-border/40 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold">{record.year}</span>
                        <Badge variant="outline">{record.format.toUpperCase()}</Badge>
                        <Badge variant={status.variant}>{t(status.label)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {t('exports.created')}:{' '}
                          {new Date(record.created_at).toLocaleString(i18n.language, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      {downloadHref && (
                        <a
                          href={downloadHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="outline" size="sm">
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            {t('exports.download')}
                          </Button>
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {record.size_bytes != null && (
                        <span>
                          {t('exports.size')}: {(record.size_bytes / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      )}
                      {record.row_count != null && (
                        <span>
                          {t('exports.rows')}: {record.row_count.toLocaleString(i18n.language)}
                        </span>
                      )}
                      {record.downloaded_count != null && (
                        <span>
                          {t('exports.downloads')}: {record.downloaded_count.toLocaleString(i18n.language)}
                        </span>
                      )}
                    </div>
                    {record.status === 'failed' && record.error && (
                      <p className="mt-2 text-xs text-destructive">{record.error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
