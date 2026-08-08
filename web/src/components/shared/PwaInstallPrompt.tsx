import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISSED_KEY = 'florence-pwa-install-dismissed'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      if (dismissed || isStandalone()) return
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => setInstallEvent(null)

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [dismissed])

  if (!installEvent || dismissed || isStandalone()) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Ignore storage restrictions; the in-memory state still hides the prompt.
    }
    setDismissed(true)
    setInstallEvent(null)
  }

  const install = async () => {
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      try {
        localStorage.setItem(DISMISSED_KEY, 'true')
      } catch {
        // Ignore storage restrictions; the in-memory state still hides the prompt.
      }
      setDismissed(true)
    }
    setInstallEvent(null)
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card/95 p-3 shadow-xl backdrop-blur">
      <div className="min-w-0">
        <p className="text-sm font-medium">Florence’i yükle</p>
        <p className="text-xs text-muted-foreground">Daha hızlı erişim için ana ekrana ekle.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button size="sm" onClick={() => void install()}>
          <Download className="mr-1.5 h-4 w-4" />
          Yükle
        </Button>
        <Button variant="ghost" size="icon" aria-label="Kapat" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
