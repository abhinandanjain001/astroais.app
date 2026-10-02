import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function verifyFirebaseUser(request: Request, keyResolver: JWTVerifyGetKey = keys) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ') || header.length > 10000) throw new Error('Sign-in required');
  const { payload } = await jwtVerify(header.slice(7), keyResolver, {
    algorithms: ['RS256'],
    issuer: 'https://securetoken.google.com/astroais',
    audience: 'astroais',
    requiredClaims: ['exp', 'iat', 'auth_time', 'sub'],
  });
  const now = Math.floor(Date.now() / 1000);
  if (!payload.sub || payload.sub.length > 128 || typeof payload.iat !== 'number' || payload.iat > now ||
      typeof payload.auth_time !== 'number' || payload.auth_time > now) throw new Error('Invalid identity');
  return { uid: payload.sub };
}

export const signInRequired = () => Response.json({ error: 'Please sign in again to continue your conversation.' }, {
  status: 401, headers: { 'Cache-Control': 'no-store' },
});
