'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Eye,
  XCircle,
  User,
  Phone,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import useDebounce from '@/hooks/useDebounce';

interface JoinClubApplication {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  branch: string;
  year: string;
  departments: string[];
  whyJoin: string;
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'INTERVIEW_SCHEDULED'
    | 'INTERVIEW_COMPLETED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  interviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  INTERVIEW_SCHEDULED: 'bg-blue-100 text-blue-800',
  INTERVIEW_COMPLETED: 'bg-purple-100 text-purple-800',
};

const statusLabels = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
};

export default function JoinClubManagementPage() {
  const [applications, setApplications] = useState<JoinClubApplication[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300); // 300ms delay
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedApplication, setSelectedApplication] =
    useState<JoinClubApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });

      const response = await fetch(`/api/join-club?${params}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (
    applicationId: string,
    status: string,
    notes?: string,
    interviewDate?: string,
  ) => {
    try {
      // Format the interview date to ISO string if it exists
      const formattedInterviewDate = interviewDate
        ? new Date(interviewDate).toISOString()
        : undefined;

      const response = await fetch(`/api/join-club/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNotes: notes,
          interviewDate: formattedInterviewDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update application');
      }

      fetchApplications();
      setSelectedApplication(null);
      setReviewNotes('');
      setInterviewDate('');
      setNewStatus('');
    } catch (error) {
      console.error('Error updating application:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update application',
      );
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`/api/join-club/${applicationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApplications();
      }
    } catch (error) {
      console.error('Error deleting application:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Join Club Applications</h1>
          <p className="text-muted-foreground">
            Manage and review applications from students wanting to join the
            club
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {pagination.total} applications
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or branch..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="INTERVIEW_SCHEDULED">
                  Interview Scheduled
                </SelectItem>
                <SelectItem value="INTERVIEW_COMPLETED">
                  Interview Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Academic Info</TableHead>
                    <TableHead>Departments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {application.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {application.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {application.phoneNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <GraduationCap className="h-3 w-3" />
                            {application.branch}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.year}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {application.departments.map((dept) => (
                            <Badge
                              key={dept}
                              variant="outline"
                              className="text-xs"
                            >
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[application.status]}>
                          {statusLabels[application.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {format(
                            new Date(application.createdAt),
                            'MMM dd, yyyy',
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedApplication(application)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className="max-w-2xl max-h-[80vh] overflow-y-auto"
                              onInteractOutside={() => {
                                setSelectedApplication(null);
                                setReviewNotes('');
                                setInterviewDate('');
                                setNewStatus('');
                              }}
                              onEscapeKeyDown={() => {
                                setSelectedApplication(null);
                                setReviewNotes('');
                                setInterviewDate('');
                                setNewStatus('');
                              }}
                            >
                              <DialogHeader>
                                <DialogTitle>Application Details</DialogTitle>
                                <DialogDescription>
                                  Review application from {application.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Personal Information */}
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Personal Information
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Name
                                      </Label>
                                      <div className="font-medium">
                                        {application.name}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Email
                                      </Label>
                                      <div className="font-medium">
                                        {application.email}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Phone
                                      </Label>
                                      <div className="font-medium">
                                        {application.phoneNumber}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Branch
                                      </Label>
                                      <div className="font-medium">
                                        {application.branch}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">
                                        Year
                                      </Label>
                                      <div className="font-medium">
                                        {application.year}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Departments */}
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Interested Departments
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    {application.departments.map((dept) => (
                                      <Badge key={dept} variant="secondary">
                                        {dept}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <Separator />

                                {/* Motivation */}
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Why Join
                                  </h3>
                                  <div className="bg-muted p-3 rounded-md">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground mb-2" />
                                    <p className="text-sm">
                                      {application.whyJoin}
                                    </p>
                                  </div>
                                </div>

                                <Separator />

                                {/* Review Actions */}
                                <div>
                                  <h3 className="font-semibold mb-3">
                                    Review Actions
                                  </h3>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="status">
                                        Update Status
                                      </Label>
                                      <Select
                                        value={newStatus}
                                        onValueChange={setNewStatus}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select new status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="APPROVED">
                                            Approve
                                          </SelectItem>
                                          <SelectItem value="REJECTED">
                                            Reject
                                          </SelectItem>
                                          <SelectItem value="INTERVIEW_SCHEDULED">
                                            Schedule Interview
                                          </SelectItem>
                                          <SelectItem value="INTERVIEW_COMPLETED">
                                            Interview Completed
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {newStatus === 'INTERVIEW_SCHEDULED' && (
                                      <div>
                                        <Label htmlFor="interviewDate">
                                          Interview Date
                                        </Label>
                                        <Input
                                          id="interviewDate"
                                          type="datetime-local"
                                          value={interviewDate}
                                          onChange={(e) =>
                                            setInterviewDate(e.target.value)
                                          }
                                        />
                                      </div>
                                    )}

                                    <div>
                                      <Label htmlFor="reviewNotes">
                                        Review Notes
                                      </Label>
                                      <Textarea
                                        id="reviewNotes"
                                        placeholder="Add review notes..."
                                        value={reviewNotes}
                                        onChange={(e) =>
                                          setReviewNotes(e.target.value)
                                        }
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() =>
                                          handleStatusUpdate(
                                            application.id,
                                            newStatus,
                                            reviewNotes,
                                            interviewDate,
                                          )
                                        }
                                        disabled={!newStatus}
                                      >
                                        Update Status
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedApplication(null);
                                          setReviewNotes('');
                                          setInterviewDate('');
                                          setNewStatus('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(application.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
