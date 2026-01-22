import { getAdminDriveService } from '../src/lib/google-drive/oauth-client.js';

async function listDriveFolders() {
  console.log('📁 Listing Google Drive folder structure...\n');

  try {
    const driveService = await getAdminDriveService();

    if (!driveService) {
      console.error('❌ Admin Drive service not available');
      return;
    }

    // Find the parent folder
    const parentFolderId = await driveService.findFolder('project-hub-projects-data');

    if (!parentFolderId) {
      console.log('❌ project-hub-projects-data folder not found');
      return;
    }

    console.log(`✅ Found parent folder: project-hub-projects-data (${parentFolderId})\n`);

    // List all folders inside the parent
    console.log('📂 Folders INSIDE project-hub-projects-data:');
    console.log('='.repeat(80));

    // @ts-ignore
    const response = await driveService.drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'name',
      spaces: 'drive',
    });

    const foldersInside = response.data.files || [];

    if (foldersInside.length === 0) {
      console.log('   (No folders found inside parent folder)');
    } else {
      for (const folder of foldersInside) {
        console.log(`   📁 ${folder.name} (ID: ${folder.id})`);
      }
    }

    console.log('\n' + '='.repeat(80));

    // List all folders at ROOT level (that might be misplaced project folders)
    console.log('\n📂 Folders at ROOT level (should NOT include project folders):');
    console.log('='.repeat(80));

    // @ts-ignore
    const rootResponse = await driveService.drive.files.list({
      q: `'root' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'name',
      spaces: 'drive',
    });

    const rootFolders = rootResponse.data.files || [];

    for (const folder of rootFolders) {
      if (folder.name === 'project-hub-projects-data') {
        console.log(`   ✅ ${folder.name} (ID: ${folder.id}) - CORRECT`);
      } else {
        console.log(`   ⚠️  ${folder.name} (ID: ${folder.id}) - MIGHT BE MISPLACED PROJECT FOLDER`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

listDriveFolders();
