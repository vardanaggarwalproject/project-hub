import { getDriveService } from './client';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env.local') });
dotenv.config({ path: join(__dirname, '../../../.env') });

async function testDriveAccess() {
  try {
    console.log('🔍 Testing Google Drive access...\n');

    const driveService = getDriveService();

    console.log('✓ Drive service initialized');
    console.log('✓ Service account authenticated');

    // Test creating a test folder
    const testFolderName = `test-${Date.now()}`;
    console.log(`\n📁 Creating test folder: ${testFolderName}...`);

    const folder = await driveService.createFolder(
      testFolderName,
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!
    );

    console.log('✓ Test folder created successfully!');
    console.log(`  Folder ID: ${folder.id}`);
    console.log(`  Folder Link: ${folder.webViewLink}`);

    console.log('\n✅ All tests passed! Google Drive integration is working correctly.');
    console.log('\n💡 Check your Google Drive at:');
    console.log(`   https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check that GOOGLE_DRIVE_ROOT_FOLDER_ID is correct');
    console.error('2. Verify service account has Editor permission on the folder');
    console.error('3. Ensure GOOGLE_SERVICE_ACCOUNT_KEY is valid JSON');
    process.exit(1);
  }
}

testDriveAccess();
