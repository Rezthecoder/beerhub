import { NextResponse, type NextRequest } from 'next/server';

/**
 * Password-protects the admin page and the internal test endpoints with HTTP Basic Auth.
 * Set ADMIN_USER and ADMIN_PASSWORD in the hosting environment (Vercel → Settings → Environment Variables).
 * If ADMIN_PASSWORD is missing, these pages stay locked instead of opening up.
 */
export const config = {
  matcher: ['/admin/:path*', '/api/test-:path*'],
};

function unauthorized(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="BeerHub admin", charset="UTF-8"' },
  });
}

/** Constant-time comparison so the password can't be guessed from response timing. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_USER || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return new NextResponse('Admin is locked: ADMIN_PASSWORD is not set.', { status: 503 });
  }

  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) {
    return unauthorized('Login required');
  }

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized('Login required');
  }
  const sep = decoded.indexOf(':');
  const givenUser = sep === -1 ? decoded : decoded.slice(0, sep);
  const givenPassword = sep === -1 ? '' : decoded.slice(sep + 1);

  if (safeEqual(givenUser, user) && safeEqual(givenPassword, password)) {
    return NextResponse.next();
  }
  return unauthorized('Wrong username or password');
}
