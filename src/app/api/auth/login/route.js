import { NextResponse } from 'next/server';

// Keep ONLY the fields the middleware actually needs.
// See src/middleware.js for usage: role.name, onboardingStatus.
// This prevents oversized cookies (~4KB limit) and circular JSON errors.
function sanitizeUserForCookie(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user?.role ? { name: user.role.name } : undefined,
    onboardingStatus: user.onboardingStatus,
  };
}

export async function POST(req) {
  try {
    let accessToken;
    let user;

    try {
      ({ accessToken, user } = await req.json());
    } catch (err) {
      console.error('[auth/login] Invalid JSON body:', err);
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ message: 'Missing user' }, { status: 400 });
    }

    // Sanitize to minimal fields to avoid cookie size / circular JSON issues
    const sanitizedUser = sanitizeUserForCookie(user);

    let userCookieValue;
    try {
      userCookieValue = JSON.stringify(sanitizedUser);
    } catch (jsonErr) {
      console.error('[auth/login] Failed to stringify sanitized user:', jsonErr, 'user:', user);
      return NextResponse.json({ message: 'Invalid user payload' }, { status: 400 });
    }

    // Log cookie size in production for debugging (warn if approaching 4KB limit)
    const cookieSize = Buffer.byteLength(userCookieValue, 'utf8');
    if (cookieSize > 3000) {
      console.warn(`[auth/login] User cookie is large: ${cookieSize} bytes. This may cause 502 errors behind a reverse proxy.`);
    }

    const res = NextResponse.json({ ok: true, user });
    const oneWeek = 60 * 60 * 24 * 7;
    const isProd = process.env.NODE_ENV === 'production';

    res.cookies.set('user', userCookieValue, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: oneWeek,
    });

    res.cookies.set('accessToken', accessToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: oneWeek,
    });

    return res;
  } catch (err) {
    console.error('[auth/login] Unexpected error setting cookie:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}

