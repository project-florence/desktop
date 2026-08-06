import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink } from 'lucide-react'
import api from '@/lib/api'

interface Contributor {
  nickname: string
  github_url: string
}

const AVATAR_MAP: Record<string, string> = {
  dethrandir: '/assets/contributors/dethrandir.png',
  Burakkandemir10: '/assets/contributors/burakkandemir10.png',
  canaltngyk: '/assets/contributors/canaltngyk.png',
  burockkkk: '/assets/contributors/burockkkk.png',
}

export function ContributorCard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['contributors'],
    queryFn: async () => {
      const res = await api.get('/api/v1/contributors')
      return res.data.contributors as Contributor[]
    },
    staleTime: 1000 * 60 * 60,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t('about.contributors')}</h2>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data?.length) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t('about.contributors')}</h2>
      <div className="flex flex-wrap gap-4">
        {data.map((c) => (
          <a
            key={c.nickname}
            href={c.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-2.5 transition-colors hover:bg-card hover:border-border/80 group"
          >
            <img
              src={AVATAR_MAP[c.nickname] || c.github_url + '.png'}
              alt={c.nickname}
              className="h-10 w-10 rounded-full"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{c.nickname}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
