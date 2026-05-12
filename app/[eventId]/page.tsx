'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ParticipantRow } from '@/components/ParticipantRow';
import { SignupForm } from '@/components/SignupForm';
import type { Participant } from '@/db';
import type { ImajinEvent } from '@/lib/imajin';
import type { SessionUser } from '@/lib/auth';

interface EventWithParticipants extends ImajinEvent {
  participants: Participant[];
}

type AccessState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'creator' }
  | { type: 'allowed' }
  | { type: 'needs_ticket' }
  | { type: 'anonymous_allowed' };

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState<EventWithParticipants | null>(null);
  const [signupMode, setSignupMode] = useState<'anyone' | 'attendees_only'>('anyone');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [accessState, setAccessState] = useState<AccessState>({ type: 'loading' });
  const formRef = useRef<HTMLFormElement>(null!);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        return data;
      } else if (res.status === 404) {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Failed to fetch event:', err);
      setError('Failed to load event');
    }
    return null;
  }, [eventId]);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Fetch event, session, and config in parallel
      const [eventData, sessionData, configData] = await Promise.all([
        fetchEvent(),
        fetch('/api/auth/session')
          .then((r) => r.json())
          .catch(() => null),
        fetch(`/api/events/${eventId}/config`)
          .then((r) => r.json())
          .catch(() => ({ signupMode: 'anyone' })),
      ]);

      if (!mounted) return;

      setSessionUser(sessionData);

      const mode = configData.signupMode ?? 'anyone';
      setSignupMode(mode);

      if (!eventData) {
        setAccessState({ type: 'error', message: 'Event not found' });
        setIsLoading(false);
        return;
      }

      // Creator always goes to admin
      if (sessionData?.did === eventData.creatorDid) {
        router.replace(`/${eventId}/admin`);
        return;
      }

      // Not signed in
      if (!sessionData) {
        if (mode === 'anyone') {
          setAccessState({ type: 'anonymous_allowed' });
        } else {
          setAccessState({ type: 'needs_ticket' });
        }
        setIsLoading(false);
        return;
      }

      // Signed in but not creator — check ticket if attendees_only
      if (mode === 'attendees_only') {
        try {
          const ticketRes = await fetch(`/api/events/${eventId}/ticket-check`);
          const ticketData = ticketRes.ok ? await ticketRes.json() : { hasAccess: false };
          if (ticketData.hasAccess) {
            setAccessState({ type: 'allowed' });
          } else {
            setAccessState({ type: 'needs_ticket' });
          }
        } catch {
          setAccessState({ type: 'needs_ticket' });
        }
      } else {
        // anyone mode — signed in users are allowed
        setAccessState({ type: 'allowed' });
      }

      setIsLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [eventId, fetchEvent, router]);

  // Poll for queue updates (only when access is granted)
  useEffect(() => {
    if (accessState.type !== 'allowed' && accessState.type !== 'anonymous_allowed') {
      return;
    }

    const interval = setInterval(fetchEvent, 3000);
    return () => clearInterval(interval);
  }, [fetchEvent, accessState]);

  const scrollToSignup = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading || accessState.type === 'loading') {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (error || accessState.type === 'error' || !event) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || (accessState.type === 'error' ? accessState.message : 'Event not found')}</p>
        <Link href="/" className="text-orange-500 hover:text-orange-400">
          ← Back to events
        </Link>
      </main>
    );
  }

  // Needs ticket screen
  if (accessState.type === 'needs_ticket') {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
          <p className="text-red-400 mb-6">You need a ticket to this event</p>
          {event.venue && (
            <p className="text-gray-400 text-sm mb-2">📍 {event.venue}</p>
          )}
          {event.startsAt && (
            <p className="text-gray-500 text-sm mb-6">
              🕐 {new Date(event.startsAt).toLocaleDateString()} at{' '}
              {new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <Link href="/" className="text-orange-500 hover:text-orange-400">
            ← Back to events
          </Link>
        </div>
      </main>
    );
  }

  const waitingParticipants = event.participants.filter(
    (p) => p.status === 'waiting' || p.status === 'active'
  );
  const doneParticipants = event.participants.filter(
    (p) => p.status === 'complete' || p.status === 'skipped'
  );

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🎤 {event.title}</h1>
              {event.venue && (
                <p className="text-gray-400 text-sm">📍 {event.venue}</p>
              )}
            </div>
            <button
              onClick={scrollToSignup}
              className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              + Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Queue */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        {waitingParticipants.length === 0 && doneParticipants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No one in the queue yet. Be the first to sign up!
          </div>
        ) : (
          <>
            {/* Waiting queue */}
            {waitingParticipants.map((p, i) => (
              <ParticipantRow key={p.id} participant={p} position={i + 1} />
            ))}

            {/* Completed section */}
            {doneParticipants.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-800 text-gray-500 text-sm uppercase tracking-wide">
                  Completed ({doneParticipants.length})
                </div>
                {doneParticipants.map((p, i) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    position={waitingParticipants.length + i + 1}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Signup form at bottom */}
      <div className="sticky bottom-0 max-w-2xl mx-auto w-full">
        <SignupForm
          eventId={eventId}
          onSignup={fetchEvent}
          formRef={formRef}
          defaultName={sessionUser?.displayName}
          signupMode={signupMode}
          participants={event.participants}
        />
      </div>
    </main>
  );
}
