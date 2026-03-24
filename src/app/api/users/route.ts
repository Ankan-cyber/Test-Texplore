import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { getAssignableRoles, getAvailablePermissions } from '@/lib/permissions';
import { hashPassword } from '@/lib/auth';
import { sanitizeUserResponse, sanitizeUsersResponse } from '@/lib/user-response';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
  requireUserPermission,
} from '@/lib/api-guards';
import { buildRequestMeta, writeAuditLog } from '@/lib/audit-log';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { Prisma } from '@prisma/client';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// Utility function to validate ObjectId format
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z
    .enum(['member', 'coordinator', 'vice_president', 'president', 'admin'])
    .optional(),
  permissions: z.array(z.string()).optional(),
  departmentId: z
    .string()
    .optional()
    .transform((val) => {
      // Convert "none" or empty string to null
      if (!val || val === 'none' || val === '') {
        return null;
      }
      // Validate ObjectId format if provided
      if (val && !isValidObjectId(val)) {
        throw new Error('Invalid department ID format');
      }
      return val;
    }),
});

// Validation schema for query parameters
const querySchema = z.object({
  page: z
    .string()
    .transform(Number)
    .default(() => 1),
  limit: z
    .string()
    .transform(Number)
    .default(() => 10),
  search: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  includeAboutProfileOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});

// Generate a temporary password
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specials = '!@#$%^&*';
  const allChars = `${uppercase}${lowercase}${digits}${specials}`;

  const pickRandom = (charset: string) => charset[randomInt(charset.length)];

  const passwordChars = [
    pickRandom(uppercase),
    pickRandom(lowercase),
    pickRandom(digits),
    pickRandom(specials),
  ];

  while (passwordChars.length < 12) {
    passwordChars.push(pickRandom(allChars));
  }

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

