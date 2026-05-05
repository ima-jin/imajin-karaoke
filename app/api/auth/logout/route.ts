import { NextRequest, NextResponse } from 'next/server';
import { clearCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(clearCookieOptions());
  return res;
}
