import React from 'react';
import { getCurrentUser, canManageEvents, canReadEvents } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canCreateEvents } from '@/lib/permissions';
import EventManagement from '@/components/EventManagement';

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user can access events (read, create, or manage)
  if (
    !canReadEvents(user) &&
    !canCreateEvents(user.permissions) &&
    !canManageEvents(user)
  ) {
    redirect('/admin/unauthorized');
  }

  return <EventManagement user={user} />;
}
