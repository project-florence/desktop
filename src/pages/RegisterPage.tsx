import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Globe, ExternalLink, ArrowLeft } from 'lucide-react'
import { HyperspaceBackground } from '@/components/shared/HyperspaceBackground'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { translateBackendDetail } from '@/lib/backendErrors'
import type { AxiosError } from 'axios'
import florenceLogo from '@/assets/florence_logo.svg'

const POLICIES = ['terms', 'privacy_policy', 'cookie_policy', 'disclaimer'] as const
type Policy = (typeof POLICIES)[number]

const POLICY_LABEL_KEY: Record<Policy, string> = {
  terms: 'legal.terms',
  privacy_policy: 'legal.privacyPolicy',
  cookie_policy: 'legal.cookiePolicy',
  disclaimer: 'legal.disclaimer',
}

interface LegalResponse {
  policy: string
  lang: string
  last_updated: string
  content: string
}

function PolicyViewer({ policy, onClose }: { policy: Policy | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()

  const { data, isLoading, error } = useQuery({
    queryKey: ['legal', policy, i18n.language],
    queryFn: async () => {
      const res = await api.get('/api/v1/legal', { params: { policy, lang: i18n.language } })
      return res.data as LegalResponse
    },
    enabled: !!policy,
  })

  return (
    <Dialog open={!!policy} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{policy ? t(POLICY_LABEL_KEY[policy]) : ''}</DialogTitle>
          {data?.last_updated && (
            <DialogDescription>
              {t('legal.lastUpdated')}: {data.last_updated}
            </DialogDescription>
          )}
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{t('common.error')}</p>
        ) : (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {data?.content}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

type RegisterForm = z.infer<ReturnType<typeof registerSchema>>

function registerSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(3, t('validation.usernameMin')),
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(10, t('validation.passwordMin10')),
  })
}

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [hyperdriveTriggered, setHyperdriveTriggered] = useState(false)
  const credsRef = useRef({ username: '', password: '' })
  const [accepted, setAccepted] = useState<Record<Policy, boolean>>({
    terms: false,
    privacy_policy: false,
    cookie_policy: false,
    disclaimer: false,
  })
  const [viewingPolicy, setViewingPolicy] = useState<Policy | null>(null)

  const allAccepted = Object.values(accepted).every(Boolean)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema(t)),
  })

  const formValues = watch()
  const formFilled = formValues.username?.trim() && formValues.email?.trim() && formValues.password?.trim()

  const onSubmit = async (data: RegisterForm) => {
    if (!allAccepted) {
      toast.error(t('auth.acceptPolicies'))
      return
    }
    setLoading(true)
    try {
      credsRef.current = { username: data.username, password: data.password }
      await api.post('/api/v1/auth/register', data)
      setHyperdriveTriggered(true)
    } catch (err) {
      const error = err as AxiosError<{ detail: string | { msg: string }[] }>
      const detail = error.response?.data?.detail
      const mapped = translateBackendDetail(t, detail)
      const message = mapped || (Array.isArray(detail) ? detail[0]?.msg : detail)
      toast.error(message || t('auth.registerError'))
    } finally {
      setLoading(false)
    }
  }

  const handleHyperdriveComplete = async () => {
    try {
      const formData = new URLSearchParams()
      formData.append('grant_type', 'password')
      formData.append('username', credsRef.current.username)
      formData.append('password', credsRef.current.password)
      await api.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      useAuthStore.getState().setAuthenticated(true)
    } catch {
      navigate('/login', { replace: true })
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
      <HyperspaceBackground
        hyperdriveTriggered={hyperdriveTriggered}
        onHyperdriveComplete={handleHyperdriveComplete}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/10 to-background/30 backdrop-blur-[1px]" />
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>
      </div>
      <div className="relative z-10 w-full max-w-full md:max-w-md animate-fadeIn">
        <Card className="w-full bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl animate-slideUp">
          <CardHeader className="text-center">
            <img src={florenceLogo} alt="Florence" className="mx-auto h-14 w-14 mb-4" />
            <CardTitle className="text-2xl">{t('auth.register')}</CardTitle>
            <CardDescription>{t('app.tagline')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder={t('auth.username')}
                  className="transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-primary/30"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="email"
                  placeholder={t('auth.email')}
                  className="transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-primary/30"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="password"
                  placeholder={t('auth.password')}
                  className="transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-primary/30"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="border-t border-border/40 pt-4 space-y-3">
                {POLICIES.map((policy) => (
                  <label key={policy} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={accepted[policy]}
                      onChange={() => setAccepted((prev) => ({ ...prev, [policy]: !prev[policy] }))}
                      className="mt-0.5 h-4 w-4 accent-primary shrink-0"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      <button
                        type="button"
                        onClick={() => setViewingPolicy(policy)}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {t(POLICY_LABEL_KEY[policy])}
                        <ExternalLink className="h-3 w-3" />
                      </button>{' '}
                      {t('legal.accept')}
                    </span>
                  </label>
                ))}
              </div>

              <Button type="submit" variant="gradient" className="w-full" disabled={loading || hyperdriveTriggered || !allAccepted || !formFilled}>
                {loading ? t('common.loading') : t('auth.register')}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.login')}
              </Link>
            </p>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Select value={i18n.language} onValueChange={(v) => v && i18n.changeLanguage(v)}>
                <SelectTrigger className="w-32">
                  <span>{i18n.language === 'tr' ? 'Türkçe' : 'English'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <PolicyViewer policy={viewingPolicy} onClose={() => setViewingPolicy(null)} />
    </div>
  )
}
