import { getSession } from '@/lib/auth';

export interface ImajinEvent {
  id: string;
  title: string;
  venue?: string;
  startsAt: string;
  endsAt?: string;
  status: string;
  creatorDid: string;
}

export interface ImajinAttendee {
  did: string;
  displayName: string;
  handle?: string;
  avatar?: string;
  ticketId?: string;
}

/**
 * Build headers for kernel API calls.
 * Uses the session's attestation ID (per-user consent) when available,
 * falls back to env var for service-level calls.
 */
async function getHeaders(): Promise<Record<string, string>> {
  const appDid = process.env.IMAJIN_APP_DID;

  // Try session attestation first (per-user), fall back to env var (service-level)
  const session = await getSession().catch(() => null);
  const attestationId = session?.attestationId ?? process.env.IMAJIN_APP_ATTESTATION_ID;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (appDid) headers['X-App-DID'] = appDid;
  if (attestationId) headers['X-App-Authorization'] = attestationId;

  return headers;
}

export async function fetchImajinEvents(): Promise<ImajinEvent[]> {
  const eventsUrl = process.env.IMAJIN_EVENTS_URL;
  if (!eventsUrl) {
    console.error('IMAJIN_EVENTS_URL is not set');
    return [];
  }

  const res = await fetch(`${eventsUrl}/api/events`, {
    headers: await getHeaders(),
  });

  if (!res.ok) {
    console.error('Failed to fetch Imajin events:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchImajinEvent(eventId: string): Promise<ImajinEvent | null> {
  const eventsUrl = process.env.IMAJIN_EVENTS_URL;
  if (!eventsUrl) {
    console.error('IMAJIN_EVENTS_URL is not set');
    return null;
  }

  const res = await fetch(`${eventsUrl}/api/events/${eventId}`, {
    headers: await getHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    console.error('Failed to fetch Imajin event:', res.status, await res.text());
    return null;
  }

  return res.json();
}

export async function fetchEventAttendees(eventId: string): Promise<ImajinAttendee[]> {
  const eventsUrl = process.env.IMAJIN_EVENTS_URL;
  if (!eventsUrl) {
    console.error('IMAJIN_EVENTS_URL is not set');
    return [];
  }

  const res = await fetch(`${eventsUrl}/api/events/${eventId}/guests`, {
    headers: await getHeaders(),
  });

  if (!res.ok) {
    console.error('Failed to fetch event attendees:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createPerformanceAttestation(
  singerDid: string,
  eventId: string,
  eventTitle: string
): Promise<void> {
  const authUrl = process.env.IMAJIN_AUTH_URL;
  if (!authUrl) {
    console.error('IMAJIN_AUTH_URL is not set');
    return;
  }

  try {
    const res = await fetch(`${authUrl}/auth/api/attestations`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({
        type: 'karaoke.performance',
        subjectDid: singerDid,
        payload: {
          eventId,
          eventTitle,
          completedAt: new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      console.error('Failed to create performance attestation:', res.status, await res.text());
    }
  } catch (error) {
    console.error('Error creating performance attestation:', error);
  }
}

export async function checkTicketAccess(eventId: string, userDid: string): Promise<boolean> {
  const eventsUrl = process.env.IMAJIN_EVENTS_URL;
  if (!eventsUrl) {
    console.error('IMAJIN_EVENTS_URL is not set');
    return false;
  }

  const res = await fetch(`${eventsUrl}/api/events/${eventId}/tickets?did=${encodeURIComponent(userDid)}`, {
    headers: await getHeaders(),
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return data?.hasAccess === true;
}
