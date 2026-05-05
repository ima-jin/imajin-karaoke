'use client';

import { useState, useEffect, useCallback } from 'react';
import { EventCard } from '@/components/EventCard';
import type { ImajinEvent } from '@/lib/imajin';

export default function Home() {
  const [events, setEvents] = useState<ImajinEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            🎤 <span className="text-orange-500">Karaoke</span>
          </h1>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No events yet</p>
            <p className="text-gray-600 text-sm">
              Events are managed in the Imajin app.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
