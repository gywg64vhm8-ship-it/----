import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  authing,
  authingConfigError,
  loginByPhoneCode,
  loginWithProvider,
  sendPhoneCode
} from '../lib/authing'

const AuthContext = createContext(null)

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

async function fetchMerchantProfile(accessToken) {
  const response = await fetch('/api/merchant/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (response.status === 401) throw new Error('UNAUTHENTICATED')
  if (response.status === 403) throw new Error('NO_MERCHANT_PERMISSION')
  if (!response.ok) throw new Error('MERCHANT_PROFILE_FAILED')
  return response.json()
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

  const verifyMerchant = async (state) => {
    if (!state?.accessToken) throw new Error('UNAUTHENTICATED')
    const [userInfo, merchantProfile] = await Promise.all([
      authing.getUserInfo({ accessToken: state.accessToken }),
      fetchMerchantProfile(state.accessToken)
    ])
    if (userInfo?.statusCode >= 400) throw new Error('UNAUTHENTICATED')
    setLoginState(state)
    setUser(publicUser(userInfo, state))
    setMerchant(merchantProfile.merchant)
    return { userInfo, merchant: merchantProfile.merchant }
  }

  useEffect(() => {
    let mounted = true

    async function restoreSession() {
      if (!authing) {
        setLoading(false)
        return
      }

      try {
        const state = await authing.getLoginState()
        if (!mounted) return
        if (!state) {
          clearAuthData()
          setLoading(false)
          return
        }
        await verifyMerchant(state)
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

  const requestPhoneCode = async (phone) => sendPhoneCode(phone)

  const signInWithPhone = async ({ phone, code }) => {
    const state = await loginByPhoneCode(phone, code)
    return verifyMerchant(state)
  }

  const signInWithWechat = () => loginWithProvider('wechat')
  const signInWithAlipay = () => loginWithProvider('alipay')

  const handleRedirectCallback = async () => {
    if (!authing) throw new Error(authingConfigError)
    const state = authing.isRedirectCallback()
      ? await authing.handleRedirectCallback()
      : await authing.getLoginState({ ignoreCache: true })
    return verifyMerchant(state)
  }

  const signOut = async (options = {}) => {
    clearAuthData()
    if (options.localOnly) return
    if (authing) {
      await authing.logoutWithRedirect({ redirectUri: `${window.location.origin}/merchant/login` })
    }
  }

  const value = useMemo(() => ({
    user,
    merchant,
    session: loginState,
    token: loginState?.accessToken,
    loading,
    authError,
    isAuthenticated: Boolean(loginState?.accessToken && user && merchant),
    configError: authingConfigError,
    requestPhoneCode,
    signInWithPhone,
    signInWithWechat,
    signInWithAlipay,
    handleRedirectCallback,
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
