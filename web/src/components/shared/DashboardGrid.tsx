import { useState, useRef, useEffect } from 'react'
import { ResponsiveGridLayout, type LayoutItem } from 'react-grid-layout'
import { WIDGET_MAP, type WidgetComponent } from '@/widgets'
import { WidgetWrapper } from './WidgetWrapper'
import type { WidgetLayout } from '@/types/widget'

// react-grid-layout responsive layout tipi: { [breakpoint: string]: LayoutItem[] }
type RGLayouts = Record<string, readonly LayoutItem[]>

interface DashboardGridProps {
  layout: WidgetLayout[]
  editing: boolean
  onLayoutChange?: (layout: WidgetLayout[]) => void
  onDeleteWidget?: (id: string) => void
}

export const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
export const GRID_COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }

/**
 * Widget'ları breakpoint'in kolon sayısına sığdırır.
 *
 * react-grid-layout'ın `correctBounds`'i yalnızca `x` konumunu düzeltir, `w`
 * genişliğini ASLA kırpmaz. Tek `lg` layout'u küçük breakpoint'lerde (sm 6 /
 * xs 4 / xxs 2 kolon) kullanıldığında `w > cols` olan widget'lar (ör. w:12
 * welcome/macro, w:6 market) tam genişlikte çizilir ve sayfayı yatay taşırır.
 * Bu yüzden her breakpoint için kırpılmış ayrı layout üretilir.
 */
function clampToCols(layout: WidgetLayout[], cols: number): LayoutItem[] {
  return layout.map((item) => {
    const w = Math.min(item.w, cols)
    return { i: item.id, x: Math.min(item.x, cols - w), y: item.y, w, h: item.h, minW: 2, minH: 1 }
  })
}

export function DashboardGrid({ layout, editing, onLayoutChange, onDeleteWidget }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setContainerWidth(el.offsetWidth)
    update()
    // ResizeObserver: pencere boyutu yanında kenar çubuğu aç/kapa, font
    // yüklenmesi gibi konteyner genişliğini değiştiren her durumu yakalar.
    // Eski yalnızca `window.resize` dinleyicisi kenar çubuğu genişliği
    // değişince bayat (büyük) genişlik bırakıp grid'in taşmasına yol açıyordu.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [])

  const rglLayout = layout.map((item) => ({
    i: item.id,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: 2,
    minH: 1,
  }))

  // Her breakpoint için kırpılmış layout: mobilde geniş widget'ların
  // konteyneri yatay taşırmasını engeller.
  const responsiveLayouts: RGLayouts = {
    lg: rglLayout,
    md: clampToCols(layout, GRID_COLS.md),
    sm: clampToCols(layout, GRID_COLS.sm),
    xs: clampToCols(layout, GRID_COLS.xs),
    xxs: clampToCols(layout, GRID_COLS.xxs),
  }

  return (
    <div ref={containerRef} className="overflow-x-hidden">
      <ResponsiveGridLayout
        className="layout"
        layouts={responsiveLayouts}
        breakpoints={GRID_BREAKPOINTS}
        cols={GRID_COLS}
        rowHeight={60}
        width={containerWidth}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        dragConfig={{ enabled: editing, handle: '.widget-drag-handle' }}
        resizeConfig={{ enabled: editing }}
        onLayoutChange={(newLayout) => {
          if (!editing || !onLayoutChange) return
          const merged = newLayout.map((item) => {
            const original = layout.find((l) => l.id === item.i)
            return {
              id: item.i,
              type: original?.type ?? '',
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
              config: original?.config,
            }
          })
          onLayoutChange(merged)
        }}
      >
        {layout.map((item) => {
          const Widget = WIDGET_MAP[item.type] as WidgetComponent | undefined
          if (!Widget) return <div key={item.id} />
          return (
            <div key={item.id}>
              <WidgetWrapper
                editing={editing}
                onDelete={() => onDeleteWidget?.(item.id)}
              >
                <Widget config={item.config} />
              </WidgetWrapper>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
