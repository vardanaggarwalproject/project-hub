import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { db } from '@/lib/db';
import { account, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
}

export interface UploadFileParams {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  folderId: string;
}

export class OAuthDriveService {
  private drive: drive_v3.Drive;

  constructor(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Find folder by name in user's Drive
   */
  async findFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      const escapedFolderName = folderName.replace(/'/g, "\\'");

      let query = `name='${escapedFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      } else {
        query += ` and 'root' in parents`;
      }

      console.log(`🔎 Searching for folder: "${folderName}"${parentFolderId ? ` inside parent: ${parentFolderId}` : ' in root'}`);

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, parents)',
        spaces: 'drive',
      });

      const folders = response.data.files || [];

      if (folders.length > 0) {
        console.log(`✅ Found folder "${folderName}": ${folders[0].id}`);
        return folders[0].id || null;
      } else {
        console.log(`❌ Folder "${folderName}" not found${parentFolderId ? ` inside parent ${parentFolderId}` : ' in root'}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error finding folder "${folderName}":`, error);
      throw error; // Don't swallow errors - let caller handle them
    }
  }

  /**
   * Create folder in user's Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<{ id: string; name: string }> {
    try {
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Ensure project folder structure exists under "project-hub" parent folder
   */
  async ensureProjectFolders(projectName: string): Promise<{
    projectFolderId: string;
    clientFolderId: string;
    internalFolderId: string;
  }> {
    try {
      // 1. Check/Create "project-hub-projects-data" parent folder in user's root
      console.log('🔍 Looking for parent folder: project-hub-projects-data');
      let parentFolderId = await this.findFolder('project-hub-projects-data');
      if (!parentFolderId) {
        console.log('📁 Creating parent folder: project-hub-projects-data');
        const folder = await this.createFolder('project-hub-projects-data');
        parentFolderId = folder.id;
        console.log('✅ Parent folder created:', parentFolderId);
      } else {
        console.log('✅ Parent folder found:', parentFolderId);
      }

      // 2. Check/Create project folder INSIDE "project-hub-projects-data"
      console.log(`🔍 Looking for project folder: ${projectName}`);
      let projectFolderId = await this.findFolder(projectName, parentFolderId);
      if (!projectFolderId) {
        console.log(`📁 Creating project folder: ${projectName}`);
        const folder = await this.createFolder(projectName, parentFolderId);
        projectFolderId = folder.id;
        console.log('✅ Project folder created:', projectFolderId);
      } else {
        console.log('✅ Project folder found:', projectFolderId);
      }

      // 3. Check/Create 'client' subfolder
      console.log('🔍 Looking for client subfolder');
      let clientFolderId = await this.findFolder('client', projectFolderId);
      if (!clientFolderId) {
        console.log('📁 Creating client subfolder');
        const folder = await this.createFolder('client', projectFolderId);
        clientFolderId = folder.id;
        console.log('✅ Client folder created:', clientFolderId);
      } else {
        console.log('✅ Client folder found:', clientFolderId);
      }

      // 4. Check/Create 'internal' subfolder
      console.log('🔍 Looking for internal subfolder');
      let internalFolderId = await this.findFolder('internal', projectFolderId);
      if (!internalFolderId) {
        console.log('📁 Creating internal subfolder');
        const folder = await this.createFolder('internal', projectFolderId);
        internalFolderId = folder.id;
        console.log('✅ Internal folder created:', internalFolderId);
      } else {
        console.log('✅ Internal folder found:', internalFolderId);
      }

      console.log('✅ All folders ready:', { projectFolderId, clientFolderId, internalFolderId });

      return {
        projectFolderId,
        clientFolderId,
        internalFolderId,
      };
    } catch (error) {
      console.error('Error ensuring project folders:', error);
      throw error;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(params: UploadFileParams): Promise<DriveFile> {
    try {
      const { fileName, fileBuffer, mimeType, folderId } = params;

      const stream = Readable.from(fileBuffer);

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: stream,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, mimeType, webViewLink, webContentLink, size',
      });

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink!,
        webContentLink: response.data.webContentLink || '',
        size: response.data.size || '0',
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file to Google Drive');
    }
  }
}

/**
 * Get OAuth Drive service for the ADMIN user only (for centralized storage)
 * All users will use the admin's Drive credentials
 */
export async function getAdminDriveService(): Promise<OAuthDriveService | null> {
  const adminEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL || 'himanshu064@gmail.com';

  try {
    // Get admin's Google Drive account by email
    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.error('Admin user not found in database');
      return null;
    }

    return await getUserDriveService(adminUser.id);
  } catch (error) {
    console.error('Error getting admin Drive service:', error);
    return null;
  }
}

/**
 * Get OAuth Drive service for a specific user
 */
export async function getUserDriveService(userId: string): Promise<OAuthDriveService | null> {
  try {
    // Get user's Google Drive account
    const [userAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, 'google-drive')
        )
      );

    if (!userAccount || !userAccount.accessToken) {
      return null;
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = userAccount.accessTokenExpiresAt;

    if (expiresAt && expiresAt < now) {
      // Token expired, refresh it
      if (!userAccount.refreshToken) {
        return null;
      }

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
          refresh_token: userAccount.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        console.error('Failed to refresh token');
        return null;
      }

      const tokens = await refreshResponse.json();
      const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Update token in database
      await db
        .update(account)
        .set({
          accessToken: tokens.access_token,
          accessTokenExpiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(account.id, userAccount.id));

      return new OAuthDriveService(tokens.access_token);
    }

    return new OAuthDriveService(userAccount.accessToken);
  } catch (error) {
    console.error('Error getting user Drive service:', error);
    return null;
  }
}
