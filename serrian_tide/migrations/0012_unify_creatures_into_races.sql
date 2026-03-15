-- 0012: Complete creatures -> races unification
-- Migrates legacy creatures data into races, repoints companions FK, and drops old creatures table.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.creatures') IS NOT NULL THEN
    INSERT INTO "races" (
      "id",
      "created_by",
      "name",
      "master_label",
      "classifications",
      "tagline",
      "definition",
      "attributes",
      "is_free",
      "is_published",
      "created_at",
      "updated_at"
    )
    SELECT
      c."id",
      c."created_by",
      c."name",
      COALESCE(c.type_clean, c.role_clean, 'Creature') AS "master_label",
      (
        CASE
          WHEN c.type_clean IS NOT NULL AND c.role_clean IS NOT NULL AND lower(c.type_clean) <> lower(c.role_clean)
            THEN jsonb_build_array(c.type_clean, c.role_clean)
          WHEN c.type_clean IS NOT NULL
            THEN jsonb_build_array(c.type_clean)
          WHEN c.role_clean IS NOT NULL
            THEN jsonb_build_array(c.role_clean)
          ELSE jsonb_build_array('Creature')
        END
        || CASE WHEN c."can_be_mount" = true THEN jsonb_build_array('Mount') ELSE '[]'::jsonb END
        || CASE WHEN c."can_be_pet" = true THEN jsonb_build_array('Pet') ELSE '[]'::jsonb END
        || CASE WHEN c."can_be_companion" = true THEN jsonb_build_array('Companion') ELSE '[]'::jsonb END
      ) AS "classifications",
      NULLIF(
        btrim(
          concat_ws(' ', c."size", c."challenge_rating")
        ),
        ''
      ) AS "tagline",
      jsonb_strip_nulls(
        jsonb_build_object(
          'legacy_description', c."description_short",
          'physical_description', c."habitat",
          'racial_quirk', c."behavior_tactics",
          'common_archetypes', c.role_clean,
          'examples_by_genre', c."genre_tags"
        )
      ) AS "definition",
      jsonb_strip_nulls(
        jsonb_build_object(
          'size', c."size",
          'strength_max', CASE WHEN c."strength" IS NOT NULL THEN c."strength"::text ELSE NULL END,
          'dexterity_max', CASE WHEN c."dexterity" IS NOT NULL THEN c."dexterity"::text ELSE NULL END,
          'constitution_max', CASE WHEN c."constitution" IS NOT NULL THEN c."constitution"::text ELSE NULL END,
          'intelligence_max', CASE WHEN c."intelligence" IS NOT NULL THEN c."intelligence"::text ELSE NULL END,
          'wisdom_max', CASE WHEN c."wisdom" IS NOT NULL THEN c."wisdom"::text ELSE NULL END,
          'charisma_max', CASE WHEN c."charisma" IS NOT NULL THEN c."charisma"::text ELSE NULL END
        )
      ) AS "attributes",
      COALESCE(c."is_free", false) AS "is_free",
      COALESCE(c."is_published", false) AS "is_published",
      COALESCE(c."created_at", now()) AS "created_at",
      COALESCE(c."updated_at", now()) AS "updated_at"
    FROM (
      SELECT
        base.*,
        NULLIF(btrim(base."type"), '') AS type_clean,
        NULLIF(btrim(base."role"), '') AS role_clean
      FROM "creatures" base
    ) c
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END
$$;

UPDATE "inventory_companions" ic
SET "creature_name" = r."name"
FROM "races" r
WHERE ic."creature_id" = r."id"
  AND (ic."creature_name" IS NULL OR btrim(ic."creature_name") = '');

DO $$
DECLARE
  rec record;
BEGIN
  IF to_regclass('public.creatures') IS NULL THEN
    RETURN;
  END IF;

  FOR rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_class ref ON ref.oid = con.confrelid
    WHERE con.contype = 'f'
      AND nsp.nspname = 'public'
      AND rel.relname = 'inventory_companions'
      AND ref.relname = 'creatures'
  LOOP
    EXECUTE format('ALTER TABLE "inventory_companions" DROP CONSTRAINT %I', rec.conname);
  END LOOP;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_companions_creature_id_fkey'
      AND conrelid = 'inventory_companions'::regclass
  ) THEN
    ALTER TABLE "inventory_companions"
      ADD CONSTRAINT "inventory_companions_creature_id_fkey"
      FOREIGN KEY ("creature_id") REFERENCES "races"("id") ON DELETE SET NULL;
  END IF;
END
$$;

DROP TABLE IF EXISTS "creatures";

COMMIT;
