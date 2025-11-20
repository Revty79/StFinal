CREATE TABLE "cosmos" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"created_by" varchar(36) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_pitch" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"tone_tags" text,
	"genre_family" text,
	"description" text,
	"origin_story" text,
	"cosmic_operation_notes" text,
	"designer_notes" text,
	"existence_origin" text,
	"energy_consciousness_framework" text,
	"cosmic_constants" text,
	"reality_interaction_framework" text,
	"plane_travel_possible" boolean DEFAULT true,
	"cosmic_calendar_name" varchar(255),
	"cycles_epochs_ages" text,
	"time_flow_rules" text,
	"major_cosmic_events" text,
	"is_free" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cosmos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "cosmos" ADD CONSTRAINT "cosmos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cosmos_created_by" ON "cosmos" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_cosmos_slug" ON "cosmos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_cosmos_status" ON "cosmos" USING btree ("status");