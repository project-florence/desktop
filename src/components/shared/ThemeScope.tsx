import { Outlet } from 'react-router-dom'
import { TitleBar } from './TitleBar'
import { isTauri } from '@/lib/desktop'

export function ThemeScope() {
  return (
    <div className="dark min-h-screen bg-background text-foreground" data-theme="florence">
      <TitleBar />
      <div className={isTauri() ? 'pt-9' : undefined}>
        <Outlet />
      </div>
    </div>
  )
}
