import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  unique,
  foreignKey,
  index,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role_enum", [
  "admin",
  "developer",
  "tester",
  "designer",
]);

export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey().notNull(),
    name: roleEnum("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("roles_name_unique").on(table.name)]
);

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    role: roleEnum("role"),
  },
  (table) => [
    unique("user_email_unique").on(table.email),
    foreignKey({
      columns: [table.role],
      foreignColumns: [roles.name],
      name: "user_role_roles_name_fk",
    }),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    unique("session_token_unique").on(table.token),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const clients = pgTable("clients", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    clientId: text("client_id").notNull(),
    totalTime: text("total_time"),
    completedTime: text("completed_time"),
    status: text("status"),
    description: text("description"),
    isMemoRequired: boolean("is_memo_required").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "projects_client_id_clients_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userProjectAssignments = pgTable(
  "user_project_assignments",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastActivatedAt: timestamp("last_activated_at").defaultNow().notNull(),
    isActive: boolean("is_active").default(false).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "user_project_assignments_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_project_assignments_user_id_user_id_fk",
    }),
    unique("user_project_assignments_user_id_project_id_unique").on(
      table.userId,
      table.projectId
    ),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status"),
    deadline: timestamp("deadline"),
    estimatedTime: text("estimated_time"),
    completedTime: text("completed_time"),
    projectId: text("project_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "tasks_project_id_projects_id_fk",
    }).onDelete("cascade"),
  ]
);

export const userTaskAssignments = pgTable(
  "user_task_assignments",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    taskId: text("task_id").notNull(),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "user_task_assignments_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_task_assignments_user_id_user_id_fk",
    }),
  ]
);

export const eodReports = pgTable(
  "eod_reports",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    reportDate: timestamp("report_date", { withTimezone: true }).notNull(),
    clientUpdate: text("client_update"),
    actualUpdate: text("actual_update"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("eod_reports_user_id_project_id_idx").on(table.userId, table.projectId),
    index("eod_reports_report_date_idx").on(table.reportDate),
    index("eod_reports_created_at_idx").on(table.createdAt),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "eod_reports_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "eod_reports_user_id_user_id_fk",
    }),
  ]
);

export const eodFiles = pgTable(
  "eod_files",
  {
    id: text("id").primaryKey().notNull(),
    eodId: text("eod_id").notNull(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: text("file_size"),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.eodId],
      foreignColumns: [eodReports.id],
      name: "eod_files_eod_id_eod_reports_id_fk",
    }).onDelete("cascade"),
  ]
);

export const memos = pgTable(
  "memos",
  {
    id: text("id").primaryKey().notNull(),
    memoContent: text("memo_content"),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    reportDate: timestamp("report_date", { withTimezone: true }).notNull(),
    memoType: text("memo_type").default('short').notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("memos_user_id_project_id_idx").on(table.userId, table.projectId),
    index("memos_report_date_idx").on(table.reportDate),
    index("memos_created_at_idx").on(table.createdAt),
    unique("memos_user_id_project_id_report_date_memo_type_unique").on(
      table.userId,
      table.projectId,
      table.reportDate,
      table.memoType
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "memos_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "memos_user_id_user_id_fk",
    }),
  ]
);

export const links = pgTable(
  "links",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    projectId: text("project_id").notNull(),
    clientId: text("client_id"),
    addedBy: text("added_by"),
    allowedRoles: jsonb("allowed_roles").$type<string[]>(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.addedBy],
      foreignColumns: [user.id],
      name: "links_added_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "links_client_id_clients_id_fk",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "links_project_id_projects_id_fk",
    }).onDelete("cascade"),
  ]
);

export const assets = pgTable(
  "assets",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    fileSize: text("file_size"),
    projectId: text("project_id").notNull(),
    clientId: text("client_id"),
    uploadedBy: text("uploaded_by").notNull(),
    allowedRoles: jsonb("allowed_roles").$type<string[]>(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "assets_client_id_clients_id_fk",
    }),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "assets_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "assets_uploaded_by_user_id_fk",
    }),
  ]
);

export const chatGroups = pgTable(
  "chat_groups",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name").notNull(),
    projectId: text("project_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("chat_groups_project_id_unique").on(table.projectId),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "chat_groups_project_id_projects_id_fk",
    }).onDelete("cascade"),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey().notNull(),
    senderId: text("sender_id").notNull(),
    groupId: text("group_id").notNull(),
    content: text("content"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [chatGroups.id],
      name: "messages_group_id_chat_groups_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.senderId],
      foreignColumns: [user.id],
      name: "messages_sender_id_user_id_fk",
    }),
  ]
);

// Push notification subscriptions (one per device/browser)
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "push_subscriptions_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("push_subscriptions_endpoint_unique").on(table.endpoint),
  ]
);

// User notification preferences
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    slackEnabled: boolean("slack_enabled").default(true).notNull(),
    eodNotifications: boolean("eod_notifications").default(true).notNull(),
    memoNotifications: boolean("memo_notifications").default(true).notNull(),
    projectNotifications: boolean("project_notifications").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "notification_preferences_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("notification_preferences_user_id_unique").on(table.userId),
  ]
);

// Explicit recipients for email notifications (Admins or external)
export const notificationRecipients = pgTable(
  "notification_recipients",
  {
    id: text("id").primaryKey().notNull(),
    email: text("email").notNull(),
    label: text("label"), // e.g. "Admin: John", "External: Client"
    eodEnabled: boolean("eod_enabled").default(true).notNull(),
    memoEnabled: boolean("memo_enabled").default(true).notNull(),
    projectEnabled: boolean("project_enabled").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("notification_recipients_email_unique").on(table.email),
  ]
);

// Persistent storage for in-app notifications
export const appNotifications = pgTable(
  "app_notifications",
  {
    id: text("id").primaryKey().notNull(),
    userId: text("user_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url"),
    isRead: boolean("is_read").default(false).notNull(),
    data: jsonb("data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "app_notifications_user_id_user_id_fk",
    }).onDelete("cascade"),
    index("app_notifications_user_id_idx").on(table.userId),
    index("app_notifications_created_at_idx").on(table.createdAt),
  ]
);
