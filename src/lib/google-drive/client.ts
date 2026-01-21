import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

export interface DriveConfig {
  serviceAccountKey: string;
  rootFolderId: string;
}

export interface UploadFileParams {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  folderId: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private rootFolderId: string;

  constructor(config: DriveConfig) {
    // Parse service account key
    let credentials;
    try {
      credentials = typeof config.serviceAccountKey === 'string'
        ? JSON.parse(config.serviceAccountKey)
        : config.serviceAccountKey;
    } catch (error) {
      throw new Error('Invalid service account key format');
    }

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    // Initialize Drive client
    this.drive = google.drive({ version: 'v3', auth });
    this.rootFolderId = config.rootFolderId;
  }

  /**
   * Check if a folder exists by name within a parent folder
   */
  async findFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    try {
      // Escape single quotes in folder name to prevent query issues
      const escapedFolderName = folderName.replace(/'/g, "\\'");

      let query = `name='${escapedFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      } else {
        // Search in root of service account's drive
        query += ` and 'root' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const folders = response.data.files || [];
      return folders.length > 0 ? folders[0].id || null : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      throw new Error(`Failed to find folder: ${folderName}`);
    }
  }

  /**
   * Create a new folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<DriveFolder> {
    try {
      const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      // Only add parent if provided (for service account's own drive, don't specify parent)
      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink',
      });

      const folderId = response.data.id!;

      // Share with himanshu first, then transfer ownership
      const ownerEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL || 'himanshu064@gmail.com';
      try {
        // Step 1: Add himanshu as writer first
        await this.drive.permissions.create({
          fileId: folderId,
          requestBody: {
            type: 'user',
            role: 'writer',
            emailAddress: ownerEmail,
          },
          sendNotificationEmail: false,
        });

        // Step 2: Transfer ownership (requires himanshu to have access first)
        await this.drive.permissions.create({
          fileId: folderId,
          transferOwnership: true,
          requestBody: {
            type: 'user',
            role: 'owner',
            emailAddress: ownerEmail,
          },
        });

        console.log(`✓ Transferred folder ownership to ${ownerEmail}`);
      } catch (shareError) {
        console.error('Failed to transfer folder ownership:', shareError);
        // Continue even if ownership transfer fails
      }

      return {
        id: folderId,
        name: response.data.name!,
        webViewLink: response.data.webViewLink!,
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error(`Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Ensure project folder structure exists (project/client and project/internal)
   * Creates folders inside the shared root folder (himanshu's drive)
   */
  async ensureProjectFolders(projectName: string): Promise<{
    projectFolderId: string;
    clientFolderId: string;
    internalFolderId: string;
  }> {
    try {
      // 1. Check/Create project folder INSIDE the shared root folder
      let projectFolderId = await this.findFolder(projectName, this.rootFolderId);
      if (!projectFolderId) {
        const folder = await this.createFolder(projectName, this.rootFolderId);
        projectFolderId = folder.id;
      }

      // 2. Check/Create 'client' subfolder
      let clientFolderId = await this.findFolder('client', projectFolderId);
      if (!clientFolderId) {
        const folder = await this.createFolder('client', projectFolderId);
        clientFolderId = folder.id;
      }

      // 3. Check/Create 'internal' subfolder
      let internalFolderId = await this.findFolder('internal', projectFolderId);
      if (!internalFolderId) {
        const folder = await this.createFolder('internal', projectFolderId);
        internalFolderId = folder.id;
      }

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
   * Upload a file to Google Drive
   */
  async uploadFile(params: UploadFileParams): Promise<DriveFile> {
    try {
      const { fileName, fileBuffer, mimeType, folderId } = params;

      // Create readable stream from buffer
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

      const fileId = response.data.id!;

      // Share with himanshu first, then transfer ownership
      const ownerEmail = process.env.GOOGLE_DRIVE_OWNER_EMAIL || 'himanshu064@gmail.com';
      try {
        // Step 1: Add himanshu as writer first
        await this.drive.permissions.create({
          fileId: fileId,
          requestBody: {
            type: 'user',
            role: 'writer',
            emailAddress: ownerEmail,
          },
          sendNotificationEmail: false,
        });

        // Step 2: Transfer ownership (requires himanshu to have access first)
        await this.drive.permissions.create({
          fileId: fileId,
          transferOwnership: true,
          requestBody: {
            type: 'user',
            role: 'owner',
            emailAddress: ownerEmail,
          },
        });

        console.log(`✓ Transferred file ownership to ${ownerEmail}`);
      } catch (permError) {
        console.error('Failed to transfer file ownership:', permError);
        // File is uploaded, ownership transfer failed - not critical
      }

      return {
        id: fileId,
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

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file from Google Drive');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
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
      console.error('Error getting file metadata:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

/**
 * Singleton instance of GoogleDriveService
 */
let driveServiceInstance: GoogleDriveService | null = null;

export function getDriveService(): GoogleDriveService {
  if (!driveServiceInstance) {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!serviceAccountKey || !rootFolderId) {
      throw new Error('Google Drive configuration is missing. Check environment variables.');
    }

    driveServiceInstance = new GoogleDriveService({
      serviceAccountKey,
      rootFolderId,
    });
  }

  return driveServiceInstance;
}
