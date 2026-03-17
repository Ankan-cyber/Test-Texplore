'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Registration {
  id: string;
  registeredAt: string;
  // Registration fields
  fullName: string;
  emailId: string;
  college: string;
  department: string;
  phoneNumber: string;
  year: string;
  registrationType: string;
}

interface EventRegistrationsTableProps {
  registrations: Registration[];
  eventTitle: string;
}

type SortField =
  | 'fullName'
  | 'email'
  | 'college'
  | 'department'
  | 'phoneNumber'
  | 'year'
  | 'registrationType'
  | 'registeredAt';
type SortDirection = 'asc' | 'desc';

export default function EventRegistrationsTable({
  registrations,
  eventTitle,
}: EventRegistrationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('registeredAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getRegistrationData = (registration: Registration) => {
    // Use the new registration fields directly
    const fullName = registration.fullName;
    const email = registration.emailId;
    const phoneNumber = registration.phoneNumber;
    const college = registration.college;
    const department = registration.department;
    const year = registration.year;

    // Determine registration type
    let registrationType = 'Guest';

    registrationType =
      registration.registrationType === 'internal'
        ? 'Internal Student'
        : 'External Student';

    return {
      fullName,
      email,
      phoneNumber,
      college,
      department,
      year,
      registrationType,
      registeredAt: registration.registeredAt,
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const filteredAndSortedRegistrations = registrations
    .map(getRegistrationData)
    .filter((reg) => {
      const matchesSearch =
        reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === 'all' || reg.registrationType === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: string | number | Date = a[sortField];
      let bValue: string | number | Date = b[sortField];

      if (sortField === 'registeredAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const exportToCSV = () => {
    const headers = [
      'Full Name',
      'Email',
      'Phone Number',
      'College',
      'Department',
      'Year',
      'Registration Type',
      'Registered At',
    ];

    const csvData = filteredAndSortedRegistrations.map((reg) => [
      reg.fullName,
      reg.email,
      reg.phoneNumber,
      reg.college,
      reg.department,
      reg.year,
      reg.registrationType,
      new Date(reg.registeredAt).toLocaleString(),
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

    toast.success('CSV exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, college, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="Internal Student">
                  Internal Students
                </SelectItem>
                <SelectItem value="External Student">
                  External Students
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-primary">
              Registrations ({filteredAndSortedRegistrations.length})
            </CardTitle>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedRegistrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No registrations found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Full Name {getSortIcon('fullName')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Email {getSortIcon('email')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('phoneNumber')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Phone {getSortIcon('phoneNumber')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('college')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        College {getSortIcon('college')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('department')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Department {getSortIcon('department')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('year')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Year {getSortIcon('year')}
                      </button>
                    </th>
                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('registrationType')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Type {getSortIcon('registrationType')}
                      </button>
                    </th>

                    <th className="text-left p-3 font-semibold">
                      <button
                        onClick={() => handleSort('registeredAt')}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        Registered At {getSortIcon('registeredAt')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRegistrations.map((registration, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">{registration.fullName}</td>
                      <td className="p-3">{registration.email}</td>
                      <td className="p-3">{registration.phoneNumber}</td>
                      <td className="p-3">{registration.college}</td>
                      <td className="p-3">{registration.department}</td>
                      <td className="p-3">{registration.year}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {registration.registrationType}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {new Date(
                          registration.registeredAt,
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
