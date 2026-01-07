
import { db } from "@/lib/db";
import { eodReports, user } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const eodSchema = z.object({
    clientUpdate: z.string().optional(),
    actualUpdate: z.string().min(1, "Internal update required"),
    projectId: z.string().uuid().or(z.string()),
    userId: z.string().uuid().or(z.string()),
    reportDate: z.string().or(z.date()),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");
        const userId = searchParams.get("userId");

        let whereClause = undefined;
        const conditions = [];

        if (projectId) conditions.push(eq(eodReports.projectId, projectId));
        if (userId) conditions.push(eq(eodReports.userId, userId));

        if (conditions.length > 0) {
            whereClause = and(...conditions);
        }

        const reports = await db.select({
            id: eodReports.id,
            clientUpdate: eodReports.clientUpdate,
            actualUpdate: eodReports.actualUpdate,
            reportDate: eodReports.reportDate,
            createdAt: eodReports.createdAt,
            user: {
                id: user.id,
                name: user.name,
                image: user.image
            }
        })
            .from(eodReports)
            .leftJoin(user, eq(eodReports.userId, user.id))
            .where(whereClause)
            .orderBy(desc(eodReports.reportDate));

        return NextResponse.json(reports);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch EODs" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = eodSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
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
            projectId,
            reportDate: new Date(reportDate).toISOString(),
            clientUpdate,
            actualUpdate,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).returning();

        return NextResponse.json(newReport[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create EOD" }, { status: 500 });
    }
}
