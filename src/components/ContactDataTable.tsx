'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Eye,
  Reply,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Mail,
  User,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  hasReply: boolean;
  replyText?: string;
  repliedBy?: string;
  repliedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ContactDataTableProps {
  refreshKey?: number;
}

const ContactDataTable: React.FC<ContactDataTableProps> = ({
  refreshKey = 0,
}) => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replying, setReplying] = useState(false);

  // Fetch submissions
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/contact?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load contact submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [refreshKey, statusFilter]);

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(
    (submission) =>
      submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle reply submission
  const handleReply = async () => {
    if (!selectedSubmission || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setReplying(true);
      const response = await fetch(
        `/api/contact/${selectedSubmission.id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            replyText: replyText.trim(),
            status: 'RESOLVED',
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reply');
      }

      toast.success('Reply sent successfully');
      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedSubmission(null);
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to send reply',
      );
    } finally {
      setReplying(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      IN_PROGRESS: {
        label: 'In Progress',
        className: 'bg-blue-100 text-blue-800',
      },
      RESOLVED: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
      CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-800' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading submissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-auto flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No contact submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {submission.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{submission.name}</div>
                            <div className="text-sm text-gray-500">
                              {submission.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {submission.subject}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {submission.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(submission.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {submission.hasReply ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Replied</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedSubmission(submission)
                                }
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[85vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Contact Submission Details
                                </DialogTitle>
                                <DialogDescription>
                                  View and reply to this contact submission
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">
                                      From
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {submission.name}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Email
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {submission.email}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Subject
                                  </label>
                                  <p className="text-sm text-gray-600">
                                    {submission.subject}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">
                                    Message
                                  </label>
                                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">
                                      {submission.message}
                                    </p>
                                  </div>
                                </div>
                                {submission.hasReply && (
                                  <div>
                                    <label className="text-sm font-medium">
                                      Reply
                                    </label>
                                    <div className="mt-1 p-3 bg-blue-50 rounded-md">
                                      <p className="text-sm whitespace-pre-wrap">
                                        {submission.replyText}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        Replied by {submission.repliedBy} on{' '}
                                        {formatDate(submission.repliedAt!)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {submission.notes && (
                                  <div>
                                    <label className="text-sm font-medium">
                                      Notes
                                    </label>
                                    <p className="text-sm text-gray-600">
                                      {submission.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          {!submission.hasReply && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setReplyDialogOpen(true);
                              }}
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reply to Contact Submission</DialogTitle>
            <DialogDescription>
              Send a reply to {selectedSubmission?.name} (
              {selectedSubmission?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Original Message</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedSubmission?.message}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Reply</label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter your reply message..."
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReplyDialogOpen(false);
                  setReplyText('');
                  setSelectedSubmission(null);
                }}
                disabled={replying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
              >
                {replying ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactDataTable;
