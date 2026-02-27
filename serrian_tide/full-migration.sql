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

COMMIT;
