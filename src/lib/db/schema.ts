
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(), // e.g., "admin", "developer"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(), 
	image: text("image"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
    role: text("role").references(() => roles.name),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});



export const clients = pgTable("clients", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    clientId: text("client_id").notNull().references(() => clients.id),
    totalTime: text("total_time"), // Using text to handle loose number/null formats or change to integer if strict
    completedTime: text("completed_time"),
    status: text("status"), // "active", "completed", "on-hold"
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userProjectAssignments = pgTable("user_project_assignments", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    projectId: text("project_id").notNull().references(() => projects.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status"), // "todo", "in_progress", "done"
    deadline: timestamp("deadline"),
    estimatedTime: text("estimated_time"),
    completedTime: text("completed_time"),
    projectId: text("project_id").notNull().references(() => projects.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTaskAssignments = pgTable("user_task_assignments", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    taskId: text("task_id").notNull().references(() => tasks.id),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eodReports = pgTable("eod_reports", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id),
    projectId: text("project_id").notNull().references(() => projects.id),
    reportDate: timestamp("report_date").notNull(),
    clientUpdate: text("client_update"),
    actualUpdate: text("actual_update"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const memos = pgTable("memos", {
    id: text("id").primaryKey(),
    memoContent: text("memo_content"), // max 140 chars
    userId: text("user_id").notNull().references(() => user.id),
    projectId: text("project_id").notNull().references(() => projects.id),
    reportDate: timestamp("report_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const links = pgTable("links", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    projectId: text("project_id").notNull().references(() => projects.id),
    clientId: text("client_id").references(() => clients.id),
    addedBy: text("added_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const assets = pgTable("assets", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    fileSize: text("file_size"), // number in bytes stored as text or bigInt to avoid overflow? Using text for simplicity or integer
    projectId: text("project_id").notNull().references(() => projects.id),
    clientId: text("client_id").references(() => clients.id),
    uploadedBy: text("uploaded_by").notNull().references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatGroups = pgTable("chat_groups", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    projectId: text("project_id").unique().notNull().references(() => projects.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
    id: text("id").primaryKey(),
    senderId: text("sender_id").notNull().references(() => user.id),
    groupId: text("group_id").notNull().references(() => chatGroups.id),
    content: text("content"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
