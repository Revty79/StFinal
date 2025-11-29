-- Migration: Update creatures table to use attacks JSONB array
-- Drop old attack_modes and damage columns, add new attacks column

-- Add the new attacks column as JSONB
ALTER TABLE creatures ADD COLUMN IF NOT EXISTS attacks JSONB;

-- Migrate existing data from attack_modes and damage to attacks array
-- This creates a single attack entry combining both fields if they exist
UPDATE creatures
SET attacks = 
  CASE 
    WHEN attack_modes IS NOT NULL OR damage IS NOT NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'description', COALESCE(attack_modes, 'Legacy attack'),
          'damage', 
          CASE 
            WHEN damage ~ '^\d+$' THEN CAST(damage AS INTEGER)
            ELSE 0
          END
        )
      )
    ELSE NULL
  END
WHERE attacks IS NULL;

-- Drop the old columns
ALTER TABLE creatures DROP COLUMN IF EXISTS attack_modes;
ALTER TABLE creatures DROP COLUMN IF EXISTS damage;
