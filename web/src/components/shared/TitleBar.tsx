import { useEffect, useState } from 'react'
import { Minus, Square, Copy, X } from 'lucide-react'
import { isTauri } from '@/lib/desktop'
import { cn } from '@/lib/utils'

export function TitleBar() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    if (!isTauri()) return
    let unlisten: (() => void) | undefined
    let disposed = false

    void (async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      if (disposed) return
      setMaximized(await win.isMaximized())
      unlisten = await win.onResized(() => {
        void win.isMaximized().then(setMaximized)
      })
    })()

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  if (!isTauri()) return null

  const winAction = (action: 'minimize' | 'toggleMaximize' | 'close') => {
    void import('@tauri-apps/api/window').then(({ getCurrentWindow }) =>
      getCurrentWindow()[action](),
    )
  }

  return (
    <div
      data-tauri-drag-region
      className={cn(
        'fixed inset-x-0 top-0 z-[70] flex items-center justify-between border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60 select-none h-9',
      )}
    >
      <div data-tauri-drag-region className="flex items-center gap-2 px-3 min-w-0">
        <span
          data-tauri-drag-region
          className="text-xs font-semibold tracking-wide text-muted-foreground truncate"
        >
          Florence
        </span>
      </div>
      <div data-tauri-drag-region className="flex items-center h-full">
        <button
          type="button"
          onClick={() => winAction('minimize')}
          aria-label="Minimize"
          className="h-full w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => winAction('toggleMaximize')}
          aria-label={maximized ? 'Restore' : 'Maximize'}
          className="h-full w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {maximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => winAction('close')}
          aria-label="Close"
          className="h-full w-11 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
