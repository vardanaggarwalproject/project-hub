
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const allUsers = await db.select().from(user);
        return NextResponse.json(allUsers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
