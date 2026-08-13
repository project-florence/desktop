import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Globe } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HyperspaceBackground } from '@/components/shared/HyperspaceBackground'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import { isTauri, setTokens } from '@/lib/desktop'
import { translateBackendDetail } from '@/lib/backendErrors'
import { ArrowLeft } from 'lucide-react'
import type { AxiosError } from 'axios'
import florenceLogo from '@/assets/florence_logo.svg'

type LoginForm = z.infer<ReturnType<typeof loginSchema>>

function loginSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(1, t('validation.usernameRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [hyperdriveTriggered, setHyperdriveTriggered] = useState(false)
  const authChecked = useRef(false)
  const isPostLoginRef = useRef(false)

  useEffect(() => {
    if (!authChecked.current) {
      authChecked.current = true
      useAuthStore.getState().checkAuth()
    }
  }, [])

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const authLoading = useAuthStore((s) => s.loading)

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isPostLoginRef.current) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema(t)),
  })

  const formValues = watch()
  const formFilled = formValues.username?.trim() && formValues.password?.trim()

  if ((authLoading || isAuthenticated) && !isPostLoginRef.current) return null

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('grant_type', 'password')
      formData.append('username', data.username)
      formData.append('password', data.password)

      const res = await api.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      if (isTauri()) {
        await setTokens(res.data.access_token, res.data.refresh_token)
      }

      isPostLoginRef.current = true
      useAuthStore.getState().setAuthenticated(true)
      setHyperdriveTriggered(true)
    } catch (err) {
      const error = err as AxiosError<{ detail: string | { msg: string }[] }>
      if (!error.response) {
        toast.error(t('auth.networkError'))
      } else if (error.response.status >= 500) {
        toast.error(t('auth.serverError'))
      } else {
        const detail = error.response.data?.detail
        const mapped = translateBackendDetail(t, detail)
        const message = mapped || (Array.isArray(detail) ? detail[0]?.msg : detail)
        toast.error(message || t('auth.loginError'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHyperdriveComplete = () => {
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-background p-4 overflow-hidden">
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
      <div className="relative z-10 w-full max-w-md animate-fadeIn">
        <Card className="w-full bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl animate-slideUp">
          <CardHeader className="text-center">
            <img src={florenceLogo} alt="Florence" className="mx-auto h-14 w-14 mb-4" />
            <CardTitle className="text-2xl">{t('app.name')}</CardTitle>
            <CardDescription>{t('app.tagline')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder={t('auth.usernameOrEmail')}
                  className="transition-all duration-200 focus-visible:ring-[3px] focus-visible:ring-primary/30"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
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
              <Button type="submit" variant="gradient" className="w-full" disabled={loading || hyperdriveTriggered || !formFilled}>
                {loading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline">
                {t('auth.register')}
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
    </div>
  )
}
