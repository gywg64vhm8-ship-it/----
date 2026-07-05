const textEncoder = new TextEncoder()

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)))
}

async function verifyJwt(token, env) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error('INVALID_TOKEN')
  }

  const header = decodeJsonPart(encodedHeader)
  const payload = decodeJsonPart(encodedPayload)
  if (header.alg !== 'RS256' || !header.kid) throw new Error('UNSUPPORTED_TOKEN')

  const authingHost = (env.AUTHING_APP_HOST || '').replace(/\/$/, '')
  const appId = env.AUTHING_APP_ID
  if (!authingHost || !appId) throw new Error('AUTHING_ENV_MISSING')

  const issuer = `${authingHost}/oidc`
  const now = Math.floor(Date.now() / 1000)
  if (payload.iss !== issuer) throw new Error('INVALID_ISSUER')
  if (payload.aud !== appId && !(Array.isArray(payload.aud) && payload.aud.includes(appId))) throw new Error('INVALID_AUDIENCE')
  if (payload.exp && payload.exp < now) throw new Error('TOKEN_EXPIRED')

  const jwksResponse = await fetch(`${authingHost}/oidc/.well-known/jwks.json`, {
    headers: { accept: 'application/json' }
  })
  if (!jwksResponse.ok) throw new Error('JWKS_FAILED')

  const jwks = await jwksResponse.json()
  const jwk = jwks.keys?.find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('JWK_NOT_FOUND')

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    decodeBase64Url(encodedSignature),
    textEncoder.encode(`${encodedHeader}.${encodedPayload}`)
  )
  if (!verified) throw new Error('TOKEN_VERIFY_FAILED')
  return payload
}

async function queryMerchantUser(env, authingUserId) {
  if (!env.DB) throw new Error('DB_BINDING_MISSING')
  return env.DB
    .prepare(`
      SELECT authing_user_id, phone, provider, role, merchant_id, merchant_name, status, created_at
      FROM merchant_users
      WHERE authing_user_id = ?
      LIMIT 1
    `)
    .bind(authingUserId)
    .first()
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 })
}

export async function onRequestGet({ request, env }) {
  const authorization = request.headers.get('Authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!token) return json({ error: 'UNAUTHENTICATED' }, 401)

  try {
    const payload = await verifyJwt(token, env)
    const authingUserId = payload.sub
    if (!authingUserId) return json({ error: 'UNAUTHENTICATED' }, 401)

    const merchantUser = await queryMerchantUser(env, authingUserId)
    if (!merchantUser) return json({ error: 'FORBIDDEN' }, 403)
    if (merchantUser.status !== 'active') return json({ error: 'FORBIDDEN' }, 403)
    if (!['merchant', 'admin'].includes(merchantUser.role)) return json({ error: 'FORBIDDEN' }, 403)

    return json({
      merchant: {
        authingUserId: merchantUser.authing_user_id,
        phone: merchantUser.phone,
        provider: merchantUser.provider,
        role: merchantUser.role,
        merchantId: merchantUser.merchant_id,
        merchant_name: merchantUser.merchant_name,
        status: merchantUser.status,
        createdAt: merchantUser.created_at
      }
    })
  } catch (error) {
    const message = error?.message || 'TOKEN_ERROR'
    if (message.includes('FORBIDDEN')) return json({ error: 'FORBIDDEN' }, 403)
    return json({ error: 'UNAUTHENTICATED' }, 401)
  }
}
