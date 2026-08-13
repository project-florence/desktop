import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LogOut, User, Key, Download, Trash2, ArrowLeft, Settings, Palette, Globe, Megaphone, Plus, Pencil, Trash, PackageOpen } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { themes } from '@/config/themes'
import type { ThemeName } from '@/config/themes'
import { usePreferences } from '@/hooks/usePreferences'
import { usePageTitle } from '@/hooks/usePageTitle'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Profile, Announcement } from '@/types/api'
import { CreditDisplay } from '@/components/shared/CreditDisplay'
import { DownloadsContent } from '@/components/shared/DownloadsContent'

export default function ProfilePage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('profile.title'))
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const themeName = useThemeStore((s) => s.themeName)
  const applyTheme = useThemeStore((s) => s.applyTheme)
  const { save: savePrefs } = usePreferences()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/api/v1/profile')
      return res.data as Profile
    },
  })

  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')

  const [curPassword, setCurPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const usernameMutation = useMutation({
    mutationFn: async () => {
      await api.put('/api/v1/auth/change-username', {
        new_username: newUsername,
        current_password: usernamePassword,
      })
    },
    onSuccess: () => {
      toast.success(t('profile.usernameChanged'))
      setNewUsername('')
      setUsernamePassword('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const emailMutation = useMutation({
    mutationFn: async () => {
      await api.put('/api/v1/auth/change-email', {
        new_email: newEmail,
        current_password: emailPassword,
      })
    },
    onSuccess: () => {
      toast.success(t('profile.emailChanged'))
      setNewEmail('')
      setEmailPassword('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      await api.put('/api/v1/auth/change-password', {
        current_password: curPassword,
        new_password: newPassword,
      })
    },
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'))
      setCurPassword('')
      setNewPassword('')
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/api/v1/auth/delete', {
        data: { current_password: deletePassword },
        headers: { 'Content-Type': 'application/json' },
      })
    },
    onSuccess: () => {
      toast.success(t('profile.accountDeleted'))
      logout()
      queryClient.clear()
      navigate('/login', { replace: true })
    },
    onError: () => toast.error(t('common.error')),
  })

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full max-w-md" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Geri
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{profile?.username}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.created_at && (
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  {t('profile.registered')}: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              )}
              <span className={cn(
                'inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                profile?.user_type === 'admin'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border/40',
              )}>
                {profile?.user_type === 'admin' ? t('profile.admin') : t('profile.user')}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5">
          <CardContent className="p-5">
            <CreditDisplay size="lg" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="w-full">
          <TabsTrigger value="account" className="flex-1">
            <User className="h-4 w-4 mr-2" />
            {t('profile.account')}
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1">
            <Key className="h-4 w-4 mr-2" />
            {t('profile.security')}
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            {t('profile.data')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            {t('profile.settings')}
          </TabsTrigger>
          <TabsTrigger value="downloads" className="flex-1">
            <PackageOpen className="h-4 w-4 mr-2" />
            {t('downloads.pageTitle')}
          </TabsTrigger>
          {profile?.user_type === 'admin' && (
            <TabsTrigger value="admin" className="flex-1">
              <Megaphone className="h-4 w-4 mr-2" />
              {t('announcement.manage')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('profile.username')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={profile?.username || t('profile.username')}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder={t('profile.currentPassword')}
                value={usernamePassword}
                onChange={(e) => setUsernamePassword(e.target.value)}
              />
              <Button
                variant="gradient"
                size="sm"
                disabled={!newUsername || !usernamePassword || usernameMutation.isPending}
                onClick={() => usernameMutation.mutate()}
              >
                {t('profile.saveUsername')}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('profile.email')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="email"
                placeholder={profile?.email || t('profile.email')}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder={t('profile.currentPassword')}
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
              />
              <Button
                variant="gradient"
                size="sm"
                disabled={!newEmail || !emailPassword || emailMutation.isPending}
                onClick={() => emailMutation.mutate()}
              >
                {t('profile.saveEmail')}
              </Button>
            </CardContent>
          </Card>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all duration-200"
              onClick={() => {
                logout()
                queryClient.clear()
                navigate('/login', { replace: true })
              }}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              {t('nav.logout')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('profile.changePassword')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="password"
                placeholder={t('profile.currentPassword')}
                value={curPassword}
                onChange={(e) => setCurPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder={t('profile.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                variant="gradient"
                disabled={!curPassword || !newPassword || passwordMutation.isPending}
                onClick={() => passwordMutation.mutate()}
              >
                {t('profile.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('profile.exportData')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('profile.exportDesc')}</p>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await api.get('/api/v1/user/export')
                    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `florence-export-${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    toast.error(t('common.error'))
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('profile.exportData')}
              </Button>
            </CardContent>
          </Card>
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm text-destructive">{t('profile.deleteAccount')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('profile.deleteDesc')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('profile.deleteAccount')}
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('profile.deleteAccount')}</DialogTitle>
                    <DialogDescription>
                      {t('profile.confirmDelete')}
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    type="password"
                    placeholder={t('profile.currentPassword')}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!deletePassword || deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      {t('profile.deleteAccount')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Tema</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(themes).map(([key, theme]) => {
                  const isActive = themeName === key
                  return (
                    <Card
                      key={key}
                      onClick={() => {
                        applyTheme(key as ThemeName)
                        savePrefs({ theme: key } as Record<string, unknown>)
                      }}
                      className={`cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-(--shadow-pop) ${
                        isActive ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-1.5 mb-2">
                          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.preview.primary }} />
                          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.preview.success }} />
                          <div className="h-5 w-5 rounded-full" style={{ backgroundColor: theme.preview.background, border: '1px solid ' + theme.preview.border }} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{theme.name}</p>
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {theme.mode === 'dark' ? 'Koyu' : 'Açık'}
                          </span>
                        </div>
                        {isActive && (
                          <p className="text-xs text-primary mt-1">Aktif</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{t('profile.language')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select value={i18n.language} onValueChange={(v) => {
                if (!v) return
                i18n.changeLanguage(v)
                savePrefs({ language: v } as Record<string, unknown>)
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="mt-4">
          <DownloadsContent />
        </TabsContent>
        {profile?.user_type === 'admin' && (
          <TabsContent value="admin" className="mt-4 space-y-4">
            <AdminAnnouncements />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function AdminAnnouncements() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await api.get('/api/v1/announcements')
      return (res.data as { announcements: Announcement[] }).announcements
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/v1/announcements', { title: formTitle, content: formContent })
    },
    onSuccess: () => {
      toast.success(t('common.success'))
      setDialogOpen(false)
      setFormTitle('')
      setFormContent('')
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editItem) return
      await api.put(`/api/v1/announcements/${editItem.id}`, { title: formTitle, content: formContent })
    },
    onSuccess: () => {
      toast.success(t('common.success'))
      setDialogOpen(false)
      setEditItem(null)
      setFormTitle('')
      setFormContent('')
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteId) return
      await api.delete(`/api/v1/announcements/${deleteId}`)
    },
    onSuccess: () => {
      toast.success(t('common.success'))
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const openCreate = () => {
    setEditItem(null)
    setFormTitle('')
    setFormContent('')
    setDialogOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditItem(a)
    setFormTitle(a.title)
    setFormContent(a.content)
    setDialogOpen(true)
  }

  const confirmDelete = (id: number) => {
    if (deleteId === id) {
      deleteMutation.mutate()
    } else {
      setDeleteId(id)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{t('announcement.manage')}</CardTitle>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('announcement.create')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !announcements?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('announcement.empty')}
            </p>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      {a.is_unread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(a.created_at).toLocaleDateString()} &middot; {a.sent_by}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('h-8 w-8 p-0', deleteId === a.id ? 'text-destructive' : 'text-muted-foreground hover:text-destructive')}
                      onClick={() => confirmDelete(a.id)}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? t('announcement.editTitle') : t('announcement.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t('announcement.formTitle')}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <Textarea
              placeholder={t('announcement.formContent')}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="gradient"
              disabled={!formTitle || !formContent || createMutation.isPending || updateMutation.isPending}
              onClick={() => editItem ? updateMutation.mutate() : createMutation.mutate()}
            >
              {editItem ? t('announcement.update') : t('announcement.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
