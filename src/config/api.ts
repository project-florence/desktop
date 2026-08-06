export const apiConfig = {
  // Production traffic is served through nginx's same-origin /api proxy.
  baseURL: '',
  timeout: 30000,
  tokenKey: 'florence_token',
} as const
