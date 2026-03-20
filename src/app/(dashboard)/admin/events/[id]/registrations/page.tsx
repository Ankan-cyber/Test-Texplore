'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationsDataTable from '@/components/RegistrationsDataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Registration {
  id: string;
  registrationDate: string;
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  notes?: string;
  // Public registration fields
  fullName: string;
  emailId: string;
  college: string;
  department: string;
  phoneNumber: string;
  year: string;
  registrationType: 'internal' | 'external';
}

interface Event {
  id: string;
  title: string;
  status: string;
}

interface EventRegistrationsPageProps {
  params: Promise<{ id: string }>;
}

export default function EventRegistrationsPage({
  params,
}: EventRegistrationsPageProps) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPage = async () => {
      const resolvedParams = await params;
      await fetchRegistrations(resolvedParams.id);
    };
    initPage();
  }, [params]);

  const fetchRegistrations = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}/registrations`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Event not found');
          router.push('/admin/events');
          return;
        } else if (response.status === 403) {
          toast.error('Insufficient permissions');
          router.push('/admin/unauthorized');
          return;
        } else {
          toast.error('Failed to load registrations');
          return;
        }
      }

      const data = await response.json();
      setEvent(data.event);
      setRegistrations(data.registrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading registrations...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The event you are looking for does not exist or is not available.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/admin/events">Back to Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/events">← Back to Events</Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Event Registrations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {event.title} - {registrations.length} registrations
          </p>
        </div>
      </div>

      {/* Table Component */}
      <RegistrationsDataTable
        registrations={registrations}
        eventTitle={event.title}
      />
    </div>
  );
}
