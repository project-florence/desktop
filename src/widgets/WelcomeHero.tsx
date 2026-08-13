import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StockSearch } from '@/components/shared/StockSearch'
import { BarChart3, Search, FlaskConical, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMarketStatus } from '@/hooks/useMarketStatus'
import api from '@/lib/api'

function getGreetingEmoji(h: number): string {
  if (h < 6) return '🌙'
  if (h < 12) return '☀️'
  if (h < 18) return '🌤️'
  if (h < 22) return '🌅'
  return '🌙'
}

export default function WelcomeHero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  function getGreeting(): string {
    const h = new Date().getHours()
    if (h >= 6 && h < 12) return t('welcome.morning')
    if (h >= 12 && h < 17) return t('welcome.afternoon')
    if (h >= 17 && h < 22) return t('welcome.evening')
    return t('welcome.night')
  }

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/api/v1/profile')
      return res.data as { username: string; email: string; credits: number }
    },
    staleTime: 5 * 60_000,
  })

  const { data: market } = useMarketStatus()

  const hour = now.getHours()
  const greeting = getGreeting()
  const emoji = getGreetingEmoji(hour)
  const username = profile?.username ?? ''

  return (
    <div className="flex gap-4 items-start flex-col sm:flex-row">
      <Card className="flex-1 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent border-primary/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{emoji}</span>
                <h3 className="text-lg font-semibold">
                  {greeting}{username ? `, ${username}!` : '!'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground shrink-0 pt-1">
              <span className="text-sm tabular-nums">
                {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {market && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 border',
                    market.open
                      ? 'text-success border-success/30 bg-success/10'
                      : 'text-muted-foreground border-border bg-muted/50',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', market.open ? 'bg-success animate-pulse' : 'bg-muted-foreground/60')} />
                  {market.open ? t('market.open') : t('market.closed')}
                </span>
              )}
            </div>
          </div>

          <div className="mb-5 max-w-sm">
            <StockSearch
              onSelect={(ticker) => navigate(`/stocks/${ticker}`)}
              placeholder={t('stocks.search')}
              autoFocus={false}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="gradient" size="sm" onClick={() => navigate('/simulation')}>
              <FlaskConical className="h-4 w-4 mr-1.5" />
              {t('welcome.simulation')}
            </Button>
            <Button variant="gradient" size="sm" onClick={() => navigate('/advisor')}>
              <Search className="h-4 w-4 mr-1.5" />
              {t('welcome.advisor')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/stocks')}>
              <TrendingUp className="h-4 w-4 mr-1.5" />
              {t('welcome.markets')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
              <BarChart3 className="h-4 w-4 mr-1.5" />
              {t('welcome.reports')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
