import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from './jwt';

const COOKIE_NAME = 'auth-token';

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export async function setSession(payload: JWTPayload): Promise<void> {
  const cookieStore = await cookies();
  const { generateToken } = await import('./jwt');
  const token = generateToken(payload);
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

