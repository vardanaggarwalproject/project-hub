import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getDriveService } from '@/lib/google-drive/client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if folders already exist
    if (project.driveFolderId && project.driveClientFolderId && project.driveInternalFolderId) {
      return NextResponse.json({
        exists: true,
        folders: {
          projectFolderId: project.driveFolderId,
          clientFolderId: project.driveClientFolderId,
          internalFolderId: project.driveInternalFolderId,
        },
      });
    }

    // Initialize Drive service
    const driveService = getDriveService();

    // Ensure folders exist
    const folders = await driveService.ensureProjectFolders(project.name);

    // Update project with folder IDs
    await db
      .update(projects)
      .set({
        driveFolderId: folders.projectFolderId,
        driveClientFolderId: folders.clientFolderId,
        driveInternalFolderId: folders.internalFolderId,
        driveFolderCreatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    return NextResponse.json({
      exists: false,
      created: true,
      folders,
    });

  } catch (error) {
    console.error('Check folders error:', error);
    return NextResponse.json(
      { error: 'Failed to check folders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
