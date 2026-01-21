// Load environment variables
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first (takes priority), then .env
dotenv.config({ path: join(__dirname, '../../../.env.local') });
dotenv.config({ path: join(__dirname, '../../../.env') });

// Quick verification that all env vars are set
const requiredVars = [
  'GOOGLE_DRIVE_ENABLED',
  'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_SERVICE_ACCOUNT_KEY',
];

console.log('🔍 Verifying Google Drive environment variables...\n');

const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

// Verify JSON key is valid
try {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  if (key.type !== 'service_account') {
    throw new Error('Invalid service account key: type must be "service_account"');
  }
  console.log('✅ GOOGLE_DRIVE_ENABLED:', process.env.GOOGLE_DRIVE_ENABLED);
  console.log('✅ GOOGLE_DRIVE_ROOT_FOLDER_ID:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  console.log('✅ GOOGLE_SERVICE_ACCOUNT_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  console.log('✅ GOOGLE_SERVICE_ACCOUNT_KEY: Valid JSON (type: service_account)');
  console.log('\n🎉 All Google Drive environment variables are set correctly!');
} catch (error) {
  console.error('❌ Invalid GOOGLE_SERVICE_ACCOUNT_KEY:', error);
  process.exit(1);
}
