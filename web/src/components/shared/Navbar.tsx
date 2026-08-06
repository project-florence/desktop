import { Menu, X } from 'lucide-react'
import { useNavStore } from '@/stores/navStore'
import { usePageTitleStore } from '@/stores/pageTitleStore'
import { AnnouncementBell } from './AnnouncementBell'
import { isTauri } from '@/lib/desktop'
import { cn } from '@/lib/utils'

export function Navbar() {
  const mobileSidebarOpen = useNavStore((s) => s.mobileSidebarOpen)
  const toggleMobileSidebar = useNavStore((s) => s.toggleMobileSidebar)
  const title = usePageTitleStore((s) => s.title)

  return (
    <header className={cn(
      'sticky z-30 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6',
      isTauri() ? 'top-9' : 'top-0',
    )}>
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {title && (
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-1">
        <AnnouncementBell />
      </div>
    </header>
  )
}
