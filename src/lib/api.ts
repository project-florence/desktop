import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { apiConfig } from '@/config/api'
import { useAuthStore } from '@/stores/authStore'
import {
  isTauri,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/lib/desktop'

const baseURL = isTauri()
  ? (import.meta.env.VITE_API_URL || 'https://api.florencex.com.tr')
  : apiConfig.baseURL

const api = axios.create({
  baseURL,
  timeout: apiConfig.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Backend tarafindan servis edilen asset'lerin (orn. /avatars/*.svg) tam URL'ini cozer.
 * Dev'de Vite proxy'si yalnizca /api'yi kapsar; prod'da nginx same-origin sunar.
 */
export function resolveApiUrl(path: string): string {
  if (isTauri()) {
    return `${import.meta.env.VITE_API_URL || 'https://api.florencex.com.tr'}${path}`
  }
  if (import.meta.env.DEV) {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:7055'}${path}`
  }
  return path
}

api.interceptors.request.use(async (config) => {
  if (isTauri()) {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (isTauri()) {
    // Tauri: refresh token keyring'den alinir, body'de gonderilir.
    const refreshToken = await getRefreshToken()
    if (!refreshToken) return false
    try {
      const res = await axios.post(
        `${baseURL}/api/v1/auth/refresh`,
        { refresh_token: refreshToken },
        { withCredentials: true },
      )
      await setTokens(res.data.access_token, res.data.refresh_token)
      return true
    } catch {
      await clearTokens()
      return false
    }
  }

  // Web: httpOnly cookie ile refresh; token body'de degil.
  // Ham axios kullanildigi icin bu istek response interceptor'ina girmez (dongu yok).
  try {
    const res = await axios.post(`${baseURL}/api/v1/auth/refresh`, null, {
      withCredentials: true,
    })
    return res.status === 200
  } catch {
    return false
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    const status = error.response?.status

    // /auth/* isteklerinde (login, refresh vb.) refresh deneme — donguye girme.
    if (original?.url?.includes('/auth/')) {
      return Promise.reject(error)
    }

    if (status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? tryRefresh()
      const ok = await refreshing
      refreshing = null
      if (ok) {
        if (isTauri()) {
          original.headers.Authorization = `Bearer ${await getAccessToken()}`
        }
        return api(original)
      }
      await clearTokens()
      useAuthStore.getState().logout()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      return Promise.reject(error)
    }

    if (status === 401 && !window.location.pathname.includes('/login')) {
      useAuthStore.getState().logout()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
