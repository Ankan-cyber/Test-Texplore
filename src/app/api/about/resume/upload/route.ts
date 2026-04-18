import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  requireAnyUserPermission,
  requireAuthenticatedUser,
} from '@/lib/api-guards';
import { uploadFile } from '@/lib/cloudinary';
import {
  sanitizeResumeFileName,
  validateResumeFile,
} from '@/lib/resume-upload';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser();
    if ('response' in authResult) {
      return authResult.response;
    }

    const permissionResponse = requireAnyUserPermission(authResult.user, [
      'about:self:update',
      'about:manage',
    ]);
    if (permissionResponse) {
      return permissionResponse;
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    const validationError = validateResumeFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 },
      );
    }

    const typedFile = file as File;

    const arrayBuffer = await typedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = typedFile.name || 'resume.pdf';
    const safeFileName = sanitizeResumeFileName(fileName);
    const uniqueFileName = `${Date.now()}_${randomUUID()}_${safeFileName}`;

    const uploadResult = await uploadFile(buffer, {
      folder: 'texplore/about/resumes',
      public_id: uniqueFileName,
      tags: ['about', 'resume'],
      resourceType: 'raw',
    });

    return NextResponse.json(
      {
        success: true,
        url: uploadResult.secure_url,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 },
    );
  }
}
