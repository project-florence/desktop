import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Code2 } from 'lucide-react'
import api from '@/lib/api'

const footerLinks = [
  { to: '/about', key: 'footer.about' },
  { to: '/contact', key: 'footer.contact' },
  { to: '/legal/terms', key: 'footer.terms' },
  { to: '/legal/privacy_policy', key: 'footer.privacy' },
  { to: '/legal/cookie_policy', key: 'footer.cookies' },
  { to: '/legal/disclaimer', key: 'footer.disclaimer' },
] as const

export function Footer() {
  const { t } = useTranslation()

  const { data: version } = useQuery({
    queryKey: ['version'],
    queryFn: async () => {
      const res = await api.get('/api/v1/version')
      return res.data.version as string
    },
    staleTime: 1000 * 60 * 60,
  })

  const { data: contact } = useQuery({
    queryKey: ['contact'],
    queryFn: async () => {
      const res = await api.get('/api/v1/contact')
      return res.data as { email: string; github: string }
    },
    staleTime: 1000 * 60 * 60,
  })

  return (
    <footer className="border-t border-border/40 mt-auto py-6 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-foreground hover:underline transition-colors"
            >
              {t(link.key)}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-muted-foreground/60">
          {contact?.github && (
            <a
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Code2 className="h-3.5 w-3.5" />
            </a>
          )}
          {version && <span>v{version}</span>}
          {version && <span>·</span>}
          <span>&copy; 2026 Florence. {t('footer.allRightsReserved')}</span>
        </div>
      </div>
    </footer>
  )
}
