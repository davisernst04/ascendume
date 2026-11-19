CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(40) NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"anonymous_id" varchar(64) NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_name_created_idx" ON "analytics_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_anonymous_id_idx" ON "analytics_events" USING btree ("anonymous_id");