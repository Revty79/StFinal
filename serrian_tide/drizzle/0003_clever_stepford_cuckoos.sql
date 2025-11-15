CREATE TABLE "magic_type_details" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"skill_id" varchar(36) NOT NULL,
	"skill_name" varchar(255),
	"tradition" varchar(100),
	"tier2_path" varchar(100),
	"containers_json" jsonb,
	"modifiers_json" jsonb,
	"mana_cost" integer,
	"casting_time" integer,
	"mastery_level" integer,
	"notes" text,
	"flavor_line" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "special_ability_details" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"skill_id" varchar(36) NOT NULL,
	"ability_type" varchar(100),
	"scaling_method" varchar(100),
	"prerequisites" text,
	"scaling_details" text,
	"stage1_tag" varchar(255),
	"stage1_desc" text,
	"stage1_points" varchar(50),
	"stage2_tag" varchar(255),
	"stage2_desc" text,
	"stage2_points" varchar(50),
	"stage3_tag" varchar(255),
	"stage3_desc" text,
	"stage4_tag" varchar(255),
	"stage4_desc" text,
	"final_tag" varchar(255),
	"final_desc" text,
	"add1_tag" varchar(255),
	"add1_desc" text,
	"add2_tag" varchar(255),
	"add2_desc" text,
	"add3_tag" varchar(255),
	"add3_desc" text,
	"add4_tag" varchar(255),
	"add4_desc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "magic_type_details" ADD CONSTRAINT "magic_type_details_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_ability_details" ADD CONSTRAINT "special_ability_details_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_magic_type_details_skill_id" ON "magic_type_details" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_special_ability_details_skill_id" ON "special_ability_details" USING btree ("skill_id");