import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { sql, desc, ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(user.name, `%${search}%`),
                ilike(user.email, `%${search}%`)
            );
        }

        const userList = await db.select()
            .from(user)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(user.createdAt));

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);
        
        const total = totalResult[0].count;

        return NextResponse.json({
            data: userList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
