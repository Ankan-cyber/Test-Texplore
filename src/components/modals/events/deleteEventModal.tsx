'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BaseModal } from '../BaseModal';
import { useModal } from '@/providers/ModalContext';
import { Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { type Event } from './schemas';

export function DeleteEventModal() {
  const { state, closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!state.data || !state.onConfirm) return;

    setLoading(true);
    try {
      await state.onConfirm();
      toast.success('Event deleted successfully!');
      closeModal();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  if (state.type !== 'deleteEvent') return null;

  const event = state.data as Event;

  return (
    <BaseModal
      isOpen={state.isOpen}
      onClose={closeModal}
      title={state.title}
      size={state.size}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Event'}
          </Button>
        </div>
      }
    >
      <div className="text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Are you sure you want to delete this event?
          </h3>
          <p className="text-gray-600 mb-4">
            This action cannot be undone. The event &quot;{event?.title}&quot;
            will be permanently deleted.
          </p>
          {event?._count?.registrations && event._count.registrations > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This event has {event._count.registrations} registrations.
                Consider cancelling the event instead of deleting it.
              </p>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
