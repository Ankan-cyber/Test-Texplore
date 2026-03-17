import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { canReadContactMessages } from '@/lib/permissions';
import ContactDataTable from '@/components/ContactDataTable';

export default async function ContactPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user can read contact messages
  if (!canReadContactMessages(user.permissions)) {
    redirect('/admin/unauthorized');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Contact Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and respond to contact form submissions
        </p>
      </div>

      <ContactDataTable />
    </div>
  );
}
