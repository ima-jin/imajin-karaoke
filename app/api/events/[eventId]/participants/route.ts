import { NextRequest, NextResponse } from 'next/server';
import { db, participants, karaokeConfig } from '@/db';
import { eq, max, and, or } from 'drizzle-orm';
import { fetchEventAttendees } from '@/lib/imajin';

// POST /api/events/[eventId]/participants - Sign up for event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { name, phone, attendeeDid } = body;

    // Check event config
    const [config] = await db
      .select()
      .from(karaokeConfig)
      .where(eq(karaokeConfig.imajinEventId, eventId));

    const signupMode = config?.signupMode ?? 'anyone';
    let participantName: string;
    let participantDid: string | undefined;

    if (signupMode === 'attendees_only') {
      if (!attendeeDid) {
        return NextResponse.json(
          { error: 'attendeeDid is required for attendee-only events' },
          { status: 400 }
        );
      }

      // Fetch attendees from kernel and verify
      const attendees = await fetchEventAttendees(eventId);
      const attendee = attendees.find((a) => a.did === attendeeDid);

      if (!attendee) {
        return NextResponse.json(
          { error: 'Attendee not found for this event' },
          { status: 403 }
        );
      }

      participantName = attendee.displayName;
      participantDid = attendee.did;

      // Check for duplicate: this DID already has a waiting/active entry
      const [existing] = await db
        .select()
        .from(participants)
        .where(
          and(
            eq(participants.imajinEventId, eventId),
            eq(participants.participantDid, participantDid),
            or(eq(participants.status, 'waiting'), eq(participants.status, 'active'))
          )
        );

      if (existing) {
        return NextResponse.json(
          { error: 'You are already signed up for this event' },
          { status: 409 }
        );
      }
    } else {
      // Anyone mode: name from body
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }
      participantName = name.trim();
    }

    // Get the next position
    const [result] = await db
      .select({ maxPosition: max(participants.position) })
      .from(participants)
      .where(eq(participants.imajinEventId, eventId));

    const nextPosition = (result?.maxPosition ?? 0) + 1;

    // Create the participant
    const [newParticipant] = await db
      .insert(participants)
      .values({
        imajinEventId: eventId,
        name: participantName,
        participantDid: participantDid || null,
        position: nextPosition,
        status: 'waiting',
        phone: phone || null,
      })
      .returning();

    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    console.error('Error signing up:', error);
    return NextResponse.json({ error: 'Failed to sign up' }, { status: 500 });
  }
}
