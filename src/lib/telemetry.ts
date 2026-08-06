import axios from 'axios'
import { apiConfig } from '@/config/api'

const telemetryApi = axios.create({
  baseURL: import.meta.env.DEV ? '' : apiConfig.baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

const SESSION_KEY = 'florence_session_id'

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
  telemetryApi.post('/api/v1/analytics/event', batch).catch(() => {})
}

function schedule() {
  if (timer) return
  timer = setTimeout(() => {
    timer = null
    flush()
  }, 10000)
}

export function track(eventType: string, details: Record<string, unknown> = {}) {
  queue.push({ event_type: eventType, session_id: getSessionId(), details })
  schedule()
}

export function trackWithTicker(eventType: string, ticker: string, details: Record<string, unknown> = {}) {
  queue.push({ event_type: eventType, session_id: getSessionId(), ticker, details })
  schedule()
}
