import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigError } from '../lib/supabase'

const AuthContext = createContext(null)

function hasMerchantAccess(user) {
  if (!user) return false
  const appRole = user.app_metadata?.role
  const appRoles = user.app_metadata?.roles
  const userRole = user.user_metadata?.role
  return appRole === 'merchant' || userRole === 'merchant' || (Array.isArray(appRoles) && appRoles.includes('merchant'))
}

function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    email: user.email,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    if (!supabase) {
      setLoading(false)
      return undefined
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const nextUser = data.session?.user ?? null
      if (nextUser && !hasMerchantAccess(nextUser)) {
        supabase.auth.signOut()
        setSession(null)
        setUser(null)
      } else {
        setSession(data.session ?? null)
        setUser(publicUser(nextUser))
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUser = nextSession?.user ?? null
      if (nextUser && !hasMerchantAccess(nextUser)) {
        supabase.auth.signOut()
        setSession(null)
        setUser(null)
        setLoading(false)
        return
      }
      setSession(nextSession ?? null)
      setUser(publicUser(nextUser))
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async ({ email, password }) => {
    if (!supabase) {
      return { error: { message: supabaseConfigError || 'Supabase 未正确配置。' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }

    if (!hasMerchantAccess(data.user)) {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      return { error: { message: 'NO_MERCHANT_PERMISSION' } }
    }

    setSession(data.session)
    setUser(publicUser(data.user))
    return { data }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  const value = useMemo(() => ({
    user,
    session,
    loading,
    isAuthenticated: Boolean(session && user),
    signIn,
    signOut,
    configError: supabaseConfigError
  }), [user, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
