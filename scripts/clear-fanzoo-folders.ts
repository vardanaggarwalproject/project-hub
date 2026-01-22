import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function clearFanzooFolders() {
  console.log('🔧 Clearing folder IDs for Fanzoo...\n');

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.name, 'Fanzoo'));

    if (!project) {
      console.log('❌ Fanzoo project not found');
      return;
    }

    console.log(`Current folder IDs:`);
    console.log(`  driveFolderId: ${project.driveFolderId}`);
    console.log(`  driveClientFolderId: ${project.driveClientFolderId}`);
    console.log(`  driveInternalFolderId: ${project.driveInternalFolderId}\n`);

    await db
      .update(projects)
      .set({
        driveFolderId: null,
        driveClientFolderId: null,
        driveInternalFolderId: null,
        driveFolderCreatedAt: null,
      })
      .where(eq(projects.id, project.id));

    console.log('✅ Folder IDs cleared!');
    console.log('\n📝 Next upload to Fanzoo will create NEW folders in correct location.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

clearFanzooFolders();
