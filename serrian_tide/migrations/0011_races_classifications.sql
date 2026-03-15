-- 0011: Multi-classification support for races/creatures
-- Adds an array-based classifications column and backfills from legacy master_label.

BEGIN;

ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "classifications" jsonb;

UPDATE "races"
SET "classifications" = CASE
  WHEN "master_label" IS NOT NULL AND btrim("master_label") <> '' THEN jsonb_build_array(btrim("master_label"))
  ELSE '[]'::jsonb
END
WHERE "classifications" IS NULL;

UPDATE "races"
SET "classifications" = '[]'::jsonb
WHERE jsonb_typeof("classifications") IS DISTINCT FROM 'array';

ALTER TABLE "races" ALTER COLUMN "classifications" SET DEFAULT '[]'::jsonb;
ALTER TABLE "races" ALTER COLUMN "classifications" SET NOT NULL;

COMMIT;
