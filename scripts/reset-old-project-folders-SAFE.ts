import { db } from '../src/lib/db/index.js';
import { projects } from '../src/lib/db/schema.js';
import { eq, isNotNull } from 'drizzle-orm';
import * as readline from 'readline';

// Projects with folders in WRONG location (need to be reset)
const PROJECTS_TO_RESET = [
  'Project-Hub',
  'The list',
  'Qiko',
  'Fanzoo',
  'testing project',
];

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function resetOldProjectFoldersSafe() {
  console.log('🔍 SAFE MODE: Reset Folder IDs for Old Projects\n');
  console.log('=' .repeat(80));
  console.log('⚠️  THIS SCRIPT WILL:');
  console.log('   ✅ ONLY clear folder IDs from DATABASE (projects table)');
  console.log('   ✅ NOT touch Google Drive at all');
  console.log('   ✅ NOT delete any files');
  console.log('   ✅ Allow next upload to create NEW folders in CORRECT location\n');
  console.log('⚠️  THIS SCRIPT WILL NOT:');
  console.log('   ❌ Delete anything from Google Drive');
  console.log('   ❌ Move or modify existing Drive folders');
  console.log('   ❌ Delete any database records');
  console.log('=' .repeat(80));
  console.log('\n');

  try {
    // Step 1: Get ALL projects with folders to show what will and won't be touched
    const allProjectsWithFolders = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.driveFolderId));

    console.log(`ℹ️  Found ${allProjectsWithFolders.length} total projects with folder IDs in database\n`);

    // Step 2: Show what will be changed
    console.log('📋 Projects to be reset:\n');

    const projectsData = [];

    for (const projectName of PROJECTS_TO_RESET) {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.name, projectName));

      if (!project) {
        console.log(`⚠️  "${projectName}" - NOT FOUND in database, will skip\n`);
        continue;
      }

      if (!project.driveFolderId) {
        console.log(`ℹ️  "${projectName}" - Already has NO folder IDs, will skip\n`);
        continue;
      }

      projectsData.push({
        id: project.id,
        name: project.name,
        driveFolderId: project.driveFolderId,
        driveClientFolderId: project.driveClientFolderId,
        driveInternalFolderId: project.driveInternalFolderId,
        driveFolderCreatedAt: project.driveFolderCreatedAt,
      });

      console.log(`📁 "${projectName}"`);
      console.log(`   Current folder IDs:`);
      console.log(`     - Project Folder: ${project.driveFolderId}`);
      console.log(`     - Client Folder:  ${project.driveClientFolderId}`);
      console.log(`     - Internal Folder: ${project.driveInternalFolderId}`);
      console.log(`     - Created At: ${project.driveFolderCreatedAt}`);
      console.log(`   Will be changed to:`);
      console.log(`     - Project Folder: NULL`);
      console.log(`     - Client Folder:  NULL`);
      console.log(`     - Internal Folder: NULL`);
      console.log(`     - Created At: NULL\n`);
    }

    if (projectsData.length === 0) {
      console.log('✅ No projects need to be reset. Exiting.\n');
      process.exit(0);
    }

    // Show which projects will NOT be touched
    console.log('\n✅ Projects that will NOT be touched (already correct or not in list):\n');
    const projectsToSkip = allProjectsWithFolders.filter(
      p => !PROJECTS_TO_RESET.includes(p.name)
    );

    if (projectsToSkip.length > 0) {
      for (const p of projectsToSkip) {
        console.log(`   ✓ ${p.name} (will remain unchanged)`);
      }
    } else {
      console.log('   (none)');
    }

    console.log('\n' + '=' .repeat(80));
    console.log(`\n⚠️  Ready to reset ${projectsData.length} project(s)\n`);

    // Step 2: Ask for confirmation
    const answer1 = await askQuestion('Type "YES" to continue (or anything else to cancel): ');

    if (answer1.trim().toUpperCase() !== 'YES') {
      console.log('\n❌ Operation cancelled. No changes made.\n');
      process.exit(0);
    }

    console.log('\n⚠️  FINAL CONFIRMATION:\n');
    console.log('This will clear folder IDs for:');
    for (const p of projectsData) {
      console.log(`  - ${p.name}`);
    }
    console.log();

    const answer2 = await askQuestion('Type "CONFIRM" to proceed: ');

    if (answer2.trim().toUpperCase() !== 'CONFIRM') {
      console.log('\n❌ Operation cancelled. No changes made.\n');
      process.exit(0);
    }

    // Step 3: Perform the reset
    console.log('\n🔧 Starting reset...\n');

    for (const projectData of projectsData) {
      console.log(`🔄 Resetting: ${projectData.name}`);

      await db
        .update(projects)
        .set({
          driveFolderId: null,
          driveClientFolderId: null,
          driveInternalFolderId: null,
          driveFolderCreatedAt: null,
        })
        .where(eq(projects.id, projectData.id));

      console.log(`   ✅ Reset complete!\n`);
    }

    console.log('=' .repeat(80));
    console.log('✅ ALL PROJECTS RESET SUCCESSFULLY!\n');
    console.log('📝 Next steps:');
    console.log('   1. Next upload to these projects will create NEW folders');
    console.log('   2. New folders will be in CORRECT location: project-hub-projects-data/[ProjectName]/');
    console.log('   3. Old folders still exist in Drive (you can delete them manually later)\n');
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.log('\n⚠️  If an error occurred, check the database - some projects may have been reset.\n');
  } finally {
    process.exit(0);
  }
}

resetOldProjectFoldersSafe();
