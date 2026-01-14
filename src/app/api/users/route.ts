import { db } from "@/lib/db";
import { user, session } from "@/lib/db/schema";
import { sql, desc, ilike, or, eq, count, gt, countDistinct } from "drizzle-orm";
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

        // Get total count for pagination
        const totalResult = await db.select({ count: count() })
            .from(user)
            .where(whereClause);

        const totalPagination = Number(totalResult[0]?.count || 0);

        // Get overall stats (not just for search)
        const totalUsersResult = await db.select({ count: count() }).from(user);
        const adminUsersResult = await db.select({ count: count() }).from(user).where(eq(user.role, "admin"));

        // Active users = unique users with non-expired sessions
        const activeUsersResult = await db.select({
            count: countDistinct(session.userId)
        })
            .from(session)
            .where(gt(session.expiresAt, new Date()));

        return NextResponse.json({
            data: userList,
            stats: {
                total: Number(totalUsersResult[0]?.count || 0),
                active: Number(activeUsersResult[0]?.count || 0),
                admins: Number(adminUsersResult[0]?.count || 0)
            },
            meta: {
                total: totalPagination,
                page,
                limit,
                totalPages: Math.ceil(totalPagination / limit)
            }
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
