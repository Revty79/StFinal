-- Serrian Tide - Incremental Migration
-- Playground v1: World Tree + Wiki Pages + Toolbox Attachments
-- Safe for existing online databases

BEGIN;

-- ============================================
-- WORLDBUILDER: PLAYGROUND NODES
-- ============================================

CREATE TABLE IF NOT EXISTS "playground_nodes" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL,
  "type" varchar(50) NOT NULL,
  "parent_id" varchar(36),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "name" varchar(255) NOT NULL,
  "summary" text,
  "tags" jsonb,
  "markdown" text,
  "meta" jsonb,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "created_by" varchar(36);
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "type" varchar(50);
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "parent_id" varchar(36);
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "name" varchar(255);
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "summary" text;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "tags" jsonb;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "markdown" text;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "meta" jsonb;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false;
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();
ALTER TABLE "playground_nodes" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playground_nodes_created_by_fkey'
  ) THEN
    ALTER TABLE "playground_nodes"
      ADD CONSTRAINT "playground_nodes_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playground_nodes_parent_id_fkey'
  ) THEN
    ALTER TABLE "playground_nodes"
      ADD CONSTRAINT "playground_nodes_parent_id_fkey"
      FOREIGN KEY ("parent_id") REFERENCES "playground_nodes"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_playground_nodes_created_by" ON "playground_nodes"("created_by");
CREATE INDEX IF NOT EXISTS "idx_playground_nodes_parent_sort" ON "playground_nodes"("parent_id", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_playground_nodes_type" ON "playground_nodes"("type");
CREATE INDEX IF NOT EXISTS "idx_playground_nodes_name" ON "playground_nodes"("name");

-- ============================================
-- WORLDBUILDER: PLAYGROUND TOOLBOX LINKS
-- ============================================

CREATE TABLE IF NOT EXISTS "playground_toolbox_links" (
  "node_id" varchar(36) NOT NULL,
  "toolbox_type" varchar(50) NOT NULL,
  "toolbox_id" varchar(36) NOT NULL,
  "created_by" varchar(36) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("node_id", "toolbox_type", "toolbox_id")
);

ALTER TABLE "playground_toolbox_links" ADD COLUMN IF NOT EXISTS "node_id" varchar(36);
ALTER TABLE "playground_toolbox_links" ADD COLUMN IF NOT EXISTS "toolbox_type" varchar(50);
ALTER TABLE "playground_toolbox_links" ADD COLUMN IF NOT EXISTS "toolbox_id" varchar(36);
ALTER TABLE "playground_toolbox_links" ADD COLUMN IF NOT EXISTS "created_by" varchar(36);
ALTER TABLE "playground_toolbox_links" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playground_toolbox_links_node_id_fkey'
  ) THEN
    ALTER TABLE "playground_toolbox_links"
      ADD CONSTRAINT "playground_toolbox_links_node_id_fkey"
      FOREIGN KEY ("node_id") REFERENCES "playground_nodes"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'playground_toolbox_links_created_by_fkey'
  ) THEN
    ALTER TABLE "playground_toolbox_links"
      ADD CONSTRAINT "playground_toolbox_links_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_playground_toolbox_links_node" ON "playground_toolbox_links"("node_id");
CREATE INDEX IF NOT EXISTS "idx_playground_toolbox_links_toolbox" ON "playground_toolbox_links"("toolbox_type", "toolbox_id");

-- ============================================
-- WORLDBUILDER: GALAXY FORGE
-- ============================================

CREATE TABLE IF NOT EXISTS "galaxy_worlds" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "galaxy_worlds" ADD COLUMN IF NOT EXISTS "is_free" boolean DEFAULT true;
ALTER TABLE "galaxy_worlds" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false;
UPDATE "galaxy_worlds" SET "is_free" = true WHERE "is_free" IS NULL;
UPDATE "galaxy_worlds" SET "is_published" = false WHERE "is_published" IS NULL;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_free" SET DEFAULT true;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_free" SET NOT NULL;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_published" SET DEFAULT false;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_published" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_galaxy_worlds_created_by" ON "galaxy_worlds"("created_by");
CREATE INDEX IF NOT EXISTS "idx_galaxy_worlds_name" ON "galaxy_worlds"("name");

CREATE TABLE IF NOT EXISTS "galaxy_eras" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "world_id" varchar(36) NOT NULL REFERENCES "galaxy_worlds"("id") ON DELETE CASCADE,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "start_year" integer,
  "end_year" integer,
  "color_hex" varchar(7),
  "order_index" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_galaxy_eras_world_id" ON "galaxy_eras"("world_id");
