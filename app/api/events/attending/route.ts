import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchImajinEvents, checkTicketAccess } from '@/lib/imajin';

// GET /api/events/attending - List events where user has a ticket but is not the creator
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await fetchImajinEvents();
    const userDid = session.did;

    // Filter to events where user is NOT creator, then check ticket access
    const candidateEvents = events.filter((e) => e.creatorDid !== userDid);

    // Check ticket access for each candidate event
    const results = await Promise.all(
      candidateEvents.map(async (event) => {
        const hasAccess = await checkTicketAccess(event.id, userDid);
        return { event, hasAccess };
      })
    );

    const attendingEvents = results
      .filter((r) => r.hasAccess)
      .map((r) => r.event);

    return NextResponse.json(attendingEvents);
  } catch (error) {
    console.error('Error fetching attending events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
