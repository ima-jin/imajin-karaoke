'use client';

import Link from 'next/link';
import type { ImajinEvent } from '@/lib/imajin';

interface EventCardProps {
  event: ImajinEvent;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = event.startsAt ? new Date(event.startsAt) : null;
  const isLive = startDate ? startDate <= new Date() : false;

  return (
    <Link href={`/${event.id}`}>
      <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-orange-500">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold text-white">{event.title}</h3>
          {isLive && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">
              LIVE
            </span>
          )}
        </div>
        {event.venue && (
          <p className="text-gray-400 text-sm mb-2">📍 {event.venue}</p>
        )}
        {startDate && (
          <p className="text-gray-500 text-sm">
            🕐 {startDate.toLocaleDateString()} at{' '}
            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </Link>
  );
}
