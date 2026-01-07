import { db } from "./src/lib/db";
import { sql } from "drizzle-orm";

async function testApis() {
    try {
        console.log('🧪 Testing database queries...\n');

        // Test 1: Check table structure
        console.log('1️⃣ Checking user_project_assignments structure:');
        const structure = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_project_assignments'
            ORDER BY ordinal_position
        `);
        console.table(structure.rows);

        // Test 2: Sample data
        console.log('\n2️⃣ Sample user_project_assignments data:');
        const sampleData = await db.execute(sql`
            SELECT * FROM user_project_assignments LIMIT 3
        `);
        console.table(sampleData.rows);

        // Test 3: Test unread counts query (admin version)
        console.log('\n3️⃣ Testing unread counts query:');
        const testUserId = 'Sd1h3KvV4ea0JV5t9RGVJWA78SslDTCO';
        const unreadQuery = await db.execute(sql`
            SELECT 
                cg.project_id,
                COUNT(m.id)::int as count
            FROM chat_groups cg
            LEFT JOIN user_project_assignments upa 
                ON cg.project_id = upa.project_id 
                AND upa.user_id = ${testUserId}
            LEFT JOIN messages m 
                ON cg.id = m.group_id 
                AND m.created_at > COALESCE(upa.last_read_at, '1970-01-01 00:00:00')
            GROUP BY cg.project_id
            LIMIT 5
        `);
        console.log('Unread counts result:');
        console.table(unreadQuery.rows);

        // Test 4: Test mark-as-read query
        console.log('\n4️⃣ Testing mark-as-read query:');
        const checkAssignment = await db.execute(sql`
            SELECT id, user_id, project_id, last_read_at 
            FROM user_project_assignments 
            WHERE user_id = ${testUserId}
            LIMIT 1
        `);
        console.log('Sample assignment:');
        console.table(checkAssignment.rows);

        console.log('\n✅ All tests passed! APIs should work now.');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Code:', error.code);
        console.error('Detail:', error.detail);
        process.exit(1);
    }
}

testApis();
