import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { init, dispose } from 'klinecharts'
import type { KLineData, Styles, DeepPartial } from 'klinecharts'
import type { PriceHistory } from '@/types/api'
import { useThemeStore } from '@/stores/themeStore'
import { themes } from '@/config/themes'
import { AlertCircle } from 'lucide-react'

interface StockChartProps {
  data: PriceHistory[]
  loading?: boolean
  visibleRange?: { from: number; to: number }
}

function toKLineData(d: PriceHistory): KLineData {
  return {
    timestamp: new Date(d.ts).getTime(),
    open: d.open!,
    high: d.high!,
    low: d.low!,
    close: d.close!,
    volume: d.volume,
  }
}

function buildStyles(charts: typeof themes.florence.charts): DeepPartial<Styles> {
  return {
    grid: {
      show: true,
      horizontal: { show: true, style: 'dashed', size: 1, color: charts.gridColor, dashedValue: [4, 4] },
      vertical: { show: true, style: 'dashed', size: 1, color: charts.gridColor, dashedValue: [4, 4] },
    },
    candle: {
      type: 'candle_solid',
      bar: {
        upColor: charts.upColor,
        downColor: charts.downColor,
        upBorderColor: charts.upColor,
        downBorderColor: charts.downColor,
        upWickColor: charts.upColor,
        downWickColor: charts.downColor,
        noChangeColor: '#666666',
        noChangeBorderColor: '#666666',
        noChangeWickColor: '#666666',
        compareRule: 'previous_close',
      },
      priceMark: {
        show: true,
        high: { show: true, color: charts.textColor, textOffset: 4, textSize: 10, textFamily: 'monospace', textWeight: 'normal' },
        low: { show: true, color: charts.textColor, textOffset: 4, textSize: 10, textFamily: 'monospace', textWeight: 'normal' },
        last: { show: true, upColor: charts.upColor, downColor: charts.downColor, noChangeColor: '#666666', line: { show: true, style: 'dashed', size: 1, dashedValue: [2, 2] }, text: { show: true, color: charts.textColor, size: 10, family: 'monospace', weight: 'normal', paddingLeft: 4, paddingRight: 4, paddingTop: 2, paddingBottom: 2 } },
      },
    },
    xAxis: {
      show: true,
      size: 'auto',
      axisLine: { show: true, color: charts.gridColor, size: 1 },
      tickLine: { show: true, color: charts.gridColor, size: 1, length: 4 },
      tickText: { show: true, color: charts.textColor, size: 10, family: 'monospace', weight: 'normal', marginStart: 4, marginEnd: 4 },
    },
    yAxis: {
      show: true,
      size: 'auto',
      axisLine: { show: true, color: charts.gridColor, size: 1 },
      tickLine: { show: true, color: charts.gridColor, size: 1, length: 4 },
      tickText: { show: true, color: charts.textColor, size: 10, family: 'monospace', weight: 'normal', marginStart: 4, marginEnd: 4 },
    },
    separator: {
      size: 0,
      color: 'transparent',
      fill: false,
      activeBackgroundColor: 'transparent',
    },
    crosshair: {
      show: true,
      horizontal: {
        show: true,
        line: { show: true, style: 'dashed', size: 1, color: charts.crosshairColor, dashedValue: [2, 2] },
        text: { show: true, color: charts.textColor, size: 10, family: 'monospace', weight: 'normal' },
      },
      vertical: {
        show: true,
        line: { show: true, style: 'dashed', size: 1, color: charts.crosshairColor, dashedValue: [2, 2] },
        text: { show: true, color: charts.textColor, size: 10, family: 'monospace', weight: 'normal' },
      },
    },
  }
}

export function StockChart({ data, loading, visibleRange }: StockChartProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof init> | null>(null)
  const hasDataRef = useRef(false)
  const dataRef = useRef(data)
  const visibleRangeRef = useRef(visibleRange)
  const themeName = useThemeStore((s) => s.themeName)
  const activeTheme = themes[themeName] ?? themes.florence

  dataRef.current = data
  visibleRangeRef.current = visibleRange

  useEffect(() => {
    if (!containerRef.current) return

    const chart = init(containerRef.current, {
      styles: buildStyles(activeTheme.charts),
    })
    if (!chart) return

    chart.setSymbol?.({ ticker: '', pricePrecision: 2, volumePrecision: 0 })
    chart.setPeriod?.({ type: 'day', span: 1 })

    chartRef.current = chart

    const handleResize = () => { chart.resize() }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      dispose(chart)
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeName, activeTheme])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.setStyles(buildStyles(activeTheme.charts))
  }, [themeName, activeTheme])

  const visibleFrom = visibleRange?.from
  const visibleTo = visibleRange?.to

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    chart.setDataLoader({
      getBars: (params) => {
        const currentData = dataRef.current
        const vr = visibleRangeRef.current
        let filtered = currentData
        if (vr) {
          filtered = currentData.filter((d) => {
            const ts = new Date(d.ts).getTime()
            return ts >= vr.from && ts <= vr.to
          })
        }
        const valid = filtered.filter((d) => {
          const { open, high, low, close } = d
          return (
            open != null && high != null && low != null && close != null &&
            isFinite(open) && isFinite(high) && isFinite(low) && isFinite(close)
          )
        })
        if (valid.length > 0) {
          hasDataRef.current = true
          params.callback(valid.map(toKLineData), false)
          chart.scrollToRealTime?.(0)
        } else if (!hasDataRef.current) {
          params.callback([], false)
        }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, visibleFrom, visibleTo])

  const hasValidData = data.some((d) => {
    const { open, high, low, close } = d
    return open != null && high != null && low != null && close != null &&
      isFinite(open) && isFinite(high) && isFinite(low) && isFinite(close)
  })
  const isEmpty = !hasValidData
  const neverHadData = !hasDataRef.current

  return (
    <div className="relative" style={{ height: 400 }}>
      <div ref={containerRef} className="w-full h-full rounded-lg" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">{t('chart.loading')}</span>
          </div>
        </div>
      )}
      {!loading && isEmpty && neverHadData && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm">{t('chart.noData')}</span>
          </div>
        </div>
      )}
      {!loading && isEmpty && !neverHadData && (
        <div className="absolute top-2 right-2 z-10">
          <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-500">
            <AlertCircle className="h-3 w-3" />
            Yeni periyot için veri yok, önceki grafik gösteriliyor
          </div>
        </div>
      )}
    </div>
  )
}
