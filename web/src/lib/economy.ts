/**
 * Ekonomi (FX & kıymetli maden) yardımcıları.
 *
 * Sembol haritaları backend `SYMBOL_REGISTRY`'nin (src/finance/symbols.py)
 * frontend yansımasıdır: legacy anahtarlar (`gram-altin`, `ons`, ...) geçiş
 * döneminde kanonik sembollere (`XAU-GRAM`, `XAU-ONS`, ...) eşlenir.
 */

export function isEconomyEmpty(data: Record<string, unknown> | undefined): boolean {
  if (!data) return true
  if ('error' in data) return true
  return Object.values(data).every((v) => !v || typeof v !== 'object')
}

/** Legacy metal anahtarı -> kanonik sembol (backend SYMBOL_REGISTRY mirror). */
export const LEGACY_TO_CANONICAL: Record<string, string> = {
  ons: 'XAU-ONS',
  'gram-altin': 'XAU-GRAM',
  'gram-has-altin': 'XAU-HAS',
  'ceyrek-altin': 'XAU-CEYREK',
  'yarim-altin': 'XAU-YARIM',
  'tam-altin': 'XAU-TAM',
  'cumhuriyet-altini': 'XAU-CUMHURIYET',
  'ata-altin': 'XAU-ATA',
  '14-ayar-altin': 'XAU-14-AYAR',
  '18-ayar-altin': 'XAU-18-AYAR',
  '22-ayar-bilezik': 'XAU-22-BILEZIK',
  'ikibucuk-altin': 'XAU-IKIBUCUK',
  'gremse-altin': 'XAU-GREMSE',
  'resat-altin': 'XAU-RESAT',
  'besli-altin': 'XAU-BESLI',
  'hamit-altin': 'XAU-HAMIT',
  gumus: 'XAG-GRAM',
  'gram-platin': 'XPT-GRAM',
  'gram-paladyum': 'XPD-GRAM',
}

/** Kanonik sembol -> legacy metal anahtarı (yalnızca legacy'si olanlar). */
export const CANONICAL_TO_LEGACY: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY_TO_CANONICAL).map(([legacy, canonical]) => [canonical, legacy]),
)

/** Legacy metal anahtarını kanonik sembole çevirir; bilinmeyeni olduğu gibi bırakır. */
export function toCanonicalSymbol(key: string): string {
  return LEGACY_TO_CANONICAL[key] ?? key.toUpperCase()
}

/** Quote/entry fiyatının para birimi sembolü (TRY -> ₺, USD -> $). */
export function currencySymbol(currency?: string | null): string {
  if (currency === 'USD') return '$'
  if (currency === 'TRY') return '₺'
  return ''
}

/** Sayısal fiyatı tr-TR gruplamayla, para birimi sembolü ön ekli biçimler. */
export function formatEconomyPrice(
  value: number,
  currency?: string | null,
  maxFractionDigits = 2,
): string {
  const symbol = currencySymbol(currency)
  return `${symbol}${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  })}`
}

/** Backend `unit` alanını görüntülenebilir kısa etikete çevirir (gram/ons/''). */
export function unitLabel(unit?: string | null): 'gram' | 'ounce' | '' {
  if (unit === '1 gram') return 'gram'
  if (unit === '1 ounce') return 'ounce'
  return ''
}
