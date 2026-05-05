import { NextRequest, NextResponse } from 'next/server';
import { db, karaokeConfig } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// GET /api/events/[eventId]/config - Get karaoke config for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const [config] = await db
      .select()
      .from(karaokeConfig)
      .where(eq(karaokeConfig.imajinEventId, eventId));

    if (!config) {
      return NextResponse.json({ signupMode: 'anyone' });
    }

    return NextResponse.json({ signupMode: config.signupMode });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// PATCH /api/events/[eventId]/config - Update karaoke config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const { signupMode } = body;

    if (!signupMode || !['anyone', 'attendees_only'].includes(signupMode)) {
      return NextResponse.json(
        { error: 'Invalid signupMode. Must be: anyone or attendees_only' },
        { status: 400 }
      );
    }

    const [config] = await db
      .insert(karaokeConfig)
      .values({
        imajinEventId: eventId,
        signupMode,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: karaokeConfig.imajinEventId,
        set: { signupMode, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({ signupMode: config.signupMode });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
