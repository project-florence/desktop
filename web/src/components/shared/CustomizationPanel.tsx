import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { WidgetPalette } from './WidgetPalette'
import { toast } from 'sonner'

interface CustomizationPanelProps {
  onAddWidget: (type: string, config?: Record<string, unknown>) => void
  onSave: () => void
  onReset: () => void
  isSaving: boolean
}

export function CustomizationPanel({ onAddWidget, onSave, onReset, isSaving }: CustomizationPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full lg:w-72 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card/50 backdrop-blur-sm p-4 space-y-4 overflow-y-auto max-h-none lg:max-h-[calc(100dvh-8rem)]">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {t('customization.widgets')}
        </h3>
        <WidgetPalette onAdd={onAddWidget} />
      </div>

      <Separator />

      <div className="space-y-2">
        <Button
          variant="gradient"
          size="sm"
          className="w-full"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? t('common.loading') : t('customization.save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            onReset()
            toast.success(t('customization.resetSuccess'))
          }}
        >
          {t('customization.reset')}
        </Button>
      </div>
    </div>
  )
}
