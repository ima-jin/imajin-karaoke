import { NextResponse } from 'next/server';
import { db, karaokeConfig } from '@/db';
import { eq } from 'drizzle-orm';
import { fetchImajinEvent } from '@/lib/imajin';
import type { KaraokeConfig } from '@/db';

// GET /api/events/discoverable - List publicly discoverable karaoke events (no auth required)
export async function GET() {
  try {
    const configs = await db
      .select()
      .from(karaokeConfig)
      .where(eq(karaokeConfig.discoverable, true));

    const now = new Date();

    const events = await Promise.all(
      configs.map(async (config: KaraokeConfig) => {
        const event = await fetchImajinEvent(config.imajinEventId);
        if (!event) return null;
        return {
          ...event,
          signupMode: config.signupMode,
        };
      })
    );

    const validEvents = events.filter(Boolean) as NonNullable<typeof events[0]>[];

    // Sort: live events first, then upcoming
    validEvents.sort((a, b) => {
      const aStart = a!.startsAt ? new Date(a!.startsAt) : null;
      const bStart = b!.startsAt ? new Date(b!.startsAt) : null;
      const aEnd = a!.endsAt ? new Date(a!.endsAt) : null;
      const bEnd = b!.endsAt ? new Date(b!.endsAt) : null;

      const aIsLive = aStart && aStart <= now && (!aEnd || aEnd > now);
      const bIsLive = bStart && bStart <= now && (!bEnd || bEnd > now);

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // Both live or both not live — sort by start time (earliest first)
      if (aStart && bStart) {
        return aStart.getTime() - bStart.getTime();
      }
      return 0;
    });

    return NextResponse.json(validEvents);
  } catch (error) {
    console.error('Error fetching discoverable events:', error);
    return NextResponse.json({ error: 'Failed to fetch discoverable events' }, { status: 500 });
  }
}
