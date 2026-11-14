import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'clinicos_session';
const SESSION_HOURS = 8;

export interface SessionPayload {
  userId: string;
  clinicId: string | null;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET ausente ou curto. Defina uma chave de pelo menos 32 caracteres em produção.',
    );
  }
  // Chave exclusiva de desenvolvimento local.
  return new TextEncoder().encode('clinicos-dev-only-secret-change-me-32chars');
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ clinicId: payload.clinicId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .setIssuer('clinicos')
    .setAudience('clinicos-web')
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'clinicos',
      audience: 'clinicos-web',
    });
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      clinicId: typeof payload.clinicId === 'string' ? payload.clinicId : null,
    };
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function writeSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  const token = await createSessionToken(payload);
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
