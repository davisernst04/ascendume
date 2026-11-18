CREATE TABLE "skill_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"resume_id" text NOT NULL,
	"label" varchar(255) DEFAULT '' NOT NULL,
	"items" text DEFAULT '' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_experience" ADD COLUMN IF NOT EXISTS "location" varchar(255);--> statement-breakpoint
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_categories_resume_id_idx" ON "skill_categories" USING btree ("resume_id");--> statement-breakpoint
-- Backfill: turn the fixed technical/frameworks/tools columns into named categories.
INSERT INTO "skill_categories" ("id", "resume_id", "label", "items", "order")
SELECT gen_random_uuid()::text, "resume_id", 'Languages', "technical", 0 FROM "skills" WHERE coalesce(trim("technical"), '') <> ''
UNION ALL
SELECT gen_random_uuid()::text, "resume_id", 'Frameworks', "frameworks", 1 FROM "skills" WHERE coalesce(trim("frameworks"), '') <> ''
UNION ALL
SELECT gen_random_uuid()::text, "resume_id", 'Developer Tools', "tools", 2 FROM "skills" WHERE coalesce(trim("tools"), '') <> '';
