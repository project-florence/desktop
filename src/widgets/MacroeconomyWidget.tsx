import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface MacroeconomyData {
  usa_gdp: number
  usa_real_gdp: number
  fed_funds_rate: number
  usa_unrate: number
  usa_consumer_cpi: number
  usa_10y_treasury: number
  brent_crude_oil_price: number
  wti_crude_oil_price: number
  dxy: number
  vix: number
  sp500: number
  nasdaq: number
  bitcoin: number
}

function MacroItem({ label, value, loading, format }: {
  label: string
  value?: number | null
  loading: boolean
  format?: 'trillions' | 'percent' | 'price' | 'index' | 'bitcoin'
}) {
  const formatted = (() => {
    if (value === undefined || value === null) return '—'
    switch (format) {
      case 'trillions':
        return `$${(value / 1000).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`
      case 'percent':
        return `%${value.toFixed(2)}`
      case 'price':
        return `$${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'bitcoin':
        return `$${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'index':
      default:
        return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  })()

  return (
    <div>
      {loading ? (
        <Skeleton className="h-4 w-16 mb-1" />
      ) : (
        <p className="text-xs text-muted-foreground">{label}</p>
      )}
      {loading ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <p className="text-sm font-semibold tabular-nums">{formatted}</p>
      )}
    </div>
  )
}

export default function MacroeconomyWidget() {
  const { t } = useTranslation()

  // Backend 0.6.0: FRED key yoksa 500 yerine 404 "Veri yok" döner — bu bir
  // hata durumudur, otomatik retry gereksizdir; kullanıcıya açık UI + retry ver.
  const { data: macro, isLoading: macroLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['macroeconomy'],
    queryFn: async () => {
      const res = await api.get('/api/v1/macroeconomy')
      return res.data as MacroeconomyData
    },
    staleTime: 60_000,
    retry: false,
  })

  return (
    <Card className="hover:border-primary/20 transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-sm">{t('dashboard.macroeconomy')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('economy.macroeconomyNoData')}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MacroItem label={t('dashboard.usaGdp')} value={macro?.usa_gdp} loading={macroLoading} format="trillions" />
            <MacroItem label={t('dashboard.usaRealGdp')} value={macro?.usa_real_gdp} loading={macroLoading} format="trillions" />
            <MacroItem label={t('dashboard.usaFedFundsRate')} value={macro?.fed_funds_rate} loading={macroLoading} format="percent" />
            <MacroItem label={t('dashboard.usaUnemployment')} value={macro?.usa_unrate} loading={macroLoading} format="percent" />
            <MacroItem label={t('dashboard.usaCpi')} value={macro?.usa_consumer_cpi} loading={macroLoading} format="index" />
            <MacroItem label={t('dashboard.usaTenYearTreasury')} value={macro?.usa_10y_treasury} loading={macroLoading} format="percent" />
            <MacroItem label={t('dashboard.brentOil')} value={macro?.brent_crude_oil_price} loading={macroLoading} format="price" />
            <MacroItem label={t('dashboard.wtiOil')} value={macro?.wti_crude_oil_price} loading={macroLoading} format="price" />
            <MacroItem label={t('dashboard.dxy')} value={macro?.dxy} loading={macroLoading} format="index" />
            <MacroItem label={t('dashboard.vix')} value={macro?.vix} loading={macroLoading} format="index" />
            <MacroItem label={t('dashboard.usaSp500')} value={macro?.sp500} loading={macroLoading} format="index" />
            <MacroItem label={t('dashboard.usaNasdaq')} value={macro?.nasdaq} loading={macroLoading} format="index" />
            <MacroItem label={t('dashboard.bitcoin')} value={macro?.bitcoin} loading={macroLoading} format="bitcoin" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
