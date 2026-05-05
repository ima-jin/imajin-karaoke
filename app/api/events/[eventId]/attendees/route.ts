import { NextRequest, NextResponse } from 'next/server';
import { fetchEventAttendees } from '@/lib/imajin';

// GET /api/events/[eventId]/attendees - Proxy to kernel guests endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const attendees = await fetchEventAttendees(eventId);
    return NextResponse.json(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }
}
