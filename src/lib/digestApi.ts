import api from '@/lib/api'
import type { Digest, DigestSlot } from '@/types/api'

function isAxiosErrorStatus(err: unknown, status: number): boolean {
  if (typeof err !== 'object' || err === null) return false
  const response = (err as { response?: { status?: unknown } }).response
  return response?.status === status
}

/** Güncel piyasa özetini getirir: GET /api/v1/digest — 404'te null döner. */
export async function fetchCurrentDigest(): Promise<Digest | null> {
  try {
    const res = await api.get('/api/v1/digest')
    return res.data as Digest
  } catch (err) {
    if (isAxiosErrorStatus(err, 404)) return null
    throw err
  }
}

/** Tarihe göre özetleri listeler: GET /api/v1/digest?date=YYYY-MM-DD */
export async function fetchDigestsByDate(date: string): Promise<Digest[]> {
  const res = await api.get('/api/v1/digest', { params: { date } })
  return res.data as Digest[]
}

/** Tarih + slot ile tek özet getirir: GET /api/v1/digest?date=&slot= — 404'te null döner. */
export async function fetchDigestByDateSlot(date: string, slot: DigestSlot): Promise<Digest | null> {
  try {
    const res = await api.get('/api/v1/digest', { params: { date, slot } })
    return res.data as Digest
  } catch (err) {
    if (isAxiosErrorStatus(err, 404)) return null
    throw err
  }
}