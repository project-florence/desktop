import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Download, Monitor, Laptop, Terminal, PackageOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface DownloadManifest {
  version: string
  files: string[]
}

interface PlatformDef {
  id: string
  labelKey: string
  icon: typeof Monitor
  match: (file: string) => boolean
}

const PLATFORMS: PlatformDef[] = [
  {
    id: 'windows',
    labelKey: 'downloads.platformWindows',
    icon: Monitor,
    match: (f) => f.endsWith('.exe') || f.endsWith('.msi'),
  },
  {
    id: 'macos',
    labelKey: 'downloads.platformMacos',
    icon: Laptop,
    match: (f) => f.endsWith('.dmg') || f.endsWith('.tar.gz'),
  },
  {
    id: 'linux',
    labelKey: 'downloads.platformLinux',
    icon: Terminal,
    match: (f) => f.endsWith('.AppImage') || f.endsWith('.deb') || f.endsWith('.rpm'),
  },
]

export function DownloadsContent() {
  const { t } = useTranslation()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['downloads-manifest'],
    queryFn: async () => {
      const res = await fetch('/downloads/manifest.json')
      if (!res.ok) throw new Error('manifest unavailable')
      return (await res.json()) as DownloadManifest
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('downloads.empty')}</p>
        </CardContent>
      </Card>
    )
  }

  const grouped = PLATFORMS.map((platform) => ({
    platform,
    files: data.files.filter(platform.match),
  })).filter((g) => g.files.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-xl font-bold">{t('downloads.title')}</h2>
        <span className="text-sm text-muted-foreground">v{data.version}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grouped.map(({ platform, files }) => {
          const Icon = platform.icon
          return (
            <Card key={platform.id} className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">{t(platform.labelKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.map((file) => (
                  <a
                    key={file}
                    href={`/downloads/${file}`}
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full justify-between group/btn',
                    )}
                  >
                    <span className="text-xs font-mono truncate">{file}</span>
                    <Download className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t('downloads.note')}</p>
    </div>
  )
}
