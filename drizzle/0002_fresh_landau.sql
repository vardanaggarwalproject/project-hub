CREATE TYPE "public"."role_enum" AS ENUM('admin', 'developer', 'tester', 'designer');--> statement-breakpoint
CREATE TABLE "eod_files" (
	"id" text PRIMARY KEY NOT NULL,
	"eod_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "assets_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_groups" DROP CONSTRAINT "chat_groups_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "eod_reports" DROP CONSTRAINT "eod_reports_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "links" DROP CONSTRAINT "links_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "memos" DROP CONSTRAINT "memos_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_group_id_chat_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_client_id_clients_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "user_project_assignments" DROP CONSTRAINT "user_project_assignments_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "user_task_assignments" DROP CONSTRAINT "user_task_assignments_task_id_tasks_id_fk";
--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "name" SET DATA TYPE "public"."role_enum" USING "name"::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."role_enum" USING "role"::"public"."role_enum";--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "added_by" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "user_project_assignments" ADD COLUMN "last_read_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_project_assignments" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "eod_files" ADD CONSTRAINT "eod_files_eod_id_eod_reports_id_fk" FOREIGN KEY ("eod_id") REFERENCES "public"."eod_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eod_reports" ADD CONSTRAINT "eod_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_added_by_user_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_chat_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."chat_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_project_assignments" ADD CONSTRAINT "user_project_assignments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_task_assignments" ADD CONSTRAINT "user_task_assignments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;