-- 0010: Race creature-unification support
-- Adds world scoping, secondary parent lineage, and optional manual master label.

BEGIN;

ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "world_id" varchar(36);
ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "parent2_race_id" varchar(36);
ALTER TABLE "races" ADD COLUMN IF NOT EXISTS "master_label" varchar(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'races_world_id_fkey'
  ) THEN
    ALTER TABLE "races"
      ADD CONSTRAINT "races_world_id_fkey"
      FOREIGN KEY ("world_id") REFERENCES "galaxy_worlds"("id") ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'races_parent2_race_id_fkey'
  ) THEN
    ALTER TABLE "races"
      ADD CONSTRAINT "races_parent2_race_id_fkey"
      FOREIGN KEY ("parent2_race_id") REFERENCES "races"("id") ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "idx_races_world_id" ON "races"("world_id");
CREATE INDEX IF NOT EXISTS "idx_races_parent2_race_id" ON "races"("parent2_race_id");

COMMIT;
