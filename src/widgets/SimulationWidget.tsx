import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FlaskConical } from 'lucide-react'
import api from '@/lib/api'
import type { SimulationResponse } from '@/types/api'

export default function SimulationWidget({ config }: { config?: Record<string, unknown> }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ticker = (config?.ticker as string) || 'THYAO'
  const days = (config?.days as number) || 30

  const { data, isLoading } = useQuery({
    queryKey: ['simulation-widget', ticker, days],
    queryFn: async () => {
      const res = await api.get(`/api/v1/simulations/${ticker}`, {
        params: { days, bounds: '1sigma' },
      })
      return res.data as SimulationResponse
    },
    enabled: !!ticker,
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            {t('simulation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-16 w-full" /></CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="h-full cursor-pointer" onClick={() => navigate(`/simulation`)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            {t('simulation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{t('common.noData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200" onClick={() => navigate('/simulation')}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          {t('simulation.title')} — {ticker}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Yukarı Olasılık</span>
            <span className="font-bold text-success">%{(data.prob_above * 100).toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Aşağı Olasılık</span>
            <span className="font-bold text-destructive">%{(data.prob_below * 100).toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Güven Aralığı</span>
            <span className="font-medium">{data.confidence.min.toFixed(0)} — {data.confidence.max.toFixed(0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
