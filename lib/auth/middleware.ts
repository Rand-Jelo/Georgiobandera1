import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './session';

export async function requireAuth(request: NextRequest): Promise<{
  authorized: boolean;
  response?: NextResponse;
}> {
  const session = await getSession();
  
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.redirect(new URL('/login', request.url)),
    };
  }

  return { authorized: true };
}

