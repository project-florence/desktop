import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  title: string
  value?: string
  change?: number | null
  loading?: boolean
  sub?: string
  positive?: boolean | null
}

export function StatCard({ title, value, change, loading, sub, positive }: StatCardProps) {
  const showLeftBorder = change !== undefined && change !== null

  return (
    <Card className={cn(
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5',
      showLeftBorder && 'border-l-2',
      showLeftBorder && change! >= 0 && 'border-l-success',
      showLeftBorder && change! < 0 && 'border-l-destructive',
      positive === true && 'border-l-success',
      positive === false && 'border-l-destructive',
    )}>
      {(loading !== undefined) ? (
        <>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">{value || '—'}</p>
            )}
            {change !== undefined && change !== null && (
              <div className={cn(
                'flex items-center gap-1 mt-1 text-xs font-semibold',
                change >= 0 ? 'text-success' : 'text-destructive',
              )}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </div>
            )}
          </CardContent>
        </>
      ) : (
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{title}</p>
          <p className={cn(
            'text-lg font-bold',
            positive === true && 'text-success',
            positive === false && 'text-destructive',
          )}>{value}</p>
          {sub && <p className={cn(
            'text-xs mt-0.5',
            positive === true && 'text-success/80',
            positive === false && 'text-destructive/80',
            positive === undefined && 'text-muted-foreground',
          )}>{sub}</p>}
        </CardContent>
      )}
    </Card>
  )
}
