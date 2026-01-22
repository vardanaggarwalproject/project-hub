import { db } from "@/lib/db";
import { taskComments, user } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Declare global type for Socket.IO
declare global {
  var io: any;
}

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const dynamic = 'force-dynamic';

// GET comments for a task
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Fetch comments with user information (oldest first, like a chat)
    const comments = await db
      .select({
        id: taskComments.id,
        content: taskComments.content,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(taskComments)
      .innerJoin(user, eq(taskComments.userId, user.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST a new comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await req.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Create the comment
    const [newComment] = await db
      .insert(taskComments)
      .values({
        id: crypto.randomUUID(),
        taskId,
        userId: session.user.id,
        content,
      })
      .returning();

    // Fetch the user information for the response
    const [commentUser] = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    const commentData = {
      id: newComment.id,
      content: newComment.content,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
      user: commentUser,
    };

    // Emit real-time event via Socket.IO
    console.log("🔍 Checking global.io:", typeof global.io, !!global.io);

    if (global.io) {
      const taskRoom = `task:${taskId}`;
      console.log(`💬 Emitting new comment to ${taskRoom}`);
      console.log(`📦 Comment data:`, JSON.stringify(commentData, null, 2));

      global.io.to(taskRoom).emit("new-comment", commentData);
      console.log(`✅ Emit completed`);

      // Log how many sockets are in the room
      global.io.in(taskRoom).fetchSockets().then((sockets: any[]) => {
        console.log(`👥 Sockets in ${taskRoom}: ${sockets.length}`);
        sockets.forEach((s: any) => {
          console.log(`  - Socket ${s.id} in rooms:`, Array.from(s.rooms));
        });
      });
    } else {
      console.error("❌❌❌ Socket.IO NOT AVAILABLE - global.io is undefined!");
      console.error("This means the server.js didn't attach io to global");
    }

    return NextResponse.json(commentData, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
