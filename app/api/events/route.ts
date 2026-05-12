import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchImajinEvents } from '@/lib/imajin';
import { db, karaokeConfig } from '@/db';
import { inArray } from 'drizzle-orm';

// GET /api/events - List events from Imajin kernel, filtered to user's events
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await fetchImajinEvents();
    const userEvents = events.filter((e) => e.creatorDid === session.did);

    // Check which events have karaoke config
    const eventIds = userEvents.map((e) => e.id);
    let configs: Array<{ imajinEventId: string; signupMode: string }> = [];
    if (eventIds.length > 0) {
      configs = await db
        .select({ imajinEventId: karaokeConfig.imajinEventId, signupMode: karaokeConfig.signupMode })
        .from(karaokeConfig)
        .where(inArray(karaokeConfig.imajinEventId, eventIds));
    }

    const configMap = new Map(configs.map((c) => [c.imajinEventId, c]));

    const eventsWithConfig = userEvents.map((event) => ({
      ...event,
      hasKaraokeConfig: configMap.has(event.id),
    }));

    return NextResponse.json(eventsWithConfig);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
