'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Check, Printer, X } from 'lucide-react'
import { FUEL_ENTRY_GUIDE_VERSION, fuelEntryGuideSteps, GUIDE_PATH, supportsFuelEntryGuide } from '@/lib/onboarding/fuel-entry-guide'

const endpoint = '/api/account/fuel-entry-guide'
interface GuideContextValue {
  active: boolean
  target?: string
  start: () => void
  dismiss: () => void
}
const GuideContext = createContext<GuideContextValue>({ active: false, start() {}, dismiss() {} })
export const useFuelEntryGuide = () => useContext(GuideContext)

export function FuelEntryGuideProvider({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const userId = session?.user?.id
  const isPreview = preview && process.env.NODE_ENV === 'development'
  const guidePath = isPreview ? '/preview/fuel-entry-guide' : GUIDE_PATH
  const router = useRouter()
  const pathname = usePathname()
  const [screen, setScreen] = useState<'closed' | 'intro' | 'tour'>(isPreview ? 'intro' : 'closed')
  const [index, setIndex] = useState(0)
  const [pendingStart, setPendingStart] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const steps = fuelEntryGuideSteps(role || '')
  const step = steps[index]
  const visible = screen !== 'closed' && supportsFuelEntryGuide(role)
  const active = visible && screen === 'tour'
  const dismiss = () => { if (!saving) { setScreen('closed'); setPendingStart(false); setError('') } }
  const start = () => { setError(''); setIndex(0); setScreen('intro') }

  useEffect(() => {
    if (isPreview || !supportsFuelEntryGuide(role) || !userId) return
    const controller = new AbortController()
    setScreen('closed')
    fetch(endpoint, { cache: 'no-store', signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(body => {
        if (!controller.signal.aborted && body?.success && body.data?.completed === false) setScreen('intro')
      }).catch(() => { /* A failed status check must not interrupt daily work. Replay stays available. */ })
    return () => controller.abort()
  }, [userId, role, isPreview])

  // Do not leave a tour overlay behind when browser history changes the route.
  useEffect(() => {
    if (active && pathname !== guidePath) setScreen('closed')
  }, [pathname, active, guidePath])

  useEffect(() => {
    if (!visible) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return () => previousFocus.current?.focus()
  }, [visible])

  useEffect(() => { if (visible) title.current?.focus() }, [visible, screen, index])

  useEffect(() => {
    setRect(null)
    if (!active) return
    let target: HTMLElement | null = null
    const measure = () => {
      const next = document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`)
      if (!next) { setRect(null); return }
      if (target !== next) {
        target = next
        next.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      const r = next.getBoundingClientRect()
      const top = Math.max(8, r.top - 6)
      const bottom = Math.min(window.innerHeight - 8, r.bottom + 6)
      setRect({ top, left: Math.max(8, r.left - 6), width: Math.min(r.width + 12, window.innerWidth - 16), height: Math.max(0, bottom - top) })
    }
    measure()
    const observer = new MutationObserver(measure)
    // Observe only the content, not the tour's own highlight updates.
    const content = document.getElementById('guided-app-content')
    if (content) observer.observe(content, { childList: true, subtree: true })
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [active, step.target, pathname])

  useEffect(() => {
    if (pendingStart && pathname === guidePath) { setPendingStart(false); setScreen('tour') }
  }, [pendingStart, pathname, guidePath])

  const begin = () => {
    if (pathname === guidePath) setScreen('tour')
    else { setPendingStart(true); router.push(guidePath) }
  }
  const finish = async () => {
    if (isPreview) { setScreen('closed'); return }
    setSaving(true); setError('')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: FUEL_ENTRY_GUIDE_VERSION }) })
      const body = await response.json()
      if (!response.ok || !body.success) throw new Error('save')
      setScreen('closed')
    } catch {
      setError('Završetak nije spremljen. Pokušajte ponovo; vodič će se prestati prikazivati nakon uspješnog spremanja.')
    } finally { setSaving(false) }
  }

  return <GuideContext.Provider value={{ active, target: active ? step.target : undefined, start, dismiss }}>
    <div id="guided-app-content" inert={visible ? true : undefined}>{children}</div>
    {visible && <div className="fixed inset-0 z-[100]" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss() }
      if (event.key === 'Tab') {
        const buttons = card.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
        if (!buttons?.length) { event.preventDefault(); return }
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === title.current)) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === title.current)) { event.preventDefault(); first.focus() }
      }
    }}>
      <div className={`absolute inset-0 ${active && rect ? '' : 'bg-slate-950/55'}`} />
      {active && rect && <div aria-hidden="true" className="fixed rounded-xl border-2 border-emerald-300 pointer-events-none" style={{ ...rect, boxShadow: '0 0 0 9999px rgba(15,23,42,.55)' }} />}
      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="fuel-guide-title" aria-describedby="fuel-guide-description"
        className={`fixed bg-white text-dark-900 rounded-2xl shadow-2xl overflow-auto max-h-[calc(100dvh-32px)] ${active ? 'guide-step-card bottom-4 right-4 left-4 lg:left-auto lg:w-[352px] lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-32px)] max-w-lg'}`}>
        <div className={active ? "guide-step-body p-5 lg:p-7" : "p-6 sm:p-7"}>
          <div className="flex items-center justify-between mb-5">
            <BookOpen className="h-7 w-7 text-emerald-700" aria-hidden="true" />
            <button type="button" onClick={dismiss} disabled={saving} aria-label="Zatvori vodič, nastavi kasnije" className="p-2 rounded-lg hover:bg-dark-100 focus-visible:outline-2 focus-visible:outline-emerald-700"><X className="w-5 h-5" /></button>
          </div>
          {active && <p className="text-sm text-dark-600 mb-3" aria-live="polite">Korak {index + 1} od {steps.length}</p>}
          <h2 ref={title} tabIndex={-1} id="fuel-guide-title" className="text-2xl font-bold leading-tight outline-none">{active ? step.title : 'Lakše kroz novu prijavu goriva'}</h2>
          <p id="fuel-guide-description" className="mt-4 text-base leading-relaxed text-dark-600">{active ? step.description : role === 'PUMPA' ? 'Pogledajte odabir poslovnice, uvoz prethodne prijave, popunjavanje zapisnika i direktno printanje.' : 'Pogledajte kako uvesti prethodnu prijavu po tipu goriva i printati dokument direktno iz pregleda.'}</p>
          {!active && <div className="mt-6 space-y-3 text-sm text-dark-700">
            {(role === 'PUMPA' ? ['Poslovnica i uvoz podataka', 'Zapisnik o prijemu goriva', 'Direktno printanje dokumenata'] : ['Uvoz po tipu goriva', 'Direktno printanje dokumenata']).map(item => <p key={item} className="flex gap-3 items-center"><Check className="w-4 h-4 text-emerald-700 shrink-0" />{item}</p>)}
          </div>}
          {active && step.target === 'print' && !rect && <div className="mt-5 flex items-center gap-3 rounded-xl bg-dark-100 p-4 text-sm"><Printer className="w-6 h-6 shrink-0" /><span>Ikona štampača nalazi se uz naziv dokumenta u pregledu spremljene prijave.</span></div>}
          {active && step.note && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">{step.note}</p>}
          <p className="mt-5 text-xs leading-relaxed text-dark-500">{active ? 'Ovo je pregled koraka. Vodič ne sprema prijavu niti pokreće štampanje.' : 'Kratki vodič bez spremanja prijave. Nakon završetka ostaje dostupan u Operativnom uputstvu.'}</p>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
        <div className="shrink-0 border-t border-dark-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          {active && index > 0 ? <button type="button" disabled={saving} onClick={() => { setIndex(index - 1); setError('') }} className="flex items-center gap-2 text-sm px-2 py-3 rounded-lg hover:bg-dark-50"><ArrowLeft className="w-4 h-4" />Nazad</button> : <button type="button" disabled={saving} onClick={dismiss} className="text-sm px-2 py-3 rounded-lg hover:bg-dark-50">Kasnije</button>}
          <button type="button" disabled={saving || pendingStart} onClick={!active ? begin : index === steps.length - 1 ? finish : () => setIndex(index + 1)} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            {saving ? 'Spremanje…' : pendingStart ? 'Otvaranje…' : !active ? 'Pokaži mi' : index === steps.length - 1 ? 'Završi vodič' : 'Dalje'}{!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>}
  </GuideContext.Provider>
}

export function FuelEntryGuideLauncher() {
  const { data: session } = useSession()
  const guide = useFuelEntryGuide()
  if (!supportsFuelEntryGuide(session?.user?.role)) return null
  return <section className="bg-white rounded-2xl border border-dark-200 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-5">
    <div className="max-w-2xl"><h2 className="text-xl font-bold text-dark-900">Novosti u prijavama goriva</h2><p className="mt-2 text-dark-600">Ponovo prođite kroz uvoz podataka, {session?.user?.role === 'PUMPA' ? 'zapisnik o prijemu i ' : ''}direktno printanje, korak po korak.</p></div>
    <button type="button" onClick={guide.start} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><BookOpen className="w-4 h-4" />Pokreni vodič</button>
  </section>
}
