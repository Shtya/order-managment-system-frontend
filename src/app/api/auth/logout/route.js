import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });


    res.cookies.delete('user');

    res.cookies.delete('accessToken');

    return res;
  } catch (err) {
    console.error('Error clearing user cookie:', err);
    return NextResponse.json({ message: 'Unexpected error' }, { status: 500 });
  }
}
