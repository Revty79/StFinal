CREATE TABLE "npcs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"race" varchar(100),
	"occupation" varchar(255),
	"age" varchar(50),
	"gender" varchar(50),
	"strength" integer DEFAULT 25,
	"dexterity" integer DEFAULT 25,
	"constitution" integer DEFAULT 25,
	"intelligence" integer DEFAULT 25,
	"wisdom" integer DEFAULT 25,
	"charisma" integer DEFAULT 25,
	"base_movement" integer DEFAULT 5,
	"hp_total" integer,
	"initiative" integer,
	"challenge_rating" integer DEFAULT 1,
	"skill_allocations" jsonb,
	"skill_checkpoint" jsonb,
	"is_initial_setup_locked" boolean DEFAULT false,
	"xp_spent" integer DEFAULT 0,
	"xp_checkpoint" integer DEFAULT 0,
	"description_short" text,
	"appearance" text,
	"personality" text,
	"backstory" text,
	"motivations" text,
	"secrets" text,
	"allies" text,
	"enemies" text,
	"affiliations" text,
	"notes" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_npcs_created_by" ON "npcs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_npcs_race" ON "npcs" USING btree ("race");--> statement-breakpoint
CREATE INDEX "idx_npcs_challenge_rating" ON "npcs" USING btree ("challenge_rating");