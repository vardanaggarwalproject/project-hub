import { db } from "./index";
import { taskColumns } from "./schema";
import { eq } from "drizzle-orm";

async function seedDefaultColumns() {
  try {
    console.log("🌱 Seeding default columns...");

    // Check if default columns already exist
    const existingColumns = await db
      .select()
      .from(taskColumns)
      .where(eq(taskColumns.isDefault, true));

    if (existingColumns.length > 0) {
      console.log("✅ Default columns already exist");
      return;
    }

    // Insert default columns
    await db.insert(taskColumns).values([
      {
        id: crypto.randomUUID(),
        title: "To Do",
        color: "#3B82F6",
        position: 0,
        isDefault: true,
        projectId: null,
        userId: null,
      },
      {
        id: crypto.randomUUID(),
        title: "In Progress",
        color: "#F59E0B",
        position: 1,
        isDefault: true,
        projectId: null,
        userId: null,
      },
      {
        id: crypto.randomUUID(),
        title: "Complete",
        color: "#10B981",
        position: 2,
        isDefault: true,
        projectId: null,
        userId: null,
      },
    ]);

    console.log("✅ Default columns seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding default columns:", error);
    process.exit(1);
  }
  process.exit(0);
}

seedDefaultColumns();
