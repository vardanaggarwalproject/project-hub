import { db } from '../src/lib/db/index.js';
import { assets, projects } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkUploadedAssets() {
  console.log('🔍 Checking recently uploaded assets...\n');

  try {
    // Get all assets with Drive file IDs
    const allAssets = await db
      .select({
        assetId: assets.id,
        assetName: assets.name,
        projectId: assets.projectId,
        driveFileId: assets.driveFileId,
        folderType: assets.folderType,
        uploadedBy: assets.uploadedBy,
        fileUrl: assets.fileUrl,
        createdAt: assets.createdAt,
      })
      .from(assets)
      .orderBy(assets.createdAt);

    console.log(`Found ${allAssets.length} total assets\n`);

    // Show assets with Drive file IDs
    const driveAssets = allAssets.filter(a => a.driveFileId);
    console.log(`Assets uploaded to Google Drive: ${driveAssets.length}\n`);

    console.log('Recent Drive uploads:');
    console.log('='.repeat(100));

    for (const asset of driveAssets.slice(-10)) {
      // Get project details
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, asset.projectId));

      console.log(`\n📄 Asset: ${asset.assetName}`);
      console.log(`   Project: ${project?.name || 'Unknown'}`);
      console.log(`   Folder Type: ${asset.folderType || 'Not set'}`);
      console.log(`   Drive File ID: ${asset.driveFileId}`);
      console.log(`   File URL: ${asset.fileUrl}`);
      console.log(`   Uploaded: ${asset.createdAt}`);
      console.log(`   Project has folders: ${!!(project?.driveFolderId) ? 'YES' : 'NO'}`);

      if (project?.driveFolderId) {
        console.log(`   Expected location: project-hub-projects-data/${project.name}/${asset.folderType || 'unknown'}/`);
      } else {
        console.log(`   ⚠️  WARNING: Project missing Drive folder IDs in database!`);
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

checkUploadedAssets();
