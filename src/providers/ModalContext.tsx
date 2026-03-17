'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Modal types
export type ModalType =
  | 'createEvent'
  | 'editEvent'
  | 'deleteEvent'
  | 'createUser'
  | 'editUser'
  | 'editUserRole'
  | 'deleteUser'
  | 'createAnnouncement'
  | 'editAnnouncement'
  | 'deleteAnnouncement'
  | 'uploadImage'
  | 'confirmAction'
  | 'custom';

// Modal state interface
export interface ModalState {
  type: ModalType | null;
  isOpen: boolean;
  data?: any;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// Modal actions
type ModalAction =
  | { type: 'OPEN_MODAL'; payload: Omit<ModalState, 'isOpen'> }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_MODAL_DATA'; payload: any };

// Initial state
const initialState: ModalState = {
  type: null,
  isOpen: false,
  data: undefined,
  title: undefined,
  size: 'md',
  onConfirm: undefined,
  onCancel: undefined,
};

// Modal reducer
function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        ...action.payload,
        isOpen: true,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        isOpen: false,
        type: null,
        data: undefined,
        title: undefined,
        onConfirm: undefined,
        onCancel: undefined,
      };
    case 'UPDATE_MODAL_DATA':
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}

// Modal context
interface ModalContextType {
  state: ModalState;
  openModal: (modalConfig: Omit<ModalState, 'isOpen'>) => void;
  closeModal: () => void;
  updateModalData: (data: any) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

// Modal provider component
interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  const openModal = (modalConfig: Omit<ModalState, 'isOpen'>) => {
    dispatch({ type: 'OPEN_MODAL', payload: modalConfig });
  };

  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const updateModalData = (data: any) => {
    dispatch({ type: 'UPDATE_MODAL_DATA', payload: data });
  };

  const value: ModalContextType = {
    state,
    openModal,
    closeModal,
    updateModalData,
  };

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

// Custom hook to use modal context
export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

// Convenience functions for common modal operations
export const modalHelpers = {
  // Event modals
  openCreateEvent: (openModal: ModalContextType['openModal']) => {
    openModal({
      type: 'createEvent',
      title: 'Create New Event',
      size: 'xl',
    });
  },

  openEditEvent: (openModal: ModalContextType['openModal'], event: any) => {
    openModal({
      type: 'editEvent',
      title: 'Edit Event',
      size: 'xl',
      data: event,
    });
  },

  openDeleteEvent: (
    openModal: ModalContextType['openModal'],
    event: any,
    onConfirm: () => void,
  ) => {
    openModal({
      type: 'deleteEvent',
      title: 'Delete Event',
      size: 'md',
      data: event,
      onConfirm,
    });
  },

  // User modals
  openCreateUser: (openModal: ModalContextType['openModal']) => {
    openModal({
      type: 'createUser',
      title: 'Create New User',
      size: 'lg',
    });
  },

  openEditUser: (openModal: ModalContextType['openModal'], user: any) => {
    openModal({
      type: 'editUser',
      title: 'Edit User',
      size: 'lg',
      data: user,
    });
  },

  openEditUserRole: (openModal: ModalContextType['openModal'], user: any) => {
    openModal({
      type: 'editUserRole',
      title: 'Edit User Role',
      size: 'xl',
      data: user,
    });
  },

  openDeleteUser: (
    openModal: ModalContextType['openModal'],
    user: any,
    onConfirm: () => void,
  ) => {
    openModal({
      type: 'deleteUser',
      title: 'Delete User',
      size: 'md',
      data: user,
      onConfirm,
    });
  },

  // Announcement modals
  openCreateAnnouncement: (openModal: ModalContextType['openModal']) => {
    openModal({
      type: 'createAnnouncement',
      title: 'Create Announcement',
      size: 'lg',
    });
  },

  openEditAnnouncement: (
    openModal: ModalContextType['openModal'],
    announcement: any,
  ) => {
    openModal({
      type: 'editAnnouncement',
      title: 'Edit Announcement',
      size: 'lg',
      data: announcement,
    });
  },

  openDeleteAnnouncement: (
    openModal: ModalContextType['openModal'],
    announcement: any,
    onConfirm: () => void,
  ) => {
    openModal({
      type: 'deleteAnnouncement',
      title: 'Delete Announcement',
      size: 'md',
      data: announcement,
      onConfirm,
    });
  },

  // Image upload modal
  openUploadImage: (openModal: ModalContextType['openModal']) => {
    openModal({
      type: 'uploadImage',
      title: 'Upload Image',
      size: 'lg',
    });
  },

  // Generic confirmation modal
  openConfirmAction: (
    openModal: ModalContextType['openModal'],
    title: string,
    onConfirm: () => void,
    size: ModalState['size'] = 'md',
  ) => {
    openModal({
      type: 'confirmAction',
      title,
      size,
      onConfirm,
    });
  },

  // Custom modal
  openCustomModal: (
    openModal: ModalContextType['openModal'],
    title: string,
    data: any,
    size: ModalState['size'] = 'md',
  ) => {
    openModal({
      type: 'custom',
      title,
      size,
      data,
    });
  },
};
