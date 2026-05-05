import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchImajinEvents } from '@/lib/imajin';

// GET /api/events - List events from Imajin kernel, filtered to user's events
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await fetchImajinEvents();
    const userEvents = events.filter((e) => e.creatorDid === session.did);

    return NextResponse.json(userEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
