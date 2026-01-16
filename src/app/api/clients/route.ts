import { db } from "@/lib/db";
import { clients, projects } from "@/lib/db/schema";
import { sql, desc, ilike, and, eq, count, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const clientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    description: z.string().optional(),
});

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");

        const offset = (page - 1) * limit;

        // Build where clause with multiple conditions
        const conditions = [];

        if (search) {
            conditions.push(ilike(clients.name, `%${search}%`));
        }

        if (fromDate) {
            conditions.push(gte(clients.createdAt, new Date(fromDate)));
        }

        if (toDate) {
            // Add one day to include the end date
            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            conditions.push(lte(clients.createdAt, endDate));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // First get the clients
        const clientsData = await db.select()
            .from(clients)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(clients.updatedAt));

        // Then get active project counts for each client
        const clientList = await Promise.all(
            clientsData.map(async (client) => {
                const projectCount = await db
                    .select({ count: count() })
                    .from(projects)
                    .where(and(
                        eq(projects.clientId, client.id),
                        eq(projects.status, 'active')
                    ));

                return {
                    ...client,
                    activeProjectCount: projectCount[0]?.count || 0
                };
            })
        );

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(clients)
            .where(whereClause);

        const total = totalResult[0].count;

        // Get total active projects count across ALL clients (not just paginated)
        const totalActiveProjectsResult = await db
            .select({ count: count() })
            .from(projects)
            .where(eq(projects.status, 'active'));

        const totalActiveProjects = totalActiveProjectsResult[0]?.count || 0;

        return NextResponse.json({
            data: clientList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                totalActiveProjects
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = clientSchema.safeParse(body);
        
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { name, email, address, description } = validation.data;

        const newClient = await db.insert(clients).values({
            id: crypto.randomUUID(),
            name,
            email: email || undefined,
            address: address || undefined,
            description,
        }).returning();

        return NextResponse.json(newClient[0], { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
