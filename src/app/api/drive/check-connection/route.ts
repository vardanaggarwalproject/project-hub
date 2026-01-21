import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAdminDriveService } from '@/lib/google-drive/oauth-client';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if ADMIN has connected Google Drive (not current user)
    const driveService = await getAdminDriveService();

    return NextResponse.json({
      connected: !!driveService,
      message: driveService
        ? 'Admin Drive connected - all users can upload'
        : 'Admin needs to connect Google Drive first',
    });
  } catch (error) {
    console.error('Drive connection check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Drive connection' },
      { status: 500 }
    );
  }
}
