import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });

    res.cookies.delete('user', { path: '/' });
    res.cookies.delete('accessToken', { path: '/' });

    return res;
  } catch (err) {
    console.error('[auth/logout] Error clearing auth cookies:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
