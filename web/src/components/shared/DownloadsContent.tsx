import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppWindow, Download, Monitor, PackageOpen, Terminal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface DownloadManifest {
  version: string
  files: string[]
}

interface PlatformDef {
  id: string
  labelKey: string
  descriptionKey: string
  icon: typeof Monitor
  match: (file: string) => boolean
}

const PLATFORMS: PlatformDef[] = [
  {
    id: 'windows',
    labelKey: 'downloads.platformWindows',
    descriptionKey: 'downloads.platformWindowsDesc',
    icon: Monitor,
    match: (f) => f.endsWith('.exe') || f.endsWith('.msi'),
  },
  {
    id: 'macos',
    labelKey: 'downloads.platformMacos',
    descriptionKey: 'downloads.platformMacosDesc',
    icon: AppWindow,
    match: (f) => f.endsWith('.dmg') || f.endsWith('.tar.gz'),
  },
  {
    id: 'linux',
    labelKey: 'downloads.platformLinux',
    descriptionKey: 'downloads.platformLinuxDesc',
    icon: Terminal,
    match: (f) => f.endsWith('.AppImage') || f.endsWith('.deb') || f.endsWith('.rpm'),
  },
]

/** macOS dosyaları için mimari bilgisini dosya adından çıkarır. */
function fileArch(file: string): 'aarch64' | 'x86_64' | null {
  if (file.includes('aarch64') || file.includes('arm64')) return 'aarch64'
  if (file.includes('x86_64') || file.includes('amd64') || file.includes('x64')) return 'x86_64'
  return null
}

/** Uzun build dosya adini kisa, okunabilir bir i18n etiketine cevirir. */
function fileLabelKey(file: string): string {
  if (file.endsWith('.msi')) return 'downloads.fileMsi'
  if (file.endsWith('.dmg')) return 'downloads.fileDmg'
  if (file.endsWith('.tar.gz')) return 'downloads.fileTarGz'
  if (file.endsWith('.deb')) return 'downloads.fileDeb'
  if (file.endsWith('.rpm')) return 'downloads.fileRpm'
  if (file.endsWith('.AppImage')) return 'downloads.fileAppImage'
  return 'downloads.fileExe'
}

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
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
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
      <div>
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-bold">{t('downloads.title')}</h2>
          <Badge variant="outline" className="text-xs">v{data.version}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t('downloads.description')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {grouped.map(({ platform, files }) => {
          const Icon = platform.icon
          return (
            <Card
              key={platform.id}
              className="flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">{t(platform.labelKey)}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">v{data.version}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t(platform.descriptionKey)}</p>
              </CardHeader>
              <CardContent className="space-y-2 flex-1">
                {files.map((file) => {
                  const arch = fileArch(file)
                  return (
                    <a key={file} href={`/downloads/${file}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between gap-2 h-auto py-2 px-3"
                        title={file}
                      >
                        <span className="flex min-w-0 flex-col items-start leading-tight">
                          <span className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{t(fileLabelKey(file))}</span>
                            {arch && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-mono">
                                {arch}
                              </Badge>
                            )}
                          </span>
                          <span className="w-full max-w-full truncate text-[10px] font-mono text-muted-foreground">
                            {file}
                          </span>
                        </span>
                        <Download className="h-4 w-4 shrink-0" />
                      </Button>
                    </a>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
