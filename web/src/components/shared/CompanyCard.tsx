import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2 } from 'lucide-react'
import type { CompanySummary } from '@/types/api'
import { QuoteChange } from '@/components/shared/QuoteChange'

function fmtVolume(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('tr-TR')
}

function fmtCap(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  return n.toLocaleString('tr-TR')
}

function fmtPrice(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return `₺${n.toFixed(2)}`
}

interface CompanyCardProps {
  company: CompanySummary
  action?: ReactNode
}

export function CompanyCard({ company, action }: CompanyCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      className="hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/stocks/${company.ticker}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono font-bold text-primary">{company.ticker}</span>
          {action}
        </div>
        <p className="text-sm font-medium truncate mb-2">{company.name}</p>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold">{fmtPrice(company.last_price)}</span>
          <QuoteChange
            change={company.change_pct}
            changeWindow={company.change_window}
            marketStatus={company.market_status}
            isStale={company.is_stale}
            asOf={company.as_of ?? company.price_updated_at}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {company.sector && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              <Building2 className="h-2.5 w-2.5 mr-0.5" />
              {company.sector}
            </Badge>
          )}
          <span>H: {fmtVolume(company.volume)}</span>
          <span>PiD: {fmtCap(company.market_cap)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
