'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ImajinEvent } from '@/lib/imajin';
import type { SessionUser } from '@/lib/auth';

interface EventWithConfig extends ImajinEvent {
  hasKaraokeConfig?: boolean;
}

function EventCard({
  event,
  action,
}: {
  event: ImajinEvent;
  action: 'manage' | 'enable' | 'join';
}) {
  const router = useRouter();
  const [isEnabling, setIsEnabling] = useState(false);
  const startDate = event.startsAt ? new Date(event.startsAt) : null;
  const isLive = startDate ? startDate <= new Date() : false;

  const handleEnable = async () => {
    setIsEnabling(true);
    try {
      const res = await fetch(`/api/events/${event.id}/config`, {
        method: 'POST',
      });
      if (res.ok) {
        router.push(`/${event.id}/admin`);
      } else {
        console.error('Failed to enable karaoke');
        setIsEnabling(false);
      }
    } catch (err) {
      console.error('Error enabling karaoke:', err);
      setIsEnabling(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-white">{event.title}</h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
              LIVE
            </span>
          )}
          {action === 'manage' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
              KARAOKE ON
            </span>
          )}
        </div>
      </div>
      {event.venue && (
        <p className="text-gray-400 text-sm mb-2">📍 {event.venue}</p>
      )}
      {startDate && (
        <p className="text-gray-500 text-sm mb-3">
          🕐 {startDate.toLocaleDateString()} at{' '}
          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      {action === 'manage' && (
        <Link
          href={`/${event.id}/admin`}
          className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium text-sm"
        >
          Manage Karaoke →
        </Link>
      )}
      {action === 'enable' && (
        <button
          onClick={handleEnable}
          disabled={isEnabling}
          className="inline-flex items-center px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {isEnabling ? 'Enabling...' : 'Enable Karaoke'}
        </button>
      )}
      {action === 'join' && (
        <Link
          href={`/${event.id}`}
          className="inline-flex items-center text-orange-500 hover:text-orange-400 font-medium text-sm"
        >
          Join Queue →
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const [myEvents, setMyEvents] = useState<EventWithConfig[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<ImajinEvent[]>([]);
  const [discoverableEvents, setDiscoverableEvents] = useState<ImajinEvent[]>([]);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDiscoverable, setIsLoadingDiscoverable] = useState(true);

  const fetchDiscoverable = useCallback(async () => {
    try {
      const res = await fetch('/api/events/discoverable');
      if (res.ok) {
        const data = await res.json();
        setDiscoverableEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch discoverable events:', error);
    } finally {
      setIsLoadingDiscoverable(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch session first
      const sessionRes = await fetch('/api/auth/session');
      const session = sessionRes.ok ? await sessionRes.json() : null;
      setSessionUser(session);

      if (session) {
        // Fetch my events and attending events in parallel
        const [myRes, attendingRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/events/attending'),
        ]);

        if (myRes.ok) {
          const myData = await myRes.json();
          setMyEvents(myData);
        }

        if (attendingRes.ok) {
          const attendingData = await attendingRes.json();
          setAttendingEvents(attendingData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchDiscoverable();
  }, [fetchData, fetchDiscoverable]);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            🎤 <span className="text-orange-500">Karaoke</span>
          </h1>
        </div>

        {/* Live Karaoke — visible without signing in */}
        {!isLoadingDiscoverable && discoverableEvents.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span>🎤 Live Karaoke</span>
              <span className="text-sm text-gray-500 font-normal">
                ({discoverableEvents.length})
              </span>
            </h2>
            <div className="space-y-4">
              {discoverableEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  action="join"
                />
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : !sessionUser ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Sign in with Imajin to manage karaoke for your events
            </p>
            <p className="text-gray-600 text-sm">
              Direct event links still work without signing in.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* My Events */}
            <section>
              <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span>My Events</span>
                <span className="text-sm text-gray-500 font-normal">
                  ({myEvents.length})
                </span>
              </h2>
              {myEvents.length === 0 ? (
                <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700/50">
                  <p className="text-gray-500">
                    No events yet. Create an event in the Imajin app to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      action={event.hasKaraokeConfig ? 'manage' : 'enable'}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Events I'm Attending */}
            <section>
              <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span>Events I&apos;m Attending</span>
                <span className="text-sm text-gray-500 font-normal">
                  ({attendingEvents.length})
                </span>
              </h2>
              {attendingEvents.length === 0 ? (
                <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700/50">
                  <p className="text-gray-500">
                    You&apos;re not attending any events yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      action="join"
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
