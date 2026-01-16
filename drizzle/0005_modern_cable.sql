ALTER TABLE "user_project_assignments" ADD COLUMN "last_activated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "eod_reports_user_id_project_id_idx" ON "eod_reports" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "eod_reports_report_date_idx" ON "eod_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "eod_reports_created_at_idx" ON "eod_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "memos_user_id_project_id_idx" ON "memos" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "memos_report_date_idx" ON "memos" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "memos_created_at_idx" ON "memos" USING btree ("created_at");