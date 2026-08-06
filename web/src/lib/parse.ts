export function parsePrice(s: string | undefined): number | null {
  if (!s) return null
  let cleaned = s.replace(/[^0-9.,-]/g, '')
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

export function parseChange(s: string | null | undefined): number | null {
  if (!s) return null
  const cleaned = s.replace('%', '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}
