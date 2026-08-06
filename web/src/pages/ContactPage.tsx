import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Code2, ArrowLeft } from 'lucide-react'
import api from '@/lib/api'

interface ContactResponse {
  email: string
  github: string
}

export default function ContactPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['contact'],
    queryFn: async () => {
      const res = await api.get('/api/v1/contact')
      return res.data as ContactResponse
    },
  })

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
            <CardContent className="flex items-center gap-3 p-4">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <a href={`mailto:${data?.email}`} className="text-sm text-primary hover:underline">
                {data?.email}
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Code2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <a href={data?.github} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {data?.github}
              </a>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
