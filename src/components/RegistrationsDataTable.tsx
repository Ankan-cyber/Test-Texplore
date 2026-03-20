'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

interface Registration {
  id: string;
  registrationDate: string;
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  notes?: string;
  // For authenticated registrations
  user?: {
    id: string;
    name: string;
    email: string;
    profile?: {
      department?: string;
      year?: number;
      phone?: string;
    };
  };
  // For public registrations
  fullName?: string;
  emailId?: string;
  college?: string;
  department?: string;
  phoneNumber?: string;
  year?: string;
  registrationType?: 'internal' | 'external';
}

interface RegistrationsDataTableProps {
  registrations: Registration[];
  eventTitle: string;
}

export default function RegistrationsDataTable({
  registrations,
  eventTitle,
}: RegistrationsDataTableProps) {
  // Transform data for the table
  const tableData = registrations.map((registration) => {
    // Handle authenticated registrations (with user object)
    if (registration.user) {
      return {
        id: registration.id,
        name: registration.user.name,
        email: registration.user.email,
        phone: registration.user.profile?.phone || 'Not provided',
        department: registration.user.profile?.department || 'Not specified',
        year: registration.user.profile?.year || 'Not specified',
        status: registration.status,
        notes: registration.notes || '',
        registrationDate: registration.registrationDate,
        registrationType: 'Authenticated',
      };
    }

    // Handle public registrations (direct fields)
    return {
      id: registration.id,
      name: registration.fullName || 'Not provided',
      email: registration.emailId || 'Not provided',
      phone: registration.phoneNumber || 'Not provided',
      department: registration.department || 'Not specified',
      year: registration.year || 'Not specified',
      status: registration.status,
      notes: registration.notes || '',
      registrationDate: registration.registrationDate,
      registrationType: registration.registrationType || 'external',
    };
  });

  // Define columns
  const columns: ColumnDef<(typeof tableData)[0]>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="text-sm break-all sm:break-normal">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <div className="text-sm">{row.getValue('phone')}</div>,
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('department')}</div>
      ),
    },
    {
      accessorKey: 'year',
      header: 'Year',
      cell: ({ row }) => <div className="text-sm">{row.getValue('year')}</div>,
    },
    {
      accessorKey: 'registrationType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('registrationType') as string;
        const typeConfig = {
          internal: { variant: 'default' as const, label: 'Internal' },
          external: { variant: 'secondary' as const, label: 'External' },
          Authenticated: {
            variant: 'outline' as const,
            label: 'Authenticated',
          },
        };
        const config =
          typeConfig[type as keyof typeof typeConfig] || typeConfig.external;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          REGISTERED: { variant: 'default' as const, label: 'Registered' },
          ATTENDED: { variant: 'default' as const, label: 'Attended' },
          NO_SHOW: { variant: 'destructive' as const, label: 'No Show' },
          CANCELLED: { variant: 'outline' as const, label: 'Cancelled' },
        };
        const config =
          statusConfig[status as keyof typeof statusConfig] ||
          statusConfig.REGISTERED;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'registrationDate',
      header: 'Registered At',
      cell: ({ row }) => {
        const date = new Date(row.getValue('registrationDate'));
        return (
          <div className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
  ];

  // Custom export function
  const handleExport = (data: typeof tableData) => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Department',
      'Year',
      'Type',
      'Status',
      'Notes',
      'Registered At',
    ];

    const csvData = data.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.department,
      row.year,
      row.registrationType,
      row.status,
      row.notes,
      new Date(row.registrationDate).toLocaleString(),
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <DataTable
      columns={columns}
      data={tableData}
      title={`${eventTitle} - Registrations`}
      searchPlaceholder="Search by name, email, or department..."
      onExport={handleExport}
      exportFileName={`${eventTitle}_registrations`}
    />
  );
}
