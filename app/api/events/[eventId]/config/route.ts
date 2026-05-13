import { NextRequest, NextResponse } from 'next/server';
import { db, karaokeConfig } from '@/db';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

// POST /api/events/[eventId]/config - Create karaoke config for event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    const [config] = await db
      .insert(karaokeConfig)
      .values({
        imajinEventId: eventId,
        signupMode: 'anyone',
        discoverable: false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: karaokeConfig.imajinEventId,
        set: { updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({ signupMode: config.signupMode, discoverable: config.discoverable });
  } catch (error) {
    console.error('Error creating config:', error);
    return NextResponse.json({ error: 'Failed to create config' }, { status: 500 });
  }
}

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
      return NextResponse.json({ signupMode: 'anyone', discoverable: false });
    }

    return NextResponse.json({ signupMode: config.signupMode, discoverable: config.discoverable });
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
    const { signupMode, discoverable } = body;

    const updateSet: Partial<typeof karaokeConfig.$inferInsert> = { updatedAt: new Date() };
    const insertValues: typeof karaokeConfig.$inferInsert = {
      imajinEventId: eventId,
      signupMode: 'anyone',
      discoverable: false,
      updatedAt: new Date(),
    };

    if (signupMode !== undefined) {
      if (!['anyone', 'attendees_only'].includes(signupMode)) {
        return NextResponse.json(
          { error: 'Invalid signupMode. Must be: anyone or attendees_only' },
          { status: 400 }
        );
      }
      updateSet.signupMode = signupMode;
      insertValues.signupMode = signupMode;
    }

    if (discoverable !== undefined) {
      if (typeof discoverable !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid discoverable. Must be a boolean' },
          { status: 400 }
        );
      }
      updateSet.discoverable = discoverable;
      insertValues.discoverable = discoverable;
    }

    const [config] = await db
      .insert(karaokeConfig)
      .values(insertValues)
      .onConflictDoUpdate({
        target: karaokeConfig.imajinEventId,
        set: updateSet,
      })
      .returning();

    return NextResponse.json({ signupMode: config.signupMode, discoverable: config.discoverable });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