// Send email notification using Nodemailer
async function sendWelcomeEmail(
  email: string,
  name: string,
  temporaryPassword: string,
) {
  try {
    // Email configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromEmail = smtpUser;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error(
        'SMTP configuration missing. Please check environment variables.',
      );
      console.log(
        `Welcome email would be sent to ${email} with temporary password: ${temporaryPassword}`,
      );
      return;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Email content
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const supportEmail =
      process.env.SUPPORT_EMAIL || 'support@texplore-amity.com';

    const mailOptions = {
      from: `"Texplore Amity" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Texplore Amity - Your Account Details',
      html: `
        <!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Welcome to Texplore Amity</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #0a4177;
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px 10px 0 0;
      }
      .logo {
        width: 32px;
        height: 32px;
        margin-right: 12px;
        vertical-align: middle;
      }
      .title-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 10px 10px;
      }
      .credentials {
        background: #e8f4fd;
        border: 1px solid #b3d9ff;
        border-radius: 5px;
        padding: 20px;
        margin: 20px 0;
      }
      .button {
        display: inline-block;
        background: #0a4177;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
        transition: background-color 0.3s ease;
      }
      .button:hover {
        background: #083a6b;
      }
      .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        color: #666;
        font-size: 14px;
      }
      .logotitle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .logotitle img {
        width: 46px;
        height: 46px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="logotitle">
        <img src="${loginUrl}/favicon.ico" alt="Texplore Amity Logo" class="logo" />
        <h1>Welcome to Texplore Amity!</h1>
      </div>
      <p>Your account has been created successfully</p>
    </div>

    <div class="content">
      <h2>Hello ${name},</h2>

      <p>
        Welcome to Texplore Amity! Your account has been created successfully by
        an administrator.
      </p>

      <div class="credentials">
        <h3>Your Login Credentials:</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>

      <p>
        <strong>Important:</strong> Please change your password after your first
        login for security purposes.
      </p>

      <a href="${loginUrl}/auth/login" class="button">Login to Your Account</a>

      <h3>What's Next?</h3>
      <ul>
        <li>Log in using the credentials above</li>
        <li>Update your profile information</li>
        <li>Change your password</li>
        <li>Explore the platform features</li>
      </ul>

      <p>
        If you have any questions or need assistance, please don't hesitate to
        contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>.
      </p>
    </div>

    <div class="footer">
      <p>
        Best regards,<br />
        <strong>Texplore Amity Team</strong>
      </p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </body>
</html>

      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`Welcome email sent successfully to ${email}`);
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Fallback to console log for development
    console.log(
      `Welcome email would be sent to ${email} with temporary password: ${temporaryPassword}`,
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireUserPermission(
      authResult.user,
      'user:read',
    );
    if (permissionResponse) {
      return permissionResponse;
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: Prisma.UserWhereInput = {};

    if (!query.includeAboutProfileOnly) {
      // Exclude About-only users by excluding users that are linked to AboutMember.
      // This avoids relying on Prisma client regeneration timing for new User fields.
      const aboutModel = (prisma as unknown as { aboutMember?: any }).aboutMember;
      if (aboutModel) {
        const linked = await aboutModel.findMany({
          select: { userId: true },
        });
        const linkedUserIds = linked.map((entry: { userId: string }) => entry.userId);
        if (linkedUserIds.length > 0) {
          where.NOT = { id: { in: linkedUserIds } };
        }
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.department) {
      where.department = {
        name: query.department,
      };
    }

    if (query.role) {
      where.role = query.role as any;
    }

    // Fetch users with pagination and relations
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users: sanitizeUsersResponse(users),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    // Apply rate limiting per authenticated user
    const rateLimitResponse = checkRateLimit(authResult.user.id, RATE_LIMIT_CONFIGS.USER_CREATION);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'user:create',
      'user:update',
      'user:delete',
      'user:approve',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);
    const requestMeta = buildRequestMeta(request, authResult.user);

    // Enforce role assignment restrictions
    const creatorRole = authResult.user.role;
    const targetRole:
      | 'member'
      | 'coordinator'
      | 'vice_president'
      | 'president'
      | 'admin' = (validatedData.role as any) || 'member';
    const allowedRoles = getAssignableRoles(creatorRole);

    if (!allowedRoles.includes(targetRole as any)) {
      return NextResponse.json(
        { error: 'You are not allowed to assign this role' },
        { status: 403 },
      );
    }

    // If permissions provided, validate against available permissions
    if (validatedData.permissions && validatedData.permissions.length > 0) {
      const available = getAvailablePermissions(creatorRole, targetRole);
      const invalid = validatedData.permissions.filter(
        (p: string) => !(available as string[]).includes(p),
      );
      if (invalid.length > 0) {
        return NextResponse.json(
          {
            error: `You cannot assign these permissions: ${invalid.join(', ')}`,
          },
          { status: 403 },
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 },
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Create user with transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Validate departmentId if provided
      if (validatedData.departmentId) {
        const department = await tx.department.findUnique({
          where: { id: validatedData.departmentId },
        });
        if (!department) {
          throw new Error('Invalid department ID provided');
        }
      }

      // Create the user
      const createdUser = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          status: 'APPROVED',
          role: targetRole,
          permissions: validatedData.permissions || [
            'event:read',
            'gallery:read',
            'contact:submit',
          ],
          departmentId: validatedData.departmentId,
        },
        include: {
          department: true,
          profile: true,
        },
      });

      return createdUser;
    });

    // Send welcome email with temporary password
    await sendWelcomeEmail(
      validatedData.email,
      validatedData.name,
      temporaryPassword,
    );

    await writeAuditLog({
      action: 'USER_CREATED',
      actorId: authResult.user.id,
      actorRole: authResult.user.role,
      resourceType: 'user',
      resourceId: newUser.id,
      success: true,
      metadata: {
        createdEmail: validatedData.email,
        createdRole: targetRole,
      },
      requestMeta,
    });

    return NextResponse.json({
      user: sanitizeUserResponse(newUser),
      message:
        'User created successfully. Welcome email sent with temporary password.',
    });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 },
      );
    }

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message === 'Invalid department ID provided') {
        return NextResponse.json(
          { error: 'Invalid department ID provided' },
          { status: 400 },
        );
      }
    }

    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2023') {
        return NextResponse.json(
          { error: 'Invalid ObjectId format provided' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
