'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Register from '@/components/Register';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxCapacity?: number;
  registrationDeadline?: string;
  isRegistrationOpen?: boolean;
  _count?: {
    registrations: number;
  };
}

export default function EventRegisterPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id as string;
      await fetchEvent(id);
    };
    initPage();
  }, [params]);

  const fetchEvent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/events/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Event not found');
        } else {
          setError('Failed to load event details');
        }
        return;
      }

      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error ||
                'The event you are looking for does not exist or is not available.'}
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/events">Back to Events</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format event data for the Register component
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const eventData = {
    eventId: event.id,
    eventTitle: event.title,
    eventDate: formatDate(event.startDate),
    eventTime: formatTime(event.startDate),
    eventLocation: event.location || 'TBA',
    eventCapacity: event.maxCapacity || 0,
    registeredCount: event._count?.registrations || 0,
    registrationDeadline: event.registrationDeadline,
    isRegistrationOpen: event.isRegistrationOpen,
  };

  return <Register {...eventData} />;
}
