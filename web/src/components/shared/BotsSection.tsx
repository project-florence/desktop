import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { Bot as BotIcon, Check, Copy, KeyRound, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/api'
import { translateBackendDetail } from '@/lib/backendErrors'
import type { Bot, BotCreateResponse } from '@/types/api'

type BackendError = AxiosError<{ detail: string | { msg: string }[] }>

/** GET /api/v1/bots hem dizi hem { bots: [...] } sarmalayici donebilir; ikisini de destekle. */
function extractBots(data: unknown): Bot[] {
  if (Array.isArray(data)) return data as Bot[]
  if (data && typeof data === 'object' && Array.isArray((data as { bots?: unknown }).bots)) {
    return (data as { bots: Bot[] }).bots
  }
  return []
}

export function BotsSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: bots, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const res = await api.get('/api/v1/bots')
      return extractBots(res.data)
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: { username: string; password?: string } = { username: username.trim() }
      const trimmedPassword = password.trim()
      if (trimmedPassword) payload.password = trimmedPassword
      const res = await api.post('/api/v1/bots', payload)
      return res.data as BotCreateResponse
    },
    onSuccess: (data) => {
      toast.success(t('bots.createSuccess'))
      setUsername('')
      setPassword('')
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      if (data?.password) {
        setCopied(false)
        setCreatedPassword(data.password)
      }
    },
    onError: (err) => {
      const error = err as BackendError
      const detail = error.response?.data?.detail
      const mapped = translateBackendDetail(t, detail)
      toast.error(mapped || t('bots.createError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (botId: number) => {
      await api.delete(`/api/v1/bots/${botId}`)
    },
    onSuccess: () => {
      toast.success(t('bots.deleted'))
      queryClient.invalidateQueries({ queryKey: ['bots'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const handleDelete = (botId: number, botUsername: string) => {
    if (window.confirm(t('bots.deleteConfirm', { username: botUsername }))) {
      deleteMutation.mutate(botId)
    }
  }

  const handleCopyPassword = async () => {
    if (!createdPassword) return
    try {
      await navigator.clipboard.writeText(createdPassword)
      setCopied(true)
      toast.success(t('bots.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BotIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">{t('bots.title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (username.trim() && !createMutation.isPending) createMutation.mutate()
            }}
          >
            <Input
              placeholder={t('bots.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t('bots.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t('bots.passwordOptional')}</p>
            <Button type="submit" variant="gradient" size="sm" disabled={!username.trim() || createMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {t('bots.create')}
            </Button>
          </form>

          <div className="border-t border-border/40 pt-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !bots?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('bots.empty')}</p>
            ) : (
              <div className="space-y-2">
                {bots.map((bot) => (
                  <div
                    key={bot.id ?? bot.username}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BotIcon className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{bot.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {t('bots.createdAt')}: {new Date(bot.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0 ml-3"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(bot.id, bot.username)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createdPassword !== null} onOpenChange={(open) => !open && setCreatedPassword(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              {t('bots.passwordTitle')}
            </DialogTitle>
            <DialogDescription>{t('bots.passwordOneTime')}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/50 px-3 py-2.5">
            <code className="min-w-0 flex-1 break-all font-mono text-sm">{createdPassword}</code>
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleCopyPassword}>
              {copied ? <Check className="h-3.5 w-3.5 mr-1 text-success" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? t('bots.copied') : t('bots.copy')}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatedPassword(null)}>
              {t('bots.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
