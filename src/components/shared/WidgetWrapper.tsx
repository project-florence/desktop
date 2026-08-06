import { type ReactNode } from 'react'
import { X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetWrapperProps {
  editing: boolean
  onDelete?: () => void
  children: ReactNode
}

export function WidgetWrapper({ editing, onDelete, children }: WidgetWrapperProps) {
  return (
    <div className={cn('h-full relative group', editing && 'ring-1 ring-primary/30 rounded-lg')}>
      {editing && (
        <div className="absolute -top-2 -right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
            onClick={onDelete}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {editing && (
        <div className="absolute top-1 left-1 z-20 widget-drag-handle cursor-grab active:cursor-grabbing opacity-30 hover:opacity-80 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn('h-full', editing && 'pl-5 pointer-events-none')}>
        {children}
      </div>
    </div>
  )
}
