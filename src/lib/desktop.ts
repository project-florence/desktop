import { invoke } from '@tauri-apps/api/core'

const ACCESS_KEY = 'florence_access_token'
const REFRESH_KEY = 'florence_refresh_token'

// Keyring yoksa refresh token yalnızca bellekte tutulur (localStorage'a asla yazılmaz).
let memoryRefreshToken: string | null = null
// Eski localStorage kalıntılarından keyring'e migrasyon yalnızca bir kez denenir.
let migrationAttempted = false

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function secureGet(key: string): Promise<string | null> {
  try {
    const value = await invoke<string | null>('secure_store_get', { key })
    return value ?? null
  } catch {
    return null
  }
}

async function secureSet(key: string, value: string): Promise<boolean> {
  try {
    await invoke('secure_store_set', { key, value })
    return true
  } catch {
    return false
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    await invoke('secure_store_delete', { key })
  } catch {
    /* keyring yoksa sessizce geç */
  }
}

function lsGet(key: string): string | null {
  return localStorage.getItem(key)
}

function lsSet(key: string, value: string): void {
  localStorage.setItem(key, value)
}

function lsRemove(key: string): void {
  localStorage.removeItem(key)
}

export async function getAccessToken(): Promise<string | null> {
  if (!isTauri()) return null
  const secure = await secureGet(ACCESS_KEY)
  if (secure) return secure
  const ls = lsGet(ACCESS_KEY)
  if (ls) {
    if (!migrationAttempted) {
      migrationAttempted = true
      const refresh = lsGet(REFRESH_KEY) ?? ''
      void setTokens(ls, refresh)
    }
    return ls
  }
  return null
}

export async function getRefreshToken(): Promise<string | null> {
  if (!isTauri()) return null
  const secure = await secureGet(REFRESH_KEY)
  if (secure) return secure
  if (memoryRefreshToken) return memoryRefreshToken
  const ls = lsGet(REFRESH_KEY)
  if (ls) {
    if (!migrationAttempted) {
      migrationAttempted = true
      const access = lsGet(ACCESS_KEY) ?? ''
      void setTokens(access, ls)
    }
    return ls
  }
  return null
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  if (!isTauri()) return
  const accessOk = await secureSet(ACCESS_KEY, accessToken)
  const refreshOk = await secureSet(REFRESH_KEY, refreshToken)
  if (accessOk && refreshOk) {
    memoryRefreshToken = null
    lsRemove(ACCESS_KEY)
    lsRemove(REFRESH_KEY)
  } else {
    // Keyring başarısız: access token localStorage'a düşer (fallback),
    // refresh token asla localStorage'a yazılmaz, yalnızca bellekte tutulur.
    memoryRefreshToken = refreshToken
    lsSet(ACCESS_KEY, accessToken)
    lsRemove(REFRESH_KEY)
  }
}

export async function clearTokens(): Promise<void> {
  if (!isTauri()) return
  await secureDelete(ACCESS_KEY)
  await secureDelete(REFRESH_KEY)
  memoryRefreshToken = null
  migrationAttempted = false
  lsRemove(ACCESS_KEY)
  lsRemove(REFRESH_KEY)
}

export async function desktopNotify(title: string, body: string): Promise<void> {
  if (!isTauri()) return
  try {
    await invoke('notify', { title, body })
  } catch {
    /* bildirim desteklenmiyorsa sessizce geç */
  }
}
