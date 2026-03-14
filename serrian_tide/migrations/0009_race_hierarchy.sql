-- 0009: Race hierarchy support (parent-child lineage tree)
-- Adds a self-referential parent pointer so races can be cataloged in branches.

BEGIN;

ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "parent_race_id" varchar(36);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'races_parent_race_id_fkey'
  ) THEN
    ALTER TABLE "races"
      ADD CONSTRAINT "races_parent_race_id_fkey"
      FOREIGN KEY ("parent_race_id") REFERENCES "races"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_races_parent_race_id" ON "races"("parent_race_id");

COMMIT;
