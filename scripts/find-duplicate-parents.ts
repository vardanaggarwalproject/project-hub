import { getAdminDriveService } from '../src/lib/google-drive/oauth-client.js';

async function findDuplicateParents() {
  console.log('🔍 Checking for duplicate parent folders...\n');

  try {
    const driveService = await getAdminDriveService();
    if (!driveService) {
      console.log('❌ Drive service not available');
      return;
    }

    // Search for ALL folders named "project-hub" (old name)
    // @ts-ignore
    const oldFolderResponse = await driveService.drive.files.list({
      q: `name='project-hub' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, parents)',
      spaces: 'drive',
    });

    const oldFolders = oldFolderResponse.data.files || [];
    console.log(`Found ${oldFolders.length} folder(s) named "project-hub":`);
    for (const folder of oldFolders) {
      console.log(`  - ID: ${folder.id}, Parents: ${folder.parents?.join(', ') || 'root'}`);
    }
    console.log();

    // Search for ALL folders named "project-hub-projects-data" (new name)
    // @ts-ignore
    const newFolderResponse = await driveService.drive.files.list({
      q: `name='project-hub-projects-data' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, parents)',
      spaces: 'drive',
    });

    const newFolders = newFolderResponse.data.files || [];
    console.log(`Found ${newFolders.length} folder(s) named "project-hub-projects-data":`);
    for (const folder of newFolders) {
      console.log(`  - ID: ${folder.id}, Parents: ${folder.parents?.join(', ') || 'root'}`);
    }
    console.log();

    if (newFolders.length > 1) {
      console.log('⚠️  WARNING: Multiple "project-hub-projects-data" folders found!');
      console.log('   The code might be picking the wrong one!');
    }

    if (oldFolders.length > 0 && newFolders.length > 0) {
      console.log('⚠️  Both old "project-hub" and new "project-hub-projects-data" folders exist!');
      console.log('   This explains why some uploads went to the wrong folder.');
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

findDuplicateParents();
