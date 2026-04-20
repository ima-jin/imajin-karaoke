import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, sessionCookieOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const attestationId = req.nextUrl.searchParams.get('attestation_id');
  const userDid = req.nextUrl.searchParams.get('user_did');

  if (!attestationId || !userDid) {
    return NextResponse.redirect(new URL('/?auth_error=missing_params', req.url));
  }

  const authUrl = process.env.IMAJIN_AUTH_URL;
  const appDid = process.env.IMAJIN_APP_DID;

  if (!authUrl || !appDid) {
    return NextResponse.redirect(new URL('/?auth_error=misconfigured', req.url));
  }

  let profileData: {
    did: string;
    displayName?: string;
    handle?: string;
    avatar?: string;
  };

  try {
    // Fetch user profile using app credentials
    const profileRes = await fetch(
      `${authUrl}/profile/api/profile/${encodeURIComponent(userDid)}`,
      {
        headers: {
          'X-App-DID': appDid,
          'X-App-Authorization': attestationId,
        },
      }
    );

    if (profileRes.status === 403) {
      return NextResponse.redirect(new URL('/?auth_error=attestation_revoked', req.url));
    }

    if (!profileRes.ok) {
      return NextResponse.redirect(new URL('/?auth_error=profile_fetch_failed', req.url));
    }

    profileData = await profileRes.json();
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=network_error', req.url));
  }

  const token = await createSessionToken({
    did: profileData.did,
    displayName: profileData.displayName ?? profileData.handle ?? profileData.did,
    handle: profileData.handle ?? profileData.did,
    avatar: profileData.avatar,
    attestationId,
  });

  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.set(sessionCookieOptions(token));
  return res;
}
