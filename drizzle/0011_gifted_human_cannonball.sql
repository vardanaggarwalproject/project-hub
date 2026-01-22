CREATE TABLE "app_notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD COLUMN "email_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app_notifications" ADD CONSTRAINT "app_notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_notifications_user_id_idx" ON "app_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "app_notifications_created_at_idx" ON "app_notifications" USING btree ("created_at");