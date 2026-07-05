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

export function isMainlandPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function sendPhoneCode(phone) {
  if (!authing) throw new Error(authingConfigError)
  const response = await fetch(`${normalizedHost}/api/v3/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-authing-app-id': appId
    },
    body: JSON.stringify({
      phone,
      phoneCountryCode: '+86',
      channel: 'CHANNEL_LOGIN'
    })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.statusCode >= 400 || payload?.code >= 400) {
    const message = payload?.message || payload?.error || 'SEND_SMS_FAILED'
    throw new Error(message)
  }
  return payload
}

export async function loginByPhoneCode(phone, code) {
  if (!authing) throw new Error(authingConfigError)
  if (typeof authing.login !== 'function') {
    throw new Error('当前 Authing SDK 不支持验证码登录方法')
  }

  return authing.login({
    connection: 'PASSCODE',
    passCodePayload: {
      phone,
      phoneCountryCode: '+86',
      passCode: code
    },
    options: {
      autoRegister: false
    }
  }, 'passCode')
}

export function loginWithProvider(provider) {
  if (!authing) throw new Error(authingConfigError)
  return authing.loginWithRedirect({
    redirectUri,
    forced: true,
    customState: { provider },
    login_page_context: JSON.stringify({ preferredConnection: provider })
  })
}
