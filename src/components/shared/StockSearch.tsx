import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Search, TrendingUp, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import type { SearchResult } from '@/types/api'

interface StockSearchProps {
  onSelect: (ticker: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function StockSearch({ onSelect, placeholder, className, autoFocus }: StockSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    clearTimeout(debounceRef.current)
    if (value.length > 0) {
      debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300)
    } else {
      setDebouncedQuery('')
      setIsOpen(false)
    }
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  const { data: results } = useQuery({
    queryKey: ['stock-search', debouncedQuery],
    queryFn: async () => {
      const res = await api.get('/api/v1/companies/search', {
        params: { query: debouncedQuery },
      })
      return res.data as SearchResult[]
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 60_000,
  })

  const visible = results?.slice(0, 20) ?? []

  useEffect(() => {
    setHighlightIndex(-1)
    setIsOpen(debouncedQuery.length > 0 && visible.length > 0)
  }, [debouncedQuery, visible.length])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const select = (ticker: string) => {
    setQuery('')
    setDebouncedQuery('')
    setIsOpen(false)
    onSelect(ticker)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.min(prev + 1, visible.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      select(visible[highlightIndex].ticker)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={placeholder || t('stocks.search')}
          className="h-12 pl-12 pr-4 text-base rounded-xl border-2 focus-visible:ring-2"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => debouncedQuery && visible.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setQuery(''); setDebouncedQuery(''); setIsOpen(false) }}
          >
            ✕
          </button>
        )}
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border-2 border-border bg-popover p-1.5 shadow-xl"
        >
          {visible.map((item, i) => (
            <button
              key={item.ticker}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors',
                i === highlightIndex
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              onClick={() => select(item.ticker)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-mono font-bold text-foreground">{item.ticker}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{item.name}</span>
              </div>
            </button>
          ))}
          {visible.length === 0 && debouncedQuery && (
            <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {t('common.noData')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
