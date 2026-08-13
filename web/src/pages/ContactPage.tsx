import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Code2, ArrowLeft, Copy, Check, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'

interface ContactResponse {
  email: string
  github: string
}

export default function ContactPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['contact'],
    queryFn: async () => {
      const res = await api.get('/api/v1/contact')
      return res.data as ContactResponse
    },
  })

  const handleCopyEmail = async () => {
    if (!data?.email) return
    try {
      await navigator.clipboard.writeText(data.email)
      setCopied(true)
      toast.success(t('contact.copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }

  const githubIssuesUrl = data?.github
    ? `${data.github.replace(/\/$/, '')}/issues`
    : undefined

  return (
    <div className="max-w-xl mx-auto pt-6 md:pt-8 pb-6 md:pb-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t('common.back')}
      </Button>
      <h1 className="text-2xl font-bold mb-6">{t('footer.contact')}</h1>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{t('common.error')}</p>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t('contact.emailTitle')}</p>
                <p className="text-sm text-muted-foreground truncate">{data?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                disabled={!data?.email}
              >
                {copied ? <Check className="h-4 w-4 mr-1 text-success" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? t('contact.copied') : t('contact.copy')}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t('contact.githubTitle')}</p>
                <a
                  href={data?.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate block"
                >
                  {data?.github}
                </a>
              </div>
              {githubIssuesUrl && (
                <a href={githubIssuesUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t('contact.openIssues')}
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
