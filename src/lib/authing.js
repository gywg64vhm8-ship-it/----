import { Authing } from '@authing/web'

const appId = import.meta.env.VITE_AUTHING_APP_ID
const appHost = import.meta.env.VITE_AUTHING_APP_HOST
const redirectUri = import.meta.env.VITE_AUTHING_REDIRECT_URI

export const authingConfigError = !appId || !appHost || !redirectUri
  ? 'Authing 环境变量缺失：请配置 VITE_AUTHING_APP_ID、VITE_AUTHING_APP_HOST 和 VITE_AUTHING_REDIRECT_URI。'
  : ''

const normalizedHost = appHost?.replace(/\/$/, '')

export const authing = authingConfigError
  ? null
  : new Authing({
      appId,
      domain: normalizedHost,
      redirectUri,
      scope: 'openid profile phone email',
      redirectResponseMode: 'query'
    })

export function loginWithAuthingRedirect() {
  if (!authing) throw new Error(authingConfigError)
  return authing.loginWithRedirect()
}
