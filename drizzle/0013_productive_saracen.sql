ALTER TABLE "extra_notification_emails" RENAME TO "notification_recipients";--> statement-breakpoint
ALTER TABLE "notification_recipients" DROP CONSTRAINT "extra_notification_emails_email_unique";--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD COLUMN "eod_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD COLUMN "memo_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD COLUMN "project_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_email_unique" UNIQUE("email");