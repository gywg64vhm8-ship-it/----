import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  authing,
  authingConfigError,
  loginWithAuthingRedirect
} from '../lib/authing'

const AuthContext = createContext(null)

export function getAccessToken(loginState) {
  return loginState?.accessToken || loginState?.access_token || ''
}

function publicUser(userInfo, loginState) {
  if (!userInfo && !loginState) return null
  return {
    id: userInfo?.sub || userInfo?.userId || loginState?.parsedIdToken?.sub,
    phone: userInfo?.phone_number || userInfo?.phone || loginState?.parsedIdToken?.phone_number,
    email: userInfo?.email || loginState?.parsedIdToken?.email,
    name: userInfo?.name || userInfo?.nickname || loginState?.parsedIdToken?.name,
    picture: userInfo?.picture,
    provider: userInfo?.identities?.[0]?.provider || loginState?.customState?.provider || 'phone'
  }
}

export async function verifyMerchantAccessToken(accessToken) {
  if (!accessToken) {
    const error = new Error('missing_access_token')
    error.status = 401
    throw error
  }

  const response = await fetch('/api/merchant/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    },
    cache: 'no-store'
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `merchant_api_${response.status}`)
    error.status = response.status
    error.details = data
    throw error
  }

  return data
}

export function AuthProvider({ children }) {
  const [loginState, setLoginState] = useState(null)
  const [user, setUser] = useState(null)
  const [merchant, setMerchant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const clearAuthData = () => {
    setLoginState(null)
    setUser(null)
    setMerchant(null)
  }

  const verifyMerchant = async (accessToken, state = null) => {
    const [userInfo, merchantProfile] = await Promise.all([
      authing.getUserInfo({ accessToken }),
      verifyMerchantAccessToken(accessToken)
    ])
    if (userInfo?.statusCode >= 400) throw new Error('UNAUTHENTICATED')
    if (state) setLoginState(state)
    setUser(publicUser(userInfo, state))
    setMerchant(merchantProfile.merchant)
    return { userInfo, merchant: merchantProfile.merchant }
  }

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      const isCallbackPath = window.location.pathname === '/auth/callback'
      if (isCallbackPath) {
        setLoading(false)
        return
      }
      if (!authing) {
        setLoading(false)
        return
      }

      try {
        const state = await authing.getLoginState({ ignoreCache: false })
        if (!mounted) return
        const accessToken = getAccessToken(state)
        if (!state || !accessToken) {
          clearAuthData()
          if (state && !accessToken) setAuthError('missing_access_token')
          setLoading(false)
          return
        }
        setLoginState(state)
        const userInfo = await authing.getUserInfo({ accessToken })
        if (mounted && userInfo?.statusCode < 400) {
          setUser(publicUser(userInfo, state))
        }
      } catch (error) {
        if (mounted) {
          clearAuthData()
          setAuthError(error.message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    restoreSession()
    return () => {
      mounted = false
    }
  }, [])

  const signInWithHostedLogin = () => loginWithAuthingRedirect()

  const signOut = async (options = {}) => {
    clearAuthData()
    if (options.localOnly) return
    if (authing) {
      await authing.logoutWithRedirect({ redirectUri: 'https://minsu-4h7.pages.dev/merchant/login' })
    }
  }

  const value = useMemo(() => ({
    user,
    merchant,
    session: loginState,
    token: getAccessToken(loginState),
    loading,
    authError,
    isAuthenticated: Boolean(getAccessToken(loginState)),
    configError: authingConfigError,
    signInWithHostedLogin,
    signOut,
    verifyMerchant
  }), [user, merchant, loginState, loading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
