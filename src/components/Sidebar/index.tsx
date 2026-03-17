'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Sparkles,
  Mail,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import { User as UserType } from '@/lib/auth';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  permissionKey: keyof AccessibleFeatures;
}

interface AccessibleFeatures {
  adminDashboard: boolean;
  userManagement: boolean;
  eventManagement: boolean;
  galleryManagement: boolean;
  contactManagement: boolean;
  joinClubManagement: boolean;
  websiteSettings: boolean;
  reports: boolean;
}

interface AdminSidebarProps {
  className?: string;
  accessibleFeatures?: AccessibleFeatures;
  user?: UserType;
  userCount?: number;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview & Analytics',
    permissionKey: 'adminDashboard',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage Members',
    permissionKey: 'userManagement',
  },
  {
    title: 'Events',
    href: '/admin/events',
    icon: Calendar,
    description: 'Event Management',
    permissionKey: 'eventManagement',
  },
  {
    title: 'Gallery',
    href: '/admin/gallery',
    icon: ImageIcon,
    description: 'Media Library',
    permissionKey: 'galleryManagement',
  },
  {
    title: 'Contact',
    href: '/admin/contact',
    icon: Mail,
    description: 'Contact Messages',
    permissionKey: 'contactManagement',
  },
  {
    title: 'Join Club',
    href: '/admin/join-club',
    icon: UserPlus,
    description: 'Applications',
    permissionKey: 'joinClubManagement',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System Configuration',
    permissionKey: 'websiteSettings',
  },
];

export default function AdminSidebar({
  className,
  accessibleFeatures,
  user,
  userCount: initialUserCount,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userCount, setUserCount] = useState<number | undefined>(
    initialUserCount,
  );
  const [isLoadingUserCount, setIsLoadingUserCount] = useState(false);
  const pathname = usePathname();
  const { logout } = useSession({ autoStart: false }); // Don't auto-start here since SessionProvider handles it

  // Fetch user count if not provided
  useEffect(() => {
    if (userCount === undefined) {
      const fetchUserCount = async () => {
        setIsLoadingUserCount(true);
        try {
          const params = new URLSearchParams({
            page: '1',
            limit: '1',
          });

          const response = await fetch(`/api/users?${params.toString()}`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const totalCount = data?.pagination?.totalCount;
            if (typeof totalCount === 'number') {
              setUserCount(totalCount);
            } else if (Array.isArray(data?.users)) {
              setUserCount(data.users.length);
            }
          } else {
            console.warn('Failed to fetch user count:', response.status);
          }
        } catch (error) {
          console.error('Failed to fetch user count:', error);
        } finally {
          setIsLoadingUserCount(false);
        }
      };

      fetchUserCount();
    }
  }, [userCount]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  // Filter sidebar items based on user permissions
  const filteredSidebarItems = accessibleFeatures
    ? sidebarItems.filter((item) => accessibleFeatures[item.permissionKey])
    : sidebarItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out lg:translate-x-0',
          isCollapsed ? 'w-24' : 'w-80',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0',
          className,
        )}
      >
        <div className="flex h-full flex-col bg-gradient-to-b from-white to-primary/5 border-r border-primary/20 dark:bg-gradient-to-b dark:from-gray-900 dark:to-primary/10 dark:border-primary/30 backdrop-blur-sm">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-primary/20 dark:border-primary/30 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-14 w-14 rounded-lg border-2 border-primary flex items-center justify-center ">
                    <Image
                      src="/favicon.ico"
                      alt="Texplore Logo"
                      width={28}
                      height={28}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    Texplore
                  </span>
                  <p className="text-xs text-primary dark:text-primary/80 -mt-1">
                    Admin Panel
                  </p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="relative mx-auto">
                <div className="h-14 w-14 rounded-lg border-2 border-primary flex items-center  justify-center ">
                  <Image
                    src="/favicon.ico"
                    alt="Texplore Logo"
                    width={20}
                    height={20}
                    className="rounded-md"
                  />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors duration-200"
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-3 py-6">
            {filteredSidebarItems.map((item) => {
              const isActive = pathname === item.href;

              // Dynamically set badge for Users item
              const displayBadge =
                item.title === 'Users'
                  ? isLoadingUserCount
                    ? '...'
                    : userCount?.toString() || '0'
                  : item.badge;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25'
                      : 'text-gray-700 hover:bg-primary/10 hover:text-primary dark:text-gray-300 dark:hover:bg-primary/20 dark:hover:text-white',
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/20 rounded-xl" />
                  )}

                  <div className="relative z-10 flex items-center w-full">
                    <div
                      className={cn(
                        'flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/10 text-primary group-hover:bg-primary/20 dark:bg-primary/20 dark:text-primary/80 dark:group-hover:bg-primary/30',
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{item.title}</span>
                          {displayBadge && (
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/80',
                              )}
                            >
                              {displayBadge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p
                            className={cn(
                              'text-xs mt-0.5',
                              isActive
                                ? 'text-white/80'
                                : 'text-primary/70 dark:text-primary/60',
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-primary/20 dark:border-primary/30 p-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/90 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-primary dark:text-primary/80 truncate">
                    {user?.email || 'user@texplore.com'}
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
