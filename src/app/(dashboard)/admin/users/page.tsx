'use client';

import React, { useState } from 'react';
import { UsersDataTable } from '@/components/UsersDataTable';
import AddUserModal from '@/components/modals/users/addUserModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

interface CurrentUser {
  role: 'member' | 'coordinator' | 'vice_president' | 'president' | 'admin';
  permissions: string[];
}

export default function UsersPage() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [canAddUser, setCanAddUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          const perms: string[] = data.user?.permissions || [];
          const role = data.user?.role;
          // Allow if admin OR has user:create permission
          setCanAddUser(role === 'admin' || perms.includes('user:create'));
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const handleUserCreated = async (data: any) => {
    try {
      // Send the data to the API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const result = await response.json();

      // Show success message
      toast.success(result.message || 'User created successfully!');

      // Close modal and refresh the data table
      setIsAddUserModalOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create user',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage club members, approve registrations, and handle user accounts
          </p>
        </div>
        {canAddUser && (
          <Button
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Users Data Table */}
      <UsersDataTable
        key={refreshKey}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleUserCreated}
      />
    </div>
  );
}
