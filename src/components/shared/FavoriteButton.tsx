import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/useFavorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  ticker: string
  className?: string
}

export function FavoriteButton({ ticker, className }: FavoriteButtonProps) {
  const { t } = useTranslation()
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(ticker)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(ticker)
      }}
      className={cn(className)}
    >
      <Star
        className={cn(
          'h-4 w-4 mr-1.5 transition-colors',
          fav ? 'fill-accent text-accent' : 'text-muted-foreground',
        )}
      />
      {fav ? t('favorite.remove') : t('favorite.add')}
    </Button>
  )
}
