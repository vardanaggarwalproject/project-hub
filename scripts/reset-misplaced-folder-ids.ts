import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function resetMisplacedFolderIds() {
  console.log('🔧 Resetting folder IDs for misplaced projects...\n');

  // List of projects that have folders in wrong location
  const misplacedProjects = [
    'Project-Hub',
    'Qiko',
    'Fanzoo',
    'The list',
    'testing project',
  ];

  console.log('Projects to reset:');
  for (const projectName of misplacedProjects) {
    console.log(`  - ${projectName}`);
  }
  console.log();

  try {
    for (const projectName of misplacedProjects) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.name, projectName));

      if (!project) {
        console.log(`⚠️  Project "${projectName}" not found in database, skipping...`);
        continue;
      }

      if (!project.driveFolderId) {
        console.log(`✓ Project "${projectName}" - already has no folder IDs, skipping...`);
        continue;
      }

      console.log(`🔄 Resetting folder IDs for: ${projectName}`);
      console.log(`   Old folder ID: ${project.driveFolderId}`);

      await db
        .update(projects)
        .set({
          driveFolderId: null,
          driveClientFolderId: null,
          driveInternalFolderId: null,
          driveFolderCreatedAt: null,
        })
        .where(eq(projects.id, project.id));

      console.log(`   ✅ Reset complete!\n`);
    }

    console.log('✅ All misplaced folder IDs have been reset!');
    console.log('\n📝 Next steps:');
    console.log('   1. The old folders still exist in Google Drive');
    console.log('   2. Next upload to these projects will create NEW folders in correct location');
    console.log('   3. You can manually delete the old folders from Drive after confirming new ones work');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

resetMisplacedFolderIds();
