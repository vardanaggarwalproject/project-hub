ALTER TABLE "eod_reports" ALTER COLUMN "report_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "eod_reports" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "eod_reports" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "eod_reports" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "eod_reports" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "report_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memos" ALTER COLUMN "updated_at" SET DEFAULT now();