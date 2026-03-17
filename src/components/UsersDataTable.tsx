'use client';

import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Mail,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  EditUserRoleModal,
  ViewUserDetailsModal,
} from '@/components/modals/users';
import { canManageUsers } from '@/lib/permissions';

// Updated User interface to match new schema
interface User {
  id: string;
  email: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  role: 'member' | 'coordinator' | 'vice_president' | 'president' | 'admin';
  permissions: string[];
  createdAt: string;
  profile?: {
    year?: number;
    phone?: string;
  };
  department?: {
    id: string;
    name: string;
    displayName: string;
  };
}

interface UsersDataTableProps {
  onRefresh: () => void;
}

export function UsersDataTable({ onRefresh }: UsersDataTableProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    role: User['role'];
    permissions: string[];
  } | null>(null);
  const [editRoleModal, setEditRoleModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });
  const [viewDetailsModal, setViewDetailsModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });
  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        // High limit so the admin table shows all users without additional pagination for now
        limit: '500',
      });

      const response = await fetch(`/api/users?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        const rolePriority: Record<User['role'], number> = {
          admin: 0,
          president: 1,
          vice_president: 2,
          coordinator: 3,
          member: 4,
        };

        const sortedUsers = [...data.users].sort((a: User, b: User) => {
          const priorityA = rolePriority[a.role] ?? Number.MAX_SAFE_INTEGER;
          const priorityB = rolePriority[b.role] ?? Number.MAX_SAFE_INTEGER;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          const createdA = new Date(a.createdAt).getTime();
          const createdB = new Date(b.createdAt).getTime();

          return createdA - createdB;
        });

        setUsers(sortedUsers);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser({
            role: data.user.role,
            permissions: data.user.permissions || [],
          });
        }
      } catch {}
    })();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Pending' },
      APPROVED: { variant: 'default' as const, label: 'Active' },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
      SUSPENDED: { variant: 'outline' as const, label: 'Suspended' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleDisplayName = (role: string) => {
    const roleConfig = {
      member: 'Member',
      coordinator: 'Coordinator',
      vice_president: 'Vice President',
      president: 'President',
      admin: 'Administrator',
    };
    return roleConfig[role as keyof typeof roleConfig] || role;
  };

  const getDepartment = (user: User) => {
    return user.department?.displayName || 'Not specified';
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('User status updated successfully');
        fetchUsers();
        onRefresh();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const openEditRoleModal = (user: User) => {
    setEditRoleModal({
      isOpen: true,
      user,
    });
  };

  const closeEditRoleModal = () => {
    setEditRoleModal({
      isOpen: false,
      user: null,
    });
  };

  const openViewDetailsModal = (user: User) => {
    setViewDetailsModal({
      isOpen: true,
      user,
    });
  };

  const closeViewDetailsModal = () => {
    setViewDetailsModal({
      isOpen: false,
      user: null,
    });
  };

  const handleRoleUpdateSuccess = () => {
    fetchUsers();
    onRefresh();
  };

  const canManageUsersAccess = currentUser
    ? canManageUsers(currentUser.permissions || [])
    : false;

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return <Badge variant="outline">{getRoleDisplayName(role)}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.getValue('status')),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{row.getValue('email')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => {
        const user = row.original;
        const department = getDepartment(user);
        return (
          <div className="text-sm text-gray-600 max-w-xs truncate">
            {department}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;

        if (!canManageUsersAccess) {
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openViewDetailsModal(user)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View details
            </Button>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openViewDetailsModal(user)}>
                <Eye className="h-4 w-4 mr-2" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!currentUser) return;
                  // Only allow role edit if admin or vice_president
                  const canEditRole =
                    currentUser.role === 'admin' ||
                    currentUser.role === 'vice_president';
                  if (!canEditRole) return toast.error('Not allowed');
                  openEditRoleModal(user);
                }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Edit role
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(user.id, 'APPROVED')}
                disabled={user.status === 'APPROVED'}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                disabled={user.status === 'SUSPENDED'}
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(user.id, 'REJECTED')}
                disabled={user.status === 'REJECTED'}
              >
                <UserX className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filters = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'member', label: 'Member' },
        { value: 'coordinator', label: 'Coordinator' },
        { value: 'vice_president', label: 'Vice President' },
        { value: 'president', label: 'President' },
        { value: 'admin', label: 'Administrator' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Active' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'SUSPENDED', label: 'Suspended' },
      ],
    },
  ];

  const handleExport = (data: User[]) => {
    // Custom export logic for users
    const headers = [
      'Name',
      'Email',
      'Role',
      'Department',
      'Status',
      'Joined Date',
    ];
    const csvData = data.map((user) => [
      user.name,
      user.email,
      getRoleDisplayName(user.role),
      getDepartment(user),
      user.status,
      new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Users exported successfully');
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={users}
        title="Users"
        searchPlaceholder="Search users by name or email..."
        filters={filters}
        onExport={handleExport}
        exportFileName="users"
      />
      <EditUserRoleModal
        isOpen={editRoleModal.isOpen}
        onClose={closeEditRoleModal}
        user={editRoleModal.user}
        onSuccess={handleRoleUpdateSuccess}
      />
      <ViewUserDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={closeViewDetailsModal}
        user={viewDetailsModal.user}
      />
    </>
  );
}
