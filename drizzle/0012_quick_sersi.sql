CREATE TABLE "extra_notification_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "extra_notification_emails_email_unique" UNIQUE("email")
);
