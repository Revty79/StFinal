-- 0007: Galaxy Forge schema
-- Adds timeline-first world model used by Source Forge's Galaxy Forge app

BEGIN;

CREATE TABLE IF NOT EXISTS "galaxy_worlds" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

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

COMMIT;
