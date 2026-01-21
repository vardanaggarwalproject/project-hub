import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assets, projects, user, userProjectAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAdminDriveService } from '@/lib/google-drive/oauth-client';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Maximum file size (50MB default)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUser = session.user;

    // 2. Get admin's Drive service (all users upload to admin's Drive)
    const driveService = await getAdminDriveService();

    if (!driveService) {
      return NextResponse.json(
        { error: 'Admin has not connected Google Drive yet. Please contact the administrator.' },
        { status: 403 }
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const folderType = formData.get('folderType') as 'client' | 'internal';
    const assetName = formData.get('assetName') as string;

    // 4. Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!projectId || !folderType) {
      return NextResponse.json(
        { error: 'Project ID and folder type are required' },
        { status: 400 }
      );
    }

    if (!['client', 'internal'].includes(folderType)) {
      return NextResponse.json(
        { error: 'Invalid folder type. Must be "client" or "internal"' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 5. Get user details and role
    const [userDetails] = await db
      .select()
      .from(user)
      .where(eq(user.id, currentUser.id));

    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userRole = userDetails.role;

    // 6. Check if user is assigned to this project
    const [assignment] = await db
      .select()
      .from(userProjectAssignments)
      .where(
        and(
          eq(userProjectAssignments.userId, currentUser.id),
          eq(userProjectAssignments.projectId, projectId)
        )
      );

    if (!assignment && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'You are not assigned to this project' },
        { status: 403 }
      );
    }

    // 7. Check folder permissions
    // Only admins can upload to 'client' folder
    if (folderType === 'client' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can upload to client folders' },
        { status: 403 }
      );
    }

    // 8. Get project details
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

    // 9. Ensure project folders exist
    let projectFolderIds;

    if (project.driveFolderId && project.driveClientFolderId && project.driveInternalFolderId) {
      // Use existing folder IDs
      projectFolderIds = {
        projectFolderId: project.driveFolderId,
        clientFolderId: project.driveClientFolderId,
        internalFolderId: project.driveInternalFolderId,
      };
    } else {
      // Create folders and update project
      projectFolderIds = await driveService.ensureProjectFolders(project.name);

      await db
        .update(projects)
        .set({
          driveFolderId: projectFolderIds.projectFolderId,
          driveClientFolderId: projectFolderIds.clientFolderId,
          driveInternalFolderId: projectFolderIds.internalFolderId,
          driveFolderCreatedAt: new Date(),
        })
        .where(eq(projects.id, projectId));
    }

    // 10. Determine target folder
    const targetFolderId = folderType === 'client'
      ? projectFolderIds.clientFolderId
      : projectFolderIds.internalFolderId;

    // 11. Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 12. Upload to Google Drive (using user's account!)
    const uploadedFile = await driveService.uploadFile({
      fileName: file.name,
      fileBuffer,
      mimeType: file.type,
      folderId: targetFolderId,
    });

    // 13. Save to database
    const [newAsset] = await db
      .insert(assets)
      .values({
        id: crypto.randomUUID(),
        name: assetName || file.name,
        fileUrl: uploadedFile.webViewLink,
        fileType: file.type,
        fileSize: uploadedFile.size,
        projectId,
        uploadedBy: currentUser.id,
        driveFileId: uploadedFile.id,
        folderType,
        allowedRoles: ['admin', 'developer', 'tester', 'designer'],
      })
      .returning();

    // 14. Return success response
    return NextResponse.json({
      success: true,
      asset: {
        id: newAsset.id,
        name: newAsset.name,
        fileUrl: newAsset.fileUrl,
        driveFileId: newAsset.driveFileId,
        folderType: newAsset.folderType,
        uploadedBy: currentUser.name,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Drive upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
