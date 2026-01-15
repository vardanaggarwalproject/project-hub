ALTER TABLE "user_project_assignments" ALTER COLUMN "is_active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "memos" ADD COLUMN "memo_type" text DEFAULT 'short' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_memo_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memos" ADD CONSTRAINT "memos_user_id_project_id_report_date_memo_type_unique" UNIQUE("user_id","project_id","report_date","memo_type");