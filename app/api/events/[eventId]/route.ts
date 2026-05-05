import { NextRequest, NextResponse } from 'next/server';
import { db, participants } from '@/db';
import { eq, asc } from 'drizzle-orm';
import { fetchImajinEvent } from '@/lib/imajin';

// GET /api/events/[eventId] - Get event from kernel with local participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await fetchImajinEvent(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.imajinEventId, eventId))
      .orderBy(asc(participants.position));

    return NextResponse.json({ ...event, participants: eventParticipants });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}
