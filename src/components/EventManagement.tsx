'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Eye as EyeIcon,
  EyeOff,
  CalendarDays,
  Clock4,
  MapPin as MapPinIcon,
  Video,
  Building,
  User,
  List,
} from 'lucide-react';
import { useModal, modalHelpers } from '@/providers/ModalContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  slug: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  links?: string[];
  maxCapacity?: number;
  isRegistrationOpen: boolean;
  registrationDeadline?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
  isFeatured: boolean;
  imageUrl?: string;
  tags: string[];
  category?: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
    displayName: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    registrations: number;
    attendees: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

interface EventManagementProps {
  user: any;
}

const EventManagement: React.FC<EventManagementProps> = ({ user }) => {
  const { openModal } = useModal();
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Check permissions
  const canCreateEvents =
    user?.permissions?.includes('event:create') || user?.role === 'admin';
  const canManageEvents =
    user?.permissions?.some((p: string) =>
      [
        'event:create',
        'event:update',
        'event:delete',
        'event:approve',
      ].includes(p),
    ) || user?.role === 'admin';

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const data = await response.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleCreateEvent = () => {
    modalHelpers.openCreateEvent(openModal);
  };

  const handleEditEvent = (event: Event) => {
    modalHelpers.openEditEvent(openModal, event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const deleteEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setEvents(events.filter((event) => event.id !== eventId));
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    };

    modalHelpers.openDeleteEvent(openModal, event, deleteEvent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'ARCHIVED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4" />;
      case 'DRAFT':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'ARCHIVED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' || event.departmentId === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Event Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create, manage, and track club events and activities
          </p>
        </div>
        {canCreateEvents && (
          <Button
            onClick={handleCreateEvent}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepartmentFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.title}</h3>
                        {event.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1">{event.status}</span>
                        </Badge>
                        {event.status === 'PUBLISHED' ? (
                          <Badge variant="outline" className="text-green-600">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {new Date(event.startDate).toLocaleDateString()} -{' '}
                            {new Date(event.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock4 className="h-4 w-4" />
                          <span>
                            {new Date(event.startDate).toLocaleTimeString()} -{' '}
                            {new Date(event.endDate).toLocaleTimeString()}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.isOnline && (
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span>Online Event</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {event.department && (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            <span>{event.department.displayName}</span>
                          </div>
                        )}
                        {event._count && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {event._count.registrations} registrations
                            </span>
                          </div>
                        )}
                        {event.createdBy && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Created by {event.createdBy.name}</span>
                          </div>
                        )}
                      </div>

                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs max-w-[200px]"
                            >
                              <span className="truncate block">{tag}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {canManageEvents && (
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/admin/events/${event.id}/registrations`}
                          >
                            <List className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventManagement;
