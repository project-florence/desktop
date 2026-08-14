import type { TFunction } from 'i18next'

/**
 * Backend hata detay kodlarını i18n anahtarlarına eşler.
 * Backend, register/login hatalarında detail alanında bu kodları döner.
 */
export const BACKEND_ERROR_KEYS: Record<string, string> = {
  error_email_taken: 'auth.errorEmailTaken',
  error_username_taken: 'auth.errorUsernameTaken',
  error_login_failed: 'auth.errorLoginFailed',
  error_email_not_verified: 'auth.errorEmailNotVerified',
  error_bot_limit_reached: 'bots.limitReached',
}

/** detail bir bilinen backend koduysa çevrilmiş mesajı, değilse undefined döner. */
export function translateBackendDetail(t: TFunction, detail: unknown): string | undefined {
  if (typeof detail === 'string' && BACKEND_ERROR_KEYS[detail]) {
    return t(BACKEND_ERROR_KEYS[detail])
  }
  // Pydantic 422: detail, { msg, type, ... } öğelerinden oluşan bir dizi gelir.
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    const msg =
      typeof first === 'object' && first !== null && 'msg' in first
        ? String((first as { msg: unknown }).msg)
        : undefined
    if (msg && msg.toLowerCase().includes('at least 10 characters')) {
      return t('bots.passwordTooShort')
    }
  }
  return undefined
}
