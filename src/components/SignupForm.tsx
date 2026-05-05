'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Attendee {
  did: string;
  displayName: string;
  handle?: string;
  avatar?: string;
}

interface SignupFormProps {
  eventId: string;
  onSignup: () => void;
  formRef?: React.RefObject<HTMLFormElement>;
  defaultName?: string;
  signupMode?: 'anyone' | 'attendees_only';
}

export function SignupForm({ eventId, onSignup, formRef, defaultName, signupMode = 'anyone' }: SignupFormProps) {
  const [name, setName] = useState(defaultName ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAttendees = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendees:', error);
    }
  }, [eventId]);

  useEffect(() => {
    if (signupMode === 'attendees_only') {
      fetchAttendees();
    }
  }, [signupMode, fetchAttendees]);

  useEffect(() => {
    if (signupMode === 'attendees_only' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setFilteredAttendees(
        attendees.filter(
          (a) =>
            a.displayName.toLowerCase().includes(q) ||
            (a.handle && a.handle.toLowerCase().includes(q))
        )
      );
      setShowDropdown(true);
    } else {
      setFilteredAttendees([]);
      setShowDropdown(false);
    }
  }, [searchQuery, attendees, signupMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (signupMode === 'attendees_only') {
      if (!selectedAttendee) return;
    } else {
      if (!name.trim()) return;
    }

    setIsSubmitting(true);
    try {
      const body =
        signupMode === 'attendees_only'
          ? { attendeeDid: selectedAttendee!.did }
          : { name: name.trim() };

      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setName('');
        setSearchQuery('');
        setSelectedAttendee(null);
        setShowSuccess(true);
        onSignup();

        // Hide success after animation and scroll to top
        setTimeout(() => {
          setShowSuccess(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
      }
    } catch (error) {
      console.error('Signup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setSearchQuery(attendee.displayName);
    setShowDropdown(false);
  };

  // Focus input when form is scrolled to
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          inputRef.current?.focus();
        }
      },
      { threshold: 0.5 }
    );

    if (inputRef.current) {
      observer.observe(inputRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700">
      {showSuccess ? (
        <div className="flex items-center justify-center py-4 text-green-400 text-xl animate-bounce">
          ✓ You&apos;re signed up!
        </div>
      ) : signupMode === 'attendees_only' ? (
        <div className="space-y-3">
          {selectedAttendee ? (
            <div className="flex items-center justify-between bg-gray-900 px-4 py-3 rounded-lg border border-orange-500">
              <div>
                <p className="text-white font-medium">Sign up as {selectedAttendee.displayName}</p>
                {selectedAttendee.handle && (
                  <p className="text-gray-500 text-sm">{selectedAttendee.handle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAttendee(null);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendees..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                disabled={isSubmitting}
                autoComplete="off"
              />
              {showDropdown && filteredAttendees.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-1 max-h-60 overflow-y-auto bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                  {filteredAttendees.map((attendee) => (
                    <button
                      key={attendee.did}
                      type="button"
                      onClick={() => handleSelectAttendee(attendee)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium">{attendee.displayName}</div>
                      {attendee.handle && (
                        <div className="text-gray-500 text-sm">{attendee.handle}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !selectedAttendee}
            className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '...' : selectedAttendee ? 'Sign Up' : 'Select an attendee'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '...' : 'Sign Up'}
          </button>
        </div>
      )}
    </form>
  );
}
