ALTER TABLE "user_roles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_roles" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_role_roles_name_fk" FOREIGN KEY ("role") REFERENCES "public"."roles"("name") ON DELETE no action ON UPDATE no action;