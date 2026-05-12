import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkTicketAccess } from '@/lib/imajin';

// GET /api/events/[eventId]/ticket-check - Check if current user has a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ hasAccess: false });
    }

    const { eventId } = await params;
    const hasAccess = await checkTicketAccess(eventId, session.did);

    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error('Error checking ticket access:', error);
    return NextResponse.json({ hasAccess: false });
  }
}
