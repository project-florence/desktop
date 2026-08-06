import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

export function DateTimeWidget() {
  const [now, setNow] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const today = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1
  const todayHighlight = viewYear === currentYear && viewMonth === currentMonth

  const viewMonthName = new Date(viewYear, viewMonth).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const weekday = now.toLocaleDateString('tr-TR', { weekday: 'long' })

  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else { setViewMonth((m) => m - 1) }
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else { setViewMonth((m) => m + 1) }
  }

  const goToday = () => {
    setViewMonth(currentMonth)
    setViewYear(currentYear)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayIndex; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <Card className="w-full max-w-[260px]">
      <CardContent className="p-4 space-y-3">
        <div className="text-center">
          <p className="text-lg font-semibold capitalize">{weekday}</p>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
          <p className="text-2xl font-bold tabular-nums mt-0.5">{timeStr}</p>
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={prevMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-medium hover:text-primary transition-colors"
            >
              {viewMonthName}
            </button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={nextMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0 text-center">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground py-1">{d}</div>
            ))}
            {cells.map((d, i) => (
              <div key={i} className="py-0.5">
                {d !== null ? (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center h-6 w-6 text-xs rounded-full',
                      todayHighlight && d === today && 'bg-primary text-primary-foreground font-bold',
                      todayHighlight && d === today && 'ring-2 ring-primary/30',
                    )}
                  >
                    {d}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center h-6 w-6 text-xs" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
