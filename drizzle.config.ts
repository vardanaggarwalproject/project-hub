import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load env FIRST
dotenv.config({ path: ".env" });

const url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();

if (!url) {
  throw new Error("Neither DIRECT_URL nor DATABASE_URL is defined");
}

if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
  throw new Error("Database URL must start with 'postgres://' or 'postgresql://'. Original value started with: " + url.substring(0, 10));
}

// Log masked URL for debugging (will show in user terminal)
const maskedUrl = url.replace(/:[^@/]+@/, ":****@");
console.log(`Using database URL: ${maskedUrl}`);

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url,
    // Always use SSL for Supabase (both pooler and direct connections require it)
    ssl: url.includes('supabase.com')
      ? { rejectUnauthorized: false }
      : false
  },
});