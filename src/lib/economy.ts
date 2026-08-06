export function isEconomyEmpty(data: Record<string, unknown> | undefined): boolean {
  if (!data) return true
  if ('error' in data) return true
  return Object.values(data).every((v) => !v || typeof v !== 'object')
}
