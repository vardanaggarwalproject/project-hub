import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { getAdminDriveService } from '../src/lib/google-drive/oauth-client.js';
import { isNotNull } from 'drizzle-orm';

async function findMisplacedFolders() {
  console.log('🔍 Finding misplaced project folders...\n');

  try {
    const driveService = await getAdminDriveService();
    if (!driveService) {
      console.log('❌ Drive service not available');
      return;
    }

    // Get correct parent folder ID
    const correctParentId = await driveService.findFolder('project-hub-projects-data');
    if (!correctParentId) {
      console.log('❌ project-hub-projects-data folder not found');
      return;
    }

    console.log(`✅ Correct parent folder ID: ${correctParentId}\n`);

    // Get all projects with Drive folder IDs
    const projectsWithFolders = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.driveFolderId));

    console.log(`Found ${projectsWithFolders.length} projects with Drive folders\n`);
    console.log('='.repeat(100));

    for (const project of projectsWithFolders) {
      try {
        // @ts-ignore
        const folderResponse = await driveService.drive.files.get({
          fileId: project.driveFolderId!,
          fields: 'id, name, parents',
        });

        const folder = folderResponse.data;
        const parent = folder.parents?.[0];
        const isCorrect = parent === correctParentId;

        console.log(`\n${isCorrect ? '✅' : '❌'} Project: ${project.name}`);
        console.log(`   Folder ID: ${folder.id}`);
        console.log(`   Parent ID: ${parent || 'NO PARENT'}`);

        if (isCorrect) {
          console.log(`   Location: CORRECT (inside project-hub-projects-data)`);
        } else if (parent) {
          console.log(`   Location: WRONG (parent should be ${correctParentId})`);
          console.log(`   🔧 Needs to be moved!`);
        } else {
          console.log(`   Location: UNKNOWN (no parent)`);
        }

      } catch (error: any) {
        console.log(`\n❌ Project: ${project.name}`);
        console.log(`   Error checking folder: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

findMisplacedFolders();
