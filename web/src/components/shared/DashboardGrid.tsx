import { useState, useRef, useEffect } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import { WIDGET_MAP, type WidgetComponent } from '@/widgets'
import { WidgetWrapper } from './WidgetWrapper'
import type { WidgetLayout } from '@/types/widget'

interface DashboardGridProps {
  layout: WidgetLayout[]
  editing: boolean
  onLayoutChange?: (layout: WidgetLayout[]) => void
  onDeleteWidget?: (id: string) => void
}

export function DashboardGrid({ layout, editing, onLayoutChange, onDeleteWidget }: DashboardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
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

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: rglLayout, md: rglLayout, sm: rglLayout, xs: rglLayout, xxs: rglLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
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
