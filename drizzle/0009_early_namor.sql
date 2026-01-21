CREATE TYPE "public"."folder_type_enum" AS ENUM('client', 'internal');--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "drive_file_id" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "folder_type" "folder_type_enum";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "drive_folder_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "drive_client_folder_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "drive_internal_folder_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "drive_folder_created_at" timestamp;