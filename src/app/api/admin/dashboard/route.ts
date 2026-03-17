import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canAccessAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check if user can access admin dashboard
    if (!canAccessAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get current date and date 30 days ago for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all dashboard data in parallel for optimal performance
    const [
      totalUsers,
      totalEvents,
      totalContactSubmissions,
      totalGalleryImages,
      totalJoinClubApplications,
      recentUsers,
      recentEvents,
      pendingUsers,
      pendingContactSubmissions,
      pendingJoinClubApplications,
      upcomingEvents,
      userStats,
      eventStats,
      contactStats,
      galleryStats,
      joinClubStats,
      departmentStats,
      eventAttendanceStats,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.event.count(),
      prisma.contactSubmission.count(),
      prisma.galleryImage.count(),
      prisma.joinClubApplication.count(),

      // Recent users (last 5)
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      }),

      // Recent events (last 5)
      prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          location: true,
          isOnline: true,
          category: true,
          createdAt: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),

      // Pending users count
      prisma.user.count({
        where: { status: 'PENDING' },
      }),

      // Pending contact submissions count
      prisma.contactSubmission.count({
        where: { status: 'PENDING' },
      }),

      // Pending join club applications count
      prisma.joinClubApplication.count({
        where: { status: 'PENDING' },
      }),

      // Upcoming events (next 7 days)
      prisma.event.findMany({
        where: {
          startDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: 'PUBLISHED',
        },
        take: 5,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          isOnline: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),

      // User statistics (last 30 days)
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Event statistics (last 30 days)
      prisma.event.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Contact submission statistics (last 30 days)
      prisma.contactSubmission.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Gallery statistics (last 30 days)
      prisma.galleryImage.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Join club application statistics (last 30 days)
      prisma.joinClubApplication.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Department statistics
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          displayName: true,
          _count: {
            select: {
              users: true,
              events: true,
            },
          },
        },
      }),

      // Event attendance statistics
      prisma.eventRegistration.count(),
    ]);

    // Calculate percentage changes (simplified - you can enhance this with more sophisticated analytics)
    const previousPeriodStart = new Date(
      thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000,
    );

    const [
      previousUserStats,
      previousEventStats,
      previousContactStats,
      previousGalleryStats,
      previousJoinClubStats,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.event.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.contactSubmission.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.galleryImage.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.joinClubApplication.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    // Calculate percentage changes
    const calculatePercentageChange = (
      current: number,
      previous: number,
    ): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const dashboardData = {
      stats: {
        totalUsers: {
          count: totalUsers,
          change: calculatePercentageChange(userStats, previousUserStats),
        },
        totalEvents: {
          count: totalEvents,
          change: calculatePercentageChange(eventStats, previousEventStats),
        },
        totalContactSubmissions: {
          count: totalContactSubmissions,
          change: calculatePercentageChange(contactStats, previousContactStats),
        },
        totalGalleryImages: {
          count: totalGalleryImages,
          change: calculatePercentageChange(galleryStats, previousGalleryStats),
        },
        totalJoinClubApplications: {
          count: totalJoinClubApplications,
          change: calculatePercentageChange(
            joinClubStats,
            previousJoinClubStats,
          ),
        },
      },
      pending: {
        users: pendingUsers,
        contactSubmissions: pendingContactSubmissions,
        joinClubApplications: pendingJoinClubApplications,
      },
      recent: {
        users: recentUsers.map((user) => ({
          id: user.id,
          name: user.profile?.fullName || user.name,
          email: user.email,
          status: user.status,
          role: user.role,
          createdAt: user.createdAt,
        })),
        events: recentEvents.map((event) => ({
          id: event.id,
          title: event.title,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          isOnline: event.isOnline,
          category: event.category,
          registrations: event._count.registrations,
          createdAt: event.createdAt,
        })),
      },
      upcoming: {
        events: upcomingEvents.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          location: event.location,
          isOnline: event.isOnline,
          registrations: event._count.registrations,
        })),
      },
      departments: departmentStats.map((dept) => ({
        id: dept.id,
        name: dept.name,
        displayName: dept.displayName,
        userCount: dept._count.users,
        eventCount: dept._count.events,
      })),
      attendance: {
        totalRegistrations: eventAttendanceStats,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 },
    );
  }
}
