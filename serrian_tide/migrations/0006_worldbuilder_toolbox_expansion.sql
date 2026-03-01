-- 0006: World Builder toolbox expansion
-- Adds reusable library tables for new worldbuilding tools

BEGIN;

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
