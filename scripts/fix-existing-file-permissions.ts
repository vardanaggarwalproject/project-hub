import { db } from '../src/lib/db/index.js';
import { assets } from '../src/lib/db/schema.js';
import { isNotNull } from 'drizzle-orm';
import { getAdminDriveService } from '../src/lib/google-drive/oauth-client.js';

async function fixExistingFilePermissions() {
  console.log('🔓 Fixing permissions for existing files...\n');

  try {
    const driveService = await getAdminDriveService();
    if (!driveService) {
      console.error('❌ Admin Drive service not available');
      return;
    }

    // Get all assets with Drive file IDs
    const allAssets = await db
      .select({
        id: assets.id,
        name: assets.name,
        driveFileId: assets.driveFileId,
      })
      .from(assets)
      .where(isNotNull(assets.driveFileId));

    console.log(`Found ${allAssets.length} files with Drive IDs\n`);

    if (allAssets.length === 0) {
      console.log('✅ No files to fix\n');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const asset of allAssets) {
      try {
        console.log(`🔧 Fixing: ${asset.name}`);
        console.log(`   File ID: ${asset.driveFileId}`);

        // Check current permissions
        // @ts-ignore
        const currentPerms = await driveService.drive.permissions.list({
          fileId: asset.driveFileId!,
          fields: 'permissions(type, role)',
        });

        const hasPublicAccess = currentPerms.data.permissions?.some(
          p => p.type === 'anyone' && p.role === 'reader'
        );

        if (hasPublicAccess) {
          console.log(`   ✓ Already has public access, skipping\n`);
          successCount++;
          continue;
        }

        // Add public permission
        // @ts-ignore
        await driveService.drive.permissions.create({
          fileId: asset.driveFileId!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        console.log(`   ✅ Public access granted\n`);
        successCount++;

      } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('=' .repeat(80));
    console.log(`\n✅ Permission fix complete!`);
    console.log(`   Success: ${successCount}/${allAssets.length}`);
    console.log(`   Errors: ${errorCount}/${allAssets.length}\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some files failed. Common reasons:');
      console.log('   - File was deleted from Drive');
      console.log('   - File ID is invalid');
      console.log('   - Permission already exists\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

fixExistingFilePermissions();
