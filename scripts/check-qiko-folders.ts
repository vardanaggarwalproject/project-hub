import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import { getAdminDriveService } from '../src/lib/google-drive/oauth-client.js';

async function checkQikoFolders() {
  console.log('🔍 Checking Qiko project folders...\n');

  try {
    // Get Qiko project from database
    const [qiko] = await db
      .select()
      .from(projects)
      .where(eq(projects.name, 'Qiko'));

    if (!qiko) {
      console.log('❌ Qiko project not found in database');
      return;
    }

    console.log('✅ Qiko project found in database:');
    console.log(`   Project ID: ${qiko.id}`);
    console.log(`   Drive Folder ID: ${qiko.driveFolderId}`);
    console.log(`   Client Folder ID: ${qiko.driveClientFolderId}`);
    console.log(`   Internal Folder ID: ${qiko.driveInternalFolderId}`);
    console.log(`   Folders created at: ${qiko.driveFolderCreatedAt}\n`);

    // Now check where these folders actually are in Google Drive
    const driveService = await getAdminDriveService();
    if (!driveService) {
      console.log('❌ Drive service not available');
      return;
    }

    console.log('📁 Checking actual folder locations in Google Drive:\n');

    if (qiko.driveFolderId) {
      // @ts-ignore
      const projectFolderResponse = await driveService.drive.files.get({
        fileId: qiko.driveFolderId,
        fields: 'id, name, parents',
      });

      const projectFolder = projectFolderResponse.data;
      console.log(`📂 Project Folder: ${projectFolder.name} (${projectFolder.id})`);
      console.log(`   Parents: ${projectFolder.parents?.join(', ') || 'No parents'}`);

      if (projectFolder.parents) {
        // Check if parent is the correct folder
        const parentFolderId = await driveService.findFolder('project-hub-projects-data');
        if (projectFolder.parents[0] === parentFolderId) {
          console.log(`   ✅ CORRECT: Inside project-hub-projects-data\n`);
        } else if (projectFolder.parents[0] === 'root' || projectFolder.parents.includes('root')) {
          console.log(`   ❌ WRONG: At ROOT level (should be inside project-hub-projects-data)\n`);
        } else {
          console.log(`   ⚠️  UNKNOWN: Inside folder ${projectFolder.parents[0]}\n`);
        }
      }
    }

    console.log('✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkQikoFolders();
