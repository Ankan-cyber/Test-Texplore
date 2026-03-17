import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/departments - Get all departments
async function handleGet() {
  try {
    // Get current user for permission checking
    const user = await getCurrentUser();

    // Check if user has department:read permission or is admin
    const canReadDepartments =
      user &&
      (user.role === 'admin' || user.permissions.includes('department:read'));

    // If user doesn't have read permission, only show active departments
    const whereClause = canReadDepartments ? {} : { isActive: true };

    const departments = await prisma.department.findMany({
      where: whereClause,
      orderBy: {
        displayName: 'asc',
      },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 },
    );
  }
}

// POST /api/departments - Create new department
async function handlePost(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check permissions
    if (
      !user.permissions.includes('department:create') &&
      user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { name, displayName, description } = body;

    // Validate required fields
    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 },
      );
    }

    // Check if department already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [{ name: name.toLowerCase() }, { displayName: displayName }],
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name already exists' },
        { status: 400 },
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name: name.toLowerCase(),
        displayName,
        description: description || null,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return handleGet();
}

export async function POST(request: NextRequest) {
  return handlePost(request);
}
