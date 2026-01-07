import { relations } from "drizzle-orm/relations";
import { user, account, clients, assets, projects, chatGroups, eodReports, memos, messages, session, tasks, userProjectAssignments, userTaskAssignments, links, roles, eodFiles } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	accounts: many(account),
	assets: many(assets),
	eodReports: many(eodReports),
	memos: many(memos),
	messages: many(messages),
	sessions: many(session),
	userProjectAssignments: many(userProjectAssignments),
	userTaskAssignments: many(userTaskAssignments),
	links: many(links),
	role: one(roles, {
		fields: [user.role],
		references: [roles.name]
	}),
}));

export const assetsRelations = relations(assets, ({one}) => ({
	client: one(clients, {
		fields: [assets.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [assets.projectId],
		references: [projects.id]
	}),
	user: one(user, {
		fields: [assets.uploadedBy],
		references: [user.id]
	}),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	assets: many(assets),
	projects: many(projects),
	links: many(links),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	assets: many(assets),
	chatGroups: many(chatGroups),
	eodReports: many(eodReports),
	memos: many(memos),
	tasks: many(tasks),
	userProjectAssignments: many(userProjectAssignments),
	client: one(clients, {
		fields: [projects.clientId],
		references: [clients.id]
	}),
	links: many(links),
}));

export const chatGroupsRelations = relations(chatGroups, ({one, many}) => ({
	project: one(projects, {
		fields: [chatGroups.projectId],
		references: [projects.id]
	}),
	messages: many(messages),
}));

export const eodReportsRelations = relations(eodReports, ({one, many}) => ({
	project: one(projects, {
		fields: [eodReports.projectId],
		references: [projects.id]
	}),
	user: one(user, {
		fields: [eodReports.userId],
		references: [user.id]
	}),
	eodFiles: many(eodFiles),
}));

export const memosRelations = relations(memos, ({one}) => ({
	project: one(projects, {
		fields: [memos.projectId],
		references: [projects.id]
	}),
	user: one(user, {
		fields: [memos.userId],
		references: [user.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	chatGroup: one(chatGroups, {
		fields: [messages.groupId],
		references: [chatGroups.id]
	}),
	user: one(user, {
		fields: [messages.senderId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	userTaskAssignments: many(userTaskAssignments),
}));

export const userProjectAssignmentsRelations = relations(userProjectAssignments, ({one}) => ({
	project: one(projects, {
		fields: [userProjectAssignments.projectId],
		references: [projects.id]
	}),
	user: one(user, {
		fields: [userProjectAssignments.userId],
		references: [user.id]
	}),
}));

export const userTaskAssignmentsRelations = relations(userTaskAssignments, ({one}) => ({
	task: one(tasks, {
		fields: [userTaskAssignments.taskId],
		references: [tasks.id]
	}),
	user: one(user, {
		fields: [userTaskAssignments.userId],
		references: [user.id]
	}),
}));

export const linksRelations = relations(links, ({one}) => ({
	user: one(user, {
		fields: [links.addedBy],
		references: [user.id]
	}),
	client: one(clients, {
		fields: [links.clientId],
		references: [clients.id]
	}),
	project: one(projects, {
		fields: [links.projectId],
		references: [projects.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(user),
}));

export const eodFilesRelations = relations(eodFiles, ({one}) => ({
	eodReport: one(eodReports, {
		fields: [eodFiles.eodId],
		references: [eodReports.id]
	}),
}));