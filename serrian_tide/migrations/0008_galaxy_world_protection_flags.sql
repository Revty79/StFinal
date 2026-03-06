-- 0008: Galaxy world visibility flags
-- Aligns Galaxy world read protections with other toolbox/worldbuilder resources.

BEGIN;

ALTER TABLE "galaxy_worlds" ADD COLUMN IF NOT EXISTS "is_free" boolean DEFAULT true;
ALTER TABLE "galaxy_worlds" ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false;

UPDATE "galaxy_worlds" SET "is_free" = true WHERE "is_free" IS NULL;
UPDATE "galaxy_worlds" SET "is_published" = false WHERE "is_published" IS NULL;

ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_free" SET DEFAULT true;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_free" SET NOT NULL;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_published" SET DEFAULT false;
ALTER TABLE "galaxy_worlds" ALTER COLUMN "is_published" SET NOT NULL;

COMMIT;