CREATE INDEX IF NOT EXISTS "idx_galaxy_eras_world_order" ON "galaxy_eras"("world_id", "order_index");
CREATE INDEX IF NOT EXISTS "idx_galaxy_eras_created_by" ON "galaxy_eras"("created_by");

CREATE TABLE IF NOT EXISTS "galaxy_settings" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "world_id" varchar(36) NOT NULL REFERENCES "galaxy_worlds"("id") ON DELETE CASCADE,
  "era_id" varchar(36) REFERENCES "galaxy_eras"("id") ON DELETE SET NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "start_year" integer,
  "end_year" integer,
  "color_hex" varchar(7),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_galaxy_settings_world_id" ON "galaxy_settings"("world_id");
CREATE INDEX IF NOT EXISTS "idx_galaxy_settings_era_id" ON "galaxy_settings"("era_id");
CREATE INDEX IF NOT EXISTS "idx_galaxy_settings_created_by" ON "galaxy_settings"("created_by");

CREATE TABLE IF NOT EXISTS "galaxy_markers" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "world_id" varchar(36) NOT NULL REFERENCES "galaxy_worlds"("id") ON DELETE CASCADE,
  "era_id" varchar(36) REFERENCES "galaxy_eras"("id") ON DELETE SET NULL,
  "setting_id" varchar(36) REFERENCES "galaxy_settings"("id") ON DELETE SET NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "year" integer,
  "category" varchar(100),
  "visibility" varchar(20) DEFAULT 'canon' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_galaxy_markers_world_year" ON "galaxy_markers"("world_id", "year");
CREATE INDEX IF NOT EXISTS "idx_galaxy_markers_era_id" ON "galaxy_markers"("era_id");
CREATE INDEX IF NOT EXISTS "idx_galaxy_markers_setting_id" ON "galaxy_markers"("setting_id");
CREATE INDEX IF NOT EXISTS "idx_galaxy_markers_created_by" ON "galaxy_markers"("created_by");

-- ============================================
-- WORLDBUILDER: TOOLBOX EXPANSION
-- ============================================

CREATE TABLE IF NOT EXISTS "factions" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_factions_created_by" ON "factions"("created_by");
CREATE INDEX IF NOT EXISTS "idx_factions_name" ON "factions"("name");

CREATE TABLE IF NOT EXISTS "geography" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_geography_created_by" ON "geography"("created_by");
CREATE INDEX IF NOT EXISTS "idx_geography_name" ON "geography"("name");

CREATE TABLE IF NOT EXISTS "plot_hooks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_plot_hooks_created_by" ON "plot_hooks"("created_by");
CREATE INDEX IF NOT EXISTS "idx_plot_hooks_name" ON "plot_hooks"("name");

CREATE TABLE IF NOT EXISTS "timeline" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_timeline_created_by" ON "timeline"("created_by");
CREATE INDEX IF NOT EXISTS "idx_timeline_name" ON "timeline"("name");

CREATE TABLE IF NOT EXISTS "settlements" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_settlements_created_by" ON "settlements"("created_by");
CREATE INDEX IF NOT EXISTS "idx_settlements_name" ON "settlements"("name");

CREATE TABLE IF NOT EXISTS "pantheon" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_pantheon_created_by" ON "pantheon"("created_by");
CREATE INDEX IF NOT EXISTS "idx_pantheon_name" ON "pantheon"("name");

CREATE TABLE IF NOT EXISTS "cultures" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_cultures_created_by" ON "cultures"("created_by");
CREATE INDEX IF NOT EXISTS "idx_cultures_name" ON "cultures"("name");

CREATE TABLE IF NOT EXISTS "economy" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_economy_created_by" ON "economy"("created_by");
CREATE INDEX IF NOT EXISTS "idx_economy_name" ON "economy"("name");

CREATE TABLE IF NOT EXISTS "encounters" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_encounters_created_by" ON "encounters"("created_by");
CREATE INDEX IF NOT EXISTS "idx_encounters_name" ON "encounters"("name");

CREATE TABLE IF NOT EXISTS "dungeons" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "data" jsonb,
  "is_free" boolean DEFAULT true NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_dungeons_created_by" ON "dungeons"("created_by");
CREATE INDEX IF NOT EXISTS "idx_dungeons_name" ON "dungeons"("name");

COMMIT;
