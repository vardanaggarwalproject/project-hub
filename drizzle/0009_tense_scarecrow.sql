CREATE TABLE "task_columns" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"color" text DEFAULT '#6B7280',
	"position" integer NOT NULL,
	"project_id" text,
	"user_id" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "column_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "position" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_columns" ADD CONSTRAINT "task_columns_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_columns_project_id_idx" ON "task_columns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_columns_user_id_idx" ON "task_columns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "task_columns_position_idx" ON "task_columns" USING btree ("position");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_task_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."task_columns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tasks_column_id_idx" ON "tasks" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "tasks_position_idx" ON "tasks" USING btree ("position");--> statement-breakpoint
CREATE INDEX "tasks_priority_idx" ON "tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tasks_type_idx" ON "tasks" USING btree ("type");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");