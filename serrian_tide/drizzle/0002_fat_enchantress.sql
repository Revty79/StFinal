CREATE TABLE "creatures" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"alt_names" text,
	"challenge_rating" varchar(50),
	"encounter_scale" varchar(50),
	"type" varchar(100),
	"role" varchar(100),
	"size" varchar(50),
	"genre_tags" text,
	"description_short" text,
	"strength" integer,
	"dexterity" integer,
	"constitution" integer,
	"intelligence" integer,
	"wisdom" integer,
	"charisma" integer,
	"hp_total" integer,
	"initiative" integer,
	"hp_by_location" text,
	"armor_soak" text,
	"attack_modes" text,
	"damage" text,
	"range_text" text,
	"special_abilities" text,
	"magic_resonance_interaction" text,
	"behavior_tactics" text,
	"habitat" text,
	"diet" text,
	"variants" text,
	"loot_harvest" text,
	"story_hooks" text,
	"notes" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_armor" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"timeline_tag" varchar(100),
	"cost_credits" integer,
	"area_covered" varchar(100),
	"soak" integer,
	"category" varchar(100),
	"atype" varchar(100),
	"genre_tags" text,
	"weight" integer,
	"encumbrance_penalty" integer,
	"effect" text,
	"narrative_notes" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"timeline_tag" varchar(100),
	"cost_credits" integer,
	"category" varchar(100),
	"subtype" varchar(100),
	"genre_tags" text,
	"mechanical_effect" text,
	"weight" integer,
	"narrative_notes" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_weapons" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"timeline_tag" varchar(100),
	"cost_credits" integer,
	"category" varchar(100),
	"handedness" varchar(50),
	"dtype" varchar(100),
	"range_type" varchar(50),
	"range_text" varchar(100),
	"genre_tags" text,
	"weight" integer,
	"damage" integer,
	"effect" text,
	"narrative_notes" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"tagline" text,
	"definition" jsonb,
	"attributes" jsonb,
	"bonus_skills" jsonb,
	"special_abilities" jsonb,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"tier" integer,
	"primary_attribute" varchar(10) NOT NULL,
	"secondary_attribute" varchar(10) NOT NULL,
	"definition" text,
	"parent_id" varchar(36),
	"parent2_id" varchar(36),
	"parent3_id" varchar(36),
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_armor" ADD CONSTRAINT "inventory_armor_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_weapons" ADD CONSTRAINT "inventory_weapons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent_id_skills_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent2_id_skills_id_fk" FOREIGN KEY ("parent2_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent3_id_skills_id_fk" FOREIGN KEY ("parent3_id") REFERENCES "public"."skills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_creatures_created_by" ON "creatures" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_inventory_armor_created_by" ON "inventory_armor" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_created_by" ON "inventory_items" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_inventory_weapons_created_by" ON "inventory_weapons" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_races_created_by" ON "races" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_skills_created_by" ON "skills" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_skills_type" ON "skills" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_skills_tier" ON "skills" USING btree ("tier");