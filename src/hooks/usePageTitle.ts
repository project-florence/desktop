import { useEffect } from 'react'
import { usePageTitleStore } from '@/stores/pageTitleStore'

export function usePageTitle(title: string) {
  const setTitle = usePageTitleStore((s) => s.setTitle)

  useEffect(() => {
    setTitle(title)
    return () => setTitle('')
  }, [title, setTitle])
}
