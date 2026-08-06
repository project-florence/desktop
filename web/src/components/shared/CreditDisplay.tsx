import { Coins } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { cn } from '@/lib/utils'

export function CreditDisplay({
  size = 'sm',
}: {
  size?: 'sm' | 'lg'
}) {
  const { balance } = useCredits()

  if (size === 'lg') {
    return (
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Coins className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Kredi</p>
          <p className="text-2xl font-bold text-amber-500">
            {balance !== undefined ? balance.toFixed(2) : '—'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm')}>
      <Coins className={cn('text-amber-500 shrink-0', 'h-4 w-4')} />
      <span className="font-mono font-semibold text-amber-500">
        {balance !== undefined ? balance.toFixed(2) : '—'}
      </span>
    </div>
  )
}
