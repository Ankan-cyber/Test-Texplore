'use client';

import React from 'react';
import { useModal } from '@/providers/ModalContext';
import { CreateEventModal, EditEventModal, DeleteEventModal } from './events';

export function ModalContainer() {
  const { state: _state } = useModal();

  return (
    <>
      <CreateEventModal />
      <EditEventModal />
      <DeleteEventModal />
      {/* Add other modals here as they are created */}
    </>
  );
}
