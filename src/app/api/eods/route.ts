
import { db } from "@/lib/db";
import { eodReports } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const eodSchema = z.object({
    clientUpdate: z.string().optional(),
    actualUpdate: z.string().min(1, "Internal update required"),
    projectId: z.string().uuid().or(z.string()),
    userId: z.string().uuid().or(z.string()),
    reportDate: z.string().or(z.date()),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = eodSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.errors }, { status: 400 });
        }

        const { clientUpdate, actualUpdate, projectId, userId, reportDate } = validation.data;
         const dateObj = new Date(reportDate);
        dateObj.setHours(0, 0, 0, 0);

        // Check duplicate
         const existing = await db.select().from(eodReports)
            .where(and(
                eq(eodReports.userId, userId),
                eq(eodReports.projectId, projectId),
                sql`DATE(${eodReports.reportDate}) = DATE(${dateObj.toISOString()})`
            ));

        if (existing.length > 0) {
            return NextResponse.json({ error: "EOD already exists for this date" }, { status: 409 });
        }

        const newReport = await db.insert(eodReports).values({
            id: crypto.randomUUID(),
            clientUpdate,
            actualUpdate,
            userId,
            projectId,
            reportDate: dateObj,
        }).returning();

        return NextResponse.json(newReport[0], { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create EOD" }, { status: 500 });
    }
}
