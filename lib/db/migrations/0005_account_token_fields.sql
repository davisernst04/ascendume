ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;