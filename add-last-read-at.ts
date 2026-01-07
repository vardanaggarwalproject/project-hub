import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addLastReadAtColumn() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('🔌 Connecting to database...');

        // Check if column already exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_project_assignments' 
            AND column_name = 'last_read_at'
        `);

        if (checkColumn.rows.length > 0) {
            console.log('✅ Column last_read_at already exists!');
            process.exit(0);
        }

        console.log('📝 Adding last_read_at column...');

        // Add the column
        await pool.query(`
            ALTER TABLE user_project_assignments 
            ADD COLUMN last_read_at timestamp without time zone DEFAULT NOW() NOT NULL
        `);

        console.log('✅ Successfully added last_read_at column!');

        // Verify it was added
        const verify = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_project_assignments' 
            AND column_name = 'last_read_at'
        `);

        console.log('✅ Verification:', verify.rows[0]);

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.error('Details:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

addLastReadAtColumn();
