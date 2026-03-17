'use client';

import React from 'react';
import { BaseModal } from '@/components/modals/BaseModal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Building,
  Phone,
  Link,
  Github,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';

interface UserProfile {
  year?: number;
  phone?: string;
  fullName?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  projects?: string[];
  joinDate?: string;
}

interface UserDepartment {
  id: string;
  name: string;
  displayName: string;
}

interface UserDetails {
  id: string;
  email: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  role: 'member' | 'coordinator' | 'vice_president' | 'president' | 'admin';
  permissions: string[];
  createdAt: string;
  profile?: UserProfile;
  department?: UserDepartment;
}

interface ViewUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetails | null;
}

const getStatusConfig = (status: string) => {
  const configs = {
    PENDING: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      label: 'Pending',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Active',
    },
    REJECTED: {
      icon: XCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Rejected',
    },
    SUSPENDED: {
      icon: Pause,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      label: 'Suspended',
    },
  };
  return configs[status as keyof typeof configs] || configs.PENDING;
};

const getRoleConfig = (role: string) => {
  const configs = {
    member: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Member' },
    coordinator: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Coordinator' },
    vice_president: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Vice President' },
    president: { color: 'bg-red-100 text-red-800 border-red-200', label: 'President' },
    admin: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Administrator' },
  };
  return configs[role as keyof typeof configs] || configs.member;
};

export default function ViewUserDetailsModal({
  isOpen,
  onClose,
  user,
}: ViewUserDetailsModalProps) {
  if (!user) return null;

  const statusConfig = getStatusConfig(user.status);
  const roleConfig = getRoleConfig(user.role);
  const StatusIcon = statusConfig.icon;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-start space-x-4">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={roleConfig.color}>
                <Shield className="h-3 w-3 mr-1" />
                {roleConfig.label}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900">{user.profile?.fullName || user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {user.profile?.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {user.profile.phone}
                  </p>
                </div>
              )}
              {user.profile?.year && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Year</label>
                  <p className="text-gray-900">{user.profile.year}</p>
                </div>
              )}
            </div>
            {user.profile?.bio && (
              <div>
                <label className="text-sm font-medium text-gray-500">Bio</label>
                <p className="text-gray-900 mt-1">{user.profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department & Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department & Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-gray-900">
                  {user.department?.displayName || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Role</label>
                <Badge className={roleConfig.color}>
                  {roleConfig.label}
                </Badge>
              </div>
            </div>
            {user.permissions.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Permissions</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Created</label>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {user.profile?.joinDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Club Join Date</label>
                  <p className="text-gray-900">
                    {new Date(user.profile.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills & Projects */}
        {(user.profile?.skills?.length || user.profile?.projects?.length) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills & Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.profile?.skills?.length && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Skills</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {user.profile?.projects?.length && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Projects</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.profile.projects.map((project, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {project}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Links */}
        {(user.profile?.linkedin || user.profile?.github) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.profile?.linkedin && (
                  <a
                    href={user.profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Link className="h-4 w-4" />
                    LinkedIn Profile
                  </a>
                )}
                {user.profile?.github && (
                  <a
                    href={user.profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    GitHub Profile
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseModal>
  );
}
