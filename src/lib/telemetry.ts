import axios from 'axios'
import { apiConfig } from '@/config/api'

const telemetryApi = axios.create({
  baseURL: import.meta.env.DEV ? '' : apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const SESSION_KEY = 'florence_session_id'
const MAX_QUEUE = 200
const FLUSH_URL = '/api/v1/analytics/event'

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

let queue: object[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function flush() {
  if (queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  telemetryApi.post(FLUSH_URL, batch).catch(() => {
    // Başarısız batch'i kuyruğun başına geri koy (veri kaybını önle)
    queue.unshift(...batch)
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE)
  })
}

function flushOnUnload() {
  if (queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  const ok = navigator.sendBeacon(FLUSH_URL, new Blob([JSON.stringify(batch)], { type: 'application/json' }))
  if (!ok) {
    queue.unshift(...batch)
  }
}

function schedule() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    flush()
  }, 10000)
}

function enqueue(event: object) {
  queue.push(event)
  if (queue.length > MAX_QUEUE) {
    queue.splice(0, queue.length - MAX_QUEUE)
  }
}

export function track(eventType: string, details: Record<string, unknown> = {}) {
  enqueue({ event_type: eventType, session_id: getSessionId(), details })
  schedule()
}

export function trackWithTicker(eventType: string, ticker: string, details: Record<string, unknown> = {}) {
  enqueue({ event_type: eventType, session_id: getSessionId(), ticker, details })
  schedule()
}

// Sekme gizlenince kuyruğu boşalt; sayfa kapanırken sendBeacon ile gönder (çerez taşır)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushOnUnload)
}
