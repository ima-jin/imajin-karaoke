'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { SessionUser } from '@/lib/auth';

export function ImajinAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const authUrl = process.env.NEXT_PUBLIC_IMAJIN_AUTH_URL ?? 'https://dev-www.imajin.ai';
  const appId = process.env.NEXT_PUBLIC_IMAJIN_APP_ID ?? '';

  if (loading) {
    return <div className="w-24 h-9 bg-gray-700 rounded-lg animate-pulse" />;
  }

  if (!user) {
    const signInUrl = `${authUrl}/auth/authorize?app_id=${appId}&scopes=profile:read`;
    return (
      <a
        href={signInUrl}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors text-sm"
      >
        Sign in with Imajin
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.displayName}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold text-sm">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm text-gray-200 hidden sm:block">{user.displayName}</span>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
