import { pgTable, text, timestamp, foreignKey, unique, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const roleEnum = pgEnum("role_enum", ['admin', 'developer', 'tester', 'designer'])


export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "account_user_id_user_id_fk"
	}),
]);

export const assets = pgTable("assets", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: text("file_type"),
	fileSize: text("file_size"),
	projectId: text("project_id").notNull(),
	clientId: text("client_id"),
	uploadedBy: text("uploaded_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.clientId],
		foreignColumns: [clients.id],
		name: "assets_client_id_clients_id_fk"
	}),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "assets_project_id_projects_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.uploadedBy],
		foreignColumns: [user.id],
		name: "assets_uploaded_by_user_id_fk"
	}),
]);

export const clients = pgTable("clients", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const chatGroups = pgTable("chat_groups", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	projectId: text("project_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "chat_groups_project_id_projects_id_fk"
	}).onDelete("cascade"),
	unique("chat_groups_project_id_unique").on(table.projectId),
]);

export const eodReports = pgTable("eod_reports", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	projectId: text("project_id").notNull(),
	reportDate: timestamp("report_date", { mode: 'string' }).notNull(),
	clientUpdate: text("client_update"),
	actualUpdate: text("actual_update"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "eod_reports_project_id_projects_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "eod_reports_user_id_user_id_fk"
	}),
]);

export const memos = pgTable("memos", {
	id: text().primaryKey().notNull(),
	memoContent: text("memo_content"),
	userId: text("user_id").notNull(),
	projectId: text("project_id").notNull(),
	reportDate: timestamp("report_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "memos_project_id_projects_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "memos_user_id_user_id_fk"
	}),
]);

export const messages = pgTable("messages", {
	id: text().primaryKey().notNull(),
	senderId: text("sender_id").notNull(),
	groupId: text("group_id").notNull(),
	content: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.groupId],
		foreignColumns: [chatGroups.id],
		name: "messages_group_id_chat_groups_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.senderId],
		foreignColumns: [user.id],
		name: "messages_sender_id_user_id_fk"
	}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "session_user_id_user_id_fk"
	}),
	unique("session_token_unique").on(table.token),
]);

export const tasks = pgTable("tasks", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	status: text(),
	deadline: timestamp({ mode: 'string' }),
	estimatedTime: text("estimated_time"),
	completedTime: text("completed_time"),
	projectId: text("project_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "tasks_project_id_projects_id_fk"
	}).onDelete("cascade"),
]);

export const userProjectAssignments = pgTable("user_project_assignments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	projectId: text("project_id").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	lastReadAt: timestamp("last_read_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "user_project_assignments_project_id_projects_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "user_project_assignments_user_id_user_id_fk"
	}),
]);

export const userTaskAssignments = pgTable("user_task_assignments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	taskId: text("task_id").notNull(),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.taskId],
		foreignColumns: [tasks.id],
		name: "user_task_assignments_task_id_tasks_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "user_task_assignments_user_id_user_id_fk"
	}),
]);

export const projects = pgTable("projects", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	clientId: text("client_id").notNull(),
	totalTime: text("total_time"),
	completedTime: text("completed_time"),
	status: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	description: text(),
}, (table) => [
	foreignKey({
		columns: [table.clientId],
		foreignColumns: [clients.id],
		name: "projects_client_id_clients_id_fk"
	}).onDelete("cascade"),
]);

export const links = pgTable("links", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	url: text().notNull(),
	description: text(),
	projectId: text("project_id").notNull(),
	clientId: text("client_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	addedBy: text("added_by"),
}, (table) => [
	foreignKey({
		columns: [table.addedBy],
		foreignColumns: [user.id],
		name: "links_added_by_user_id_fk"
	}),
	foreignKey({
		columns: [table.clientId],
		foreignColumns: [clients.id],
		name: "links_client_id_clients_id_fk"
	}),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "links_project_id_projects_id_fk"
	}).onDelete("cascade"),
]);

export const roles = pgTable("roles", {
	id: text().primaryKey().notNull(),
	name: roleEnum().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	role: roleEnum(),
}, (table) => [
	foreignKey({
		columns: [table.role],
		foreignColumns: [roles.name],
		name: "user_role_roles_name_fk"
	}),
	unique("user_email_unique").on(table.email),
]);

export const eodFiles = pgTable("eod_files", {
	id: text().primaryKey().notNull(),
	eodId: text("eod_id").notNull(),
	fileName: text("file_name").notNull(),
	fileUrl: text("file_url").notNull(),
	fileType: text("file_type").notNull(),
	fileSize: text("file_size"),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.eodId],
		foreignColumns: [eodReports.id],
		name: "eod_files_eod_id_eod_reports_id_fk"
	}).onDelete("cascade"),
]);
