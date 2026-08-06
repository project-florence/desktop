import { useRef, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import florenceLogo from '@/assets/florence_logo.svg'
import { FluidBackground } from '@/components/shared/FluidBackground'


function useInView(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

const footerLinks = [
  { to: '/about', key: 'footer.about' },
  { to: '/contact', key: 'footer.contact' },
  { to: '/legal/terms', key: 'footer.terms' },
  { to: '/legal/privacy_policy', key: 'footer.privacy' },
  { to: '/legal/cookie_policy', key: 'footer.cookies' },
  { to: '/legal/disclaimer', key: 'footer.disclaimer' },
]

function FadeInSection(props: { children: any }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        inView ? 'animate-fadeIn animate-slideUp' : 'opacity-0 translate-y-8',
      )}
    >
      {props.children}
    </div>
  )
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const scopeRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={scopeRef} className="min-h-screen flex flex-col bg-background">
      <FluidBackground />

      {/* Top navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 h-16 bg-background/60 backdrop-blur-xl">
        <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/') }} className="flex items-center gap-2 cursor-pointer">
          <img src={florenceLogo} alt="Florence" className="h-8 w-8" />
          <span className="font-semibold text-lg">{t('app.name')}</span>
        </button>
        <div className="flex items-center gap-3">
          <Select value={i18n.language} onValueChange={(v) => v && i18n.changeLanguage(v)}>
            <SelectTrigger className="w-[105px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={scopeRef}>
              <SelectItem value="tr">Türkçe</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate('/login')} className="bg-white/10 hover:bg-white/20">
            {t('auth.login')}
          </Button>
          <Button onClick={() => navigate('/register')} className="hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold shadow-md">
            {t('landing.signUp')}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-[calc(100vh-4rem)] flex flex-col px-4 relative z-10">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-3xl bg-card/60 backdrop-blur-xl border border-white/5 shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center space-y-8">
              <img src={florenceLogo} alt="Florence" className="h-16 w-16 mx-auto" />

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                {t('landing.heading')}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {t('landing.subheading')}
              </p>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="text-base px-10 py-6 h-auto rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold"
                >
                  {t('landing.getStarted')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('features-start')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 pb-6 text-foreground/70 hover:text-foreground/90 transition-colors cursor-pointer"
        >
          <span className="text-xs tracking-widest uppercase font-medium">{t('landing.features')}</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </section>

      {/* Feature sections */}
      {[
        { key: 'feature1', img: '/assets/stocks.png' },
        { key: 'feature2', img: '/assets/ipo.png' },
        { key: 'feature3', img: '/assets/advisor.png' },
        { key: 'feature4', img: '/assets/report.png' },
        { key: 'feature5', img: '/assets/simulation.png' },
      ].map((f, fi) => (
        <FadeInSection key={f.key}>
          <section id={fi === 0 ? 'features-start' : undefined} className="py-24 md:py-40 relative z-10">
            <div className="max-w-6xl mx-auto px-4 md:px-8">
              <img src={f.img} alt="" className="w-full rounded-2xl shadow-2xl border border-border/50 mb-10" loading="lazy" />
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">{t(`landing.${f.key}.heading`)}</h2>
                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">{t(`landing.${f.key}.desc`)}</p>
              </div>
            </div>
          </section>
        </FadeInSection>
      ))}

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {footerLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-foreground hover:underline transition-colors">
                {t(link.key)}
              </Link>
            ))}
          </div>
          <div className="text-center text-[11px] text-muted-foreground/60 mt-3">
            &copy; 2026 Florence. {t('footer.allRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  )
}
