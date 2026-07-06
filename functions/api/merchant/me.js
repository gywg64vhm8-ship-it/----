import { createRemoteJWKSet, jwtVerify } from 'jose'

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'cache-control': 'no-store'
    }
  })
}

function serverConfig(context) {
  return {
    issuer: context.env.AUTHING_ISSUER,
    audience: context.env.AUTHING_AUDIENCE,
    jwksUrl: context.env.AUTHING_JWKS_URL
  }
}

async function verifyAuthingToken(token, context) {
  const { issuer, audience, jwksUrl } = serverConfig(context)
  if (!issuer || !audience || !jwksUrl) {
    const error = new Error('authing_server_config_missing')
    error.status = 500
    throw error
  }

  const jwks = createRemoteJWKSet(new URL(jwksUrl))
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience
    })
    return payload
  } catch (error) {
    const isRemoteJwksError = error?.code?.includes('JWKS') || error?.message?.includes('JWKS')
    if (isRemoteJwksError) error.status = 500
    else error.status = 401
    throw error
  }
}

async function queryMerchant(context, authingUserId) {
  if (!context.env.DB) {
    const error = new Error('db_binding_missing')
    error.status = 500
    throw error
  }

  return context.env.DB
    .prepare(`
      SELECT
        authing_user_id,
        merchant_id,
        phone,
        provider,
        role,
        status
      FROM merchant_users
      WHERE authing_user_id = ?
        AND status = 'active'
      LIMIT 1
    `)
    .bind(authingUserId)
    .first()
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 })
}

export async function onRequestGet(context) {
  const authorization = context.request.headers.get('Authorization') || ''

  if (!authorization.startsWith('Bearer ')) {
    console.log('merchant auth debug', {
      hasAuthorization: Boolean(authorization),
      tokenLength: 0,
      issuer: context.env.AUTHING_ISSUER,
      audience: context.env.AUTHING_AUDIENCE,
      subject: null
    })
    return json({
      error: 'missing_authorization_header',
      message: '请求未携带登录凭证'
    }, 401)
  }

  const token = authorization.slice(7).trim()
  if (!token) {
    console.log('merchant auth debug', {
      hasAuthorization: true,
      tokenLength: 0,
      issuer: context.env.AUTHING_ISSUER,
      audience: context.env.AUTHING_AUDIENCE,
      subject: null
    })
    return json({
      error: 'missing_access_token',
      message: '登录凭证为空'
    }, 401)
  }

  try {
    const payload = await verifyAuthingToken(token, context)
    const authingUserId = payload.sub

    console.log('merchant auth debug', {
      hasAuthorization: Boolean(authorization),
      tokenLength: token.length,
      issuer: context.env.AUTHING_ISSUER,
      audience: context.env.AUTHING_AUDIENCE,
      subject: authingUserId || null
    })

    if (!authingUserId) {
      return json({
        error: 'missing_token_subject',
        message: '登录凭证缺少用户标识'
      }, 401)
    }

    const merchant = await queryMerchant(context, authingUserId)
    if (!merchant || !['merchant', 'admin'].includes(merchant.role)) {
      return json({
        error: 'merchant_not_authorized',
        message: '当前账号未开通商家权限'
      }, 403)
    }

    return json({
      authenticated: true,
      merchant
    })
  } catch (error) {
    const status = error?.status || 500
    if (status === 401) {
      return json({
        error: 'invalid_access_token',
        message: '登录状态无效，请重新登录'
      }, 401)
    }
    if (status === 403) {
      return json({
        error: 'merchant_not_authorized',
        message: '当前账号未开通商家权限'
      }, 403)
    }
    console.error('merchant auth service error', {
      message: error?.message,
      code: error?.code || null
    })
    return json({
      error: 'merchant_auth_service_error',
      message: '商家权限验证服务异常，请稍后再试'
    }, 500)
  }
}
