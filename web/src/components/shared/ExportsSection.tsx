import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FileDown, Plus } from 'lucide-react'
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

const NOTIFIED_KEY = 'florence.export.notified'

/** "Dosyanız gönderildi" toast'ının her kayıt için yalnızca bir kez gösterilmesini sağlar. */
function loadNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
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

  // Sent'e geçişte tek seferlik bildirim; queued/processing geçişleri sessizdir.
  const prevStatuses = useRef<Record<string, ExportStatus> | null>(null)
  const notified = useRef<Set<string>>(loadNotified())
  useEffect(() => {
    if (!records) return
    const prev = prevStatuses.current
    prevStatuses.current = Object.fromEntries(records.map((r) => [String(r.id), r.status]))
    for (const record of records) {
      const id = String(record.id)
      if (record.status === 'sent' && prev && prev[id] !== 'sent' && !notified.current.has(id)) {
        notified.current.add(id)
        try {
          localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified.current]))
        } catch {
          // localStorage dolu/erişilemezse sessizce geç
        }
        toast.success(t('exports.readyNote'))
      }
    }
  }, [records, t])

  // Teknik hata detayı yalnızca konsola; UI'da asla gösterilmez.
  const failedLogged = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const record of records ?? []) {
      const id = String(record.id)
      if (record.status === 'failed' && record.error && !failedLogged.current.has(id)) {
        failedLogged.current.add(id)
        console.error('Export failed:', id, record.error)
      }
    }
  }, [records])

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
                const noteKey =
                  record.status === 'ready' || record.status === 'sent'
                    ? 'exports.readyNote'
                    : record.status === 'queued' || record.status === 'processing'
                      ? 'exports.pendingNote'
                      : null
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
                      {noteKey && (
                        <span className="text-xs text-muted-foreground shrink-0 text-right">{t(noteKey)}</span>
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
                    </div>
                    {record.status === 'failed' && (
                      <p className="mt-2 text-xs text-destructive">{t('exports.failedGeneric')}</p>
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
