import { Outlet } from 'react-router-dom'

export function ThemeScope() {
  return (
    <div className="dark min-h-screen bg-background text-foreground" data-theme="florence">
      <Outlet />
    </div>
  )
}
