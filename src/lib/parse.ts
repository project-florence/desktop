/**
 * Backend 0.6.0+ ekonomi yanıtları sayısal (float) döndürür; geçiş döneminde
 * Redis fallback'i virgüllü string üretebilir. Bu yardımcılar her iki formu da
 * kabul eder: `number` olduğu gibi döndürülür (asla `.replace()` çağrılmaz —
 * TypeError riski), string ise eski virgül/nokta temizleme mantığı uygulanır.
 */

export function parsePrice(s: number | string | null | undefined): number | null {
  if (s === null || s === undefined) return null
  if (typeof s === 'number') return Number.isFinite(s) ? s : null
  if (typeof s !== 'string') return null
  const trimmed = s.trim()
  if (!trimmed) return null
  let cleaned = trimmed.replace(/[^0-9.,-]/g, '')
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Türkçe "1.234,56" ya da uluslararası "1,234.56" — son ayırıcı ondalık.
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.')
  }
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

export function parseChange(s: number | string | null | undefined): number | null {
  if (s === null || s === undefined) return null
  if (typeof s === 'number') return Number.isFinite(s) ? s : null
  if (typeof s !== 'string') return null
  const cleaned = s.replace('%', '').replace(',', '.').trim()
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}
