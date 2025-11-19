ALTER TABLE "npcs" ADD COLUMN "alias" varchar(255);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "importance" varchar(100);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "role" varchar(255);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "timeline_tag" varchar(100);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "armor_soak" varchar(100);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "defense_notes" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "ideals" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "bonds" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "flaws" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "goals" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "hooks" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "faction" varchar(255);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "relationships" text;--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "attitude_toward_party" varchar(100);--> statement-breakpoint
ALTER TABLE "npcs" ADD COLUMN "resources" text;