import api from '@/lib/api'
import type { ExportCreateResponse, ExportRecord } from '@/types/api'

/** GET /api/v1/data/export hem dizi hem { exports: [...] } sarmalayıcı dönebilir; ikisini de destekle. */
function extractExports(data: unknown): ExportRecord[] {
  if (Array.isArray(data)) return data as ExportRecord[]
  if (data && typeof data === 'object' && Array.isArray((data as { exports?: unknown }).exports)) {
    return (data as { exports: ExportRecord[] }).exports
  }
  return []
}

/** Yeni dışa aktarım isteği oluşturur: POST /api/v1/data/export */
export async function createExport(year: number, format: string): Promise<ExportCreateResponse> {
  const res = await api.post('/api/v1/data/export', { year, format })
  return res.data as ExportCreateResponse
}

/** Dışa aktarım isteklerini listeler: GET /api/v1/data/export */
export async function listExports(): Promise<ExportRecord[]> {
  const res = await api.get('/api/v1/data/export')
  return extractExports(res.data)
}
