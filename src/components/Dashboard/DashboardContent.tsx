'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Calendar,
  Mail,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface DashboardData {
  stats: {
    totalUsers: { count: number; change: number };
    totalEvents: { count: number; change: number };
    totalContactSubmissions: { count: number; change: number };
    totalGalleryImages: { count: number; change: number };
    totalJoinClubApplications: { count: number; change: number };
  };
  pending: {
    users: number;
    contactSubmissions: number;
    joinClubApplications: number;
  };
  recent: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      role: string;
      createdAt: string;
    }>;
    events: Array<{
      id: string;
      title: string;
      status: string;
      startDate: string;
      endDate: string;
      location: string | null;
      isOnline: boolean;
      category: string | null;
      registrations: number;
      createdAt: string;
    }>;
  };
  upcoming: {
    events: Array<{
      id: string;
      title: string;
      startDate: string;
      location: string | null;
      isOnline: boolean;
      registrations: number;
    }>;
  };
  departments: Array<{
    id: string;
    name: string;
    displayName: string;
    userCount: number;
    eventCount: number;
  }>;
  attendance: {
    totalRegistrations: number;
  };
}

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error loading dashboard data</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-600">No data available</div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'published':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.stats.totalUsers.count}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.stats.totalUsers.change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(data.stats.totalUsers.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.stats.totalEvents.count}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.stats.totalEvents.change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(data.stats.totalEvents.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Contact Submissions
            </CardTitle>
            <Mail className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.stats.totalContactSubmissions.count}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.stats.totalContactSubmissions.change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(data.stats.totalContactSubmissions.change)}% from last
              month
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Gallery Images
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.stats.totalGalleryImages.count}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.stats.totalGalleryImages.change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(data.stats.totalGalleryImages.change)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Join Club Applications
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {data.stats.totalJoinClubApplications.count}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.stats.totalJoinClubApplications.change >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              )}
              {Math.abs(data.stats.totalJoinClubApplications.change)}% from last
              month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recent.users.length > 0 ? (
              <div className="space-y-3">
                {data.recent.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No users found
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Recent Events</CardTitle>
            <CardDescription>Latest event activities</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recent.events.length > 0 ? (
              <div className="space-y-3">
                {data.recent.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.location ||
                          (event.isOnline ? 'Online Event' : 'Location TBD')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(event.startDate)} •{' '}
                        {event.registrations} registrations
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      {event.category && (
                        <Badge variant="outline">{event.category}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No events found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <button className="w-full p-4 border border-primary/20 rounded-lg hover:bg-primary/5 hover:border-primary/40 transition-colors group text-left">
                <Users className="h-6 w-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-primary">Manage Users</h3>
                <p className="text-sm text-muted-foreground">
                  {data.pending.users} pending approvals
                </p>
              </button>
            </Link>
            <Link href="/admin/events">
              <button className="w-full p-4 border border-primary/20 rounded-lg hover:bg-primary/5 hover:border-primary/40 transition-colors group text-left">
                <Calendar className="h-6 w-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-primary">Create Event</h3>
                <p className="text-sm text-muted-foreground">
                  {data.upcoming.events.length} upcoming events
                </p>
              </button>
            </Link>
            <Link href="/admin/contact">
              <button className="w-full p-4 border border-primary/20 rounded-lg hover:bg-primary/5 hover:border-primary/40 transition-colors group text-left">
                <Mail className="h-6 w-6 mb-2 text-primary group-hover:scale-110 transition-transform" />
                <h3 className="font-medium text-primary">Review Contacts</h3>
                <p className="text-sm text-muted-foreground">
                  {data.pending.contactSubmissions} pending messages
                </p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Department Statistics */}
      {data.departments.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Department Overview</CardTitle>
            <CardDescription>
              User and event distribution across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.departments.map((dept) => (
                <div key={dept.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-primary mb-2">
                    {dept.displayName}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users:</span>
                      <span className="font-medium">{dept.userCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Events:</span>
                      <span className="font-medium">{dept.eventCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Summary */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Event Attendance</CardTitle>
          <CardDescription>
            Overall event participation statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {data.attendance.totalRegistrations}
            </div>
            <p className="text-sm text-muted-foreground">
              Total event registrations
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
