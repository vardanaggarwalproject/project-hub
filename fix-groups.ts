
import { db } from './src/lib/db';
import { projects, chatGroups } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function fix() {
    console.log("🔍 Checking for missing chat groups...");
    const allProjects = await db.select().from(projects);
    const allGroups = await db.select().from(chatGroups);

    console.log(`📊 Found ${allProjects.length} projects and ${allGroups.length} chat groups.`);

    for (const project of allProjects) {
        const hasGroup = allGroups.some(g => g.projectId === project.id);
        if (!hasGroup) {
            console.log(`➕ Creating missing chat group for project: ${project.name} (${project.id})`);
            await db.insert(chatGroups).values({
                id: crypto.randomUUID(),
                name: `${project.name} Chat`,
                projectId: project.id,
            });
        }
    }
    console.log("✅ Check complete.");
    process.exit(0);
}

fix().catch(err => {
    console.error("❌ Error fixing DB:", err);
    process.exit(1);
});
