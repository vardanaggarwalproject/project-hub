
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("Attempting to fix DB schema...");
        // Split into separate executions to isolate failure
        await db.execute(sql`ALTER TABLE projects ALTER COLUMN total_time DROP NOT NULL;`);
        await db.execute(sql`ALTER TABLE projects ALTER COLUMN completed_time DROP NOT NULL;`);
        await db.execute(sql`ALTER TABLE projects ALTER COLUMN description DROP NOT NULL;`);
        
        return NextResponse.json({ success: true, message: "DB Schema Fixed" });
    } catch (error: any) {
        console.error("DB Fix Failed:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message, 
            code: error.code,
            detail: error.detail 
        }, { status: 200 });
    }
}
