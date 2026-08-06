import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { isTauri, desktopNotify } from '@/lib/desktop'
import type { Announcement } from '@/types/api'
import { announcementsResponseSchema, parseApi } from '@/lib/apiSchemas'

export function AnnouncementBell() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Announcement | null>(null)
  const notifiedIds = useRef<Set<number>>(new Set())

  const { data: announcements, isLoading, isError, refetch } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/api/v1/announcements')
       return parseApi(announcementsResponseSchema, res.data).announcements as Announcement[]
    },
    refetchInterval: 60_000,
  })

  const unreadCount = announcements?.filter((a) => a.is_unread).length ?? 0

  useEffect(() => {
    if (!isTauri() || !announcements) return
    const fresh = announcements.filter((a) => a.is_unread && !notifiedIds.current.has(a.id))
    for (const a of fresh.slice(0, 3)) {
      notifiedIds.current.add(a.id)
      void desktopNotify(t('announcement.title'), a.title)
    }
  }, [announcements, t])

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/announcements/read')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  return (
    <>
    <Popover>
      <PopoverTrigger
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={t('announcement.title')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">{t('announcement.title')}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="h-3 w-3 mr-1" />
              )}
              {t('announcement.markAllRead')}
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="space-y-2 p-6 text-center">
              <p className="text-sm text-destructive">Duyurular yüklenemedi.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Tekrar dene</Button>
            </div>
          ) : !announcements?.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t('announcement.noAnnouncements')}
            </p>
          ) : (
            announcements.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className={cn(
                  'w-full text-left px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50',
                  a.is_unread ? 'bg-primary/[0.03]' : '',
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      a.is_unread ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {selected?.content}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
