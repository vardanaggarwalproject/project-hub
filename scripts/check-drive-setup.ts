import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { sql } from 'drizzle-orm';

async function checkDriveSetup() {
  console.log('🔍 Checking Google Drive Integration Setup...\n');

  try {
    // Check if the columns exist in the database
    console.log('1️⃣ Checking database columns...');
    const result = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'projects'
      AND column_name IN ('drive_folder_id', 'drive_client_folder_id', 'drive_internal_folder_id', 'drive_folder_created_at')
      ORDER BY column_name;
    `);

    console.log('   Found columns:', result.rows);

    if (result.rows.length === 0) {
      console.log('   ❌ No Google Drive columns found in projects table!');
      console.log('   🔧 Solution: Run "npm run db:push" to apply migrations');
      return;
    } else if (result.rows.length < 4) {
      console.log(`   ⚠️  Only ${result.rows.length}/4 columns found`);
    } else {
      console.log('   ✅ All Google Drive columns exist\n');
    }

    // Check projects and their folder status
    console.log('2️⃣ Checking projects...');
    const allProjects = await db.select().from(projects);

    console.log(`   Total projects: ${allProjects.length}\n`);

    console.log('   Project Folder Status:');
    console.log('   ' + '='.repeat(80));

    for (const project of allProjects) {
      const hasFolders = !!(project.driveFolderId && project.driveClientFolderId && project.driveInternalFolderId);
      const status = hasFolders ? '✅' : '❌';

      console.log(`   ${status} ${project.name}`);
      if (hasFolders) {
        console.log(`      - Project Folder ID: ${project.driveFolderId}`);
        console.log(`      - Client Folder ID: ${project.driveClientFolderId}`);
        console.log(`      - Internal Folder ID: ${project.driveInternalFolderId}`);
        console.log(`      - Created At: ${project.driveFolderCreatedAt}`);
      } else {
        console.log(`      - No Drive folders configured`);
      }
      console.log();
    }

    // Check for assets
    console.log('3️⃣ Checking assets table columns...');
    const assetColumnsResult = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'assets'
      AND column_name IN ('drive_file_id', 'folder_type')
      ORDER BY column_name;
    `);

    console.log('   Found columns:', assetColumnsResult.rows);

    if (assetColumnsResult.rows.length === 2) {
      console.log('   ✅ All Google Drive asset columns exist\n');
    } else {
      console.log(`   ⚠️  Only ${assetColumnsResult.rows.length}/2 columns found\n`);
    }

    console.log('✅ Diagnostic check complete!');

  } catch (error) {
    console.error('❌ Error during diagnostic check:', error);
  } finally {
    process.exit(0);
  }
}

checkDriveSetup();
