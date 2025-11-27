-- Serrian Tide - Complete Schema v1.0
-- Generated: 2025-11-21
-- This replaces all previous migrations with a clean, consolidated schema

-- ============================================
-- AUTH & RBAC
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "username" varchar(50) NOT NULL UNIQUE,
  "email" varchar(255) UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "roles" (
  "code" varchar(50) PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" varchar(255)
);

CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_code" varchar(50) NOT NULL REFERENCES "roles"("code") ON DELETE CASCADE,
  "granted_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("user_id", "role_code")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" varchar(40) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions"("user_id");

CREATE TABLE IF NOT EXISTS "user_preferences" (
  "user_id" varchar(36) PRIMARY KEY NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "theme" varchar(50) DEFAULT 'void',
  "background_image" varchar(255) DEFAULT 'nebula.png',
  "gear_image" varchar(255),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================
-- WORLDBUILDER: SKILLS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS "skills" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "type" varchar(50) NOT NULL,
  "tier" integer,
  "primary_attribute" varchar(10) NOT NULL,
  "secondary_attribute" varchar(10) NOT NULL,
  "definition" text,
  "parent_id" varchar(36) REFERENCES "skills"("id") ON DELETE SET NULL,
  "parent2_id" varchar(36) REFERENCES "skills"("id") ON DELETE SET NULL,
  "parent3_id" varchar(36) REFERENCES "skills"("id") ON DELETE SET NULL,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_skills_created_by" ON "skills"("created_by");
CREATE INDEX IF NOT EXISTS "idx_skills_type" ON "skills"("type");
CREATE INDEX IF NOT EXISTS "idx_skills_tier" ON "skills"("tier");

CREATE TABLE IF NOT EXISTS "magic_type_details" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "skill_id" varchar(36) NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "skill_name" varchar(255),
  "tradition" varchar(100),
  "tier2_path" varchar(100),
  "containers_json" jsonb,
  "modifiers_json" jsonb,
  "mana_cost" integer,
  "casting_time" integer,
  "mastery_level" integer,
  "notes" text,
  "flavor_line" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_magic_type_details_skill_id" ON "magic_type_details"("skill_id");

CREATE TABLE IF NOT EXISTS "special_ability_details" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "skill_id" varchar(36) NOT NULL REFERENCES "skills"("id") ON DELETE CASCADE,
  "ability_type" varchar(100),
  "scaling_method" varchar(100),
  "prerequisites" text,
  "scaling_details" text,
  "stage1_tag" varchar(255),
  "stage1_desc" text,
  "stage1_points" varchar(50),
  "stage2_tag" varchar(255),
  "stage2_desc" text,
  "stage2_points" varchar(50),
  "stage3_tag" varchar(255),
  "stage3_desc" text,
  "stage4_tag" varchar(255),
  "stage4_desc" text,
  "final_tag" varchar(255),
  "final_desc" text,
  "add1_tag" varchar(255),
  "add1_desc" text,
  "add2_tag" varchar(255),
  "add2_desc" text,
  "add3_tag" varchar(255),
  "add3_desc" text,
  "add4_tag" varchar(255),
  "add4_desc" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_special_ability_details_skill_id" ON "special_ability_details"("skill_id");

-- ============================================
-- WORLDBUILDER: RACES
-- ============================================

CREATE TABLE IF NOT EXISTS "races" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "tagline" text,
  "definition" jsonb,
  "attributes" jsonb,
  "bonus_skills" jsonb,
  "special_abilities" jsonb,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_races_created_by" ON "races"("created_by");

-- ============================================
-- WORLDBUILDER: CREATURES
-- ============================================

CREATE TABLE IF NOT EXISTS "creatures" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "alt_names" text,
  "challenge_rating" varchar(50),
  "encounter_scale" varchar(50),
  "type" varchar(100),
  "role" varchar(100),
  "size" varchar(50),
  "genre_tags" text,
  "description_short" text,
  "strength" integer,
  "dexterity" integer,
  "constitution" integer,
  "intelligence" integer,
  "wisdom" integer,
  "charisma" integer,
  "hp_total" integer,
  "initiative" integer,
  "hp_by_location" text,
  "armor_soak" text,
  "attack_modes" text,
  "damage" text,
  "range_text" text,
  "special_abilities" text,
  "magic_resonance_interaction" text,
  "behavior_tactics" text,
  "habitat" text,
  "diet" text,
  "variants" text,
  "loot_harvest" text,
  "story_hooks" text,
  "notes" text,
  
  -- Usage flags for mount/pet/companion
  "can_be_mount" boolean DEFAULT false,
  "can_be_pet" boolean DEFAULT false,
  "can_be_companion" boolean DEFAULT false,
  
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_creatures_created_by" ON "creatures"("created_by");

-- ============================================
-- WORLDBUILDER: INVENTORY
-- ============================================

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "timeline_tag" varchar(100),
  "cost_credits" integer,
  "category" varchar(100),
  "subtype" varchar(100),
  "genre_tags" text,
  "mechanical_effect" text,
  "weight" integer,
  "narrative_notes" text,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_inventory_items_created_by" ON "inventory_items"("created_by");

CREATE TABLE IF NOT EXISTS "inventory_weapons" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "timeline_tag" varchar(100),
  "cost_credits" integer,
  "category" varchar(100),
  "handedness" varchar(50),
  "dtype" varchar(100),
  "range_type" varchar(50),
  "range_text" varchar(100),
  "genre_tags" text,
  "weight" integer,
  "damage" integer,
  "effect" text,
  "narrative_notes" text,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_inventory_weapons_created_by" ON "inventory_weapons"("created_by");

CREATE TABLE IF NOT EXISTS "inventory_armor" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "timeline_tag" varchar(100),
  "cost_credits" integer,
  "area_covered" varchar(100),
  "soak" integer,
  "category" varchar(100),
  "atype" varchar(100),
  "genre_tags" text,
  "weight" integer,
  "encumbrance_penalty" integer,
  "effect" text,
  "narrative_notes" text,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_inventory_armor_created_by" ON "inventory_armor"("created_by");

-- ============================================
-- WORLDBUILDER: NPCs (Complete Character System)
-- ============================================

CREATE TABLE IF NOT EXISTS "npcs" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Identity
  "name" varchar(255) NOT NULL,
  "alias" varchar(255),
  "importance" varchar(100),
  "role" varchar(255),
  "race" varchar(100),
  "occupation" varchar(255),
  "location" varchar(255),
  "timeline_tag" varchar(100),
  "tags" text,
  "age" varchar(50),
  "gender" varchar(50),
  
  -- Descriptions
  "description_short" text,
  "appearance" text,
  
  -- Core Stats
  "strength" integer DEFAULT 25,
  "dexterity" integer DEFAULT 25,
  "constitution" integer DEFAULT 25,
  "intelligence" integer DEFAULT 25,
  "wisdom" integer DEFAULT 25,
  "charisma" integer DEFAULT 25,
  
  -- Combat & Defense
  "base_movement" integer DEFAULT 5,
  "hp_total" integer,
  "initiative" integer,
  "armor_soak" varchar(100),
  "defense_notes" text,
  "challenge_rating" integer DEFAULT 1,
  
  -- Skills & XP System (JSONB for flexibility)
  "skill_allocations" jsonb,
  "skill_checkpoint" jsonb,
  "is_initial_setup_locked" boolean DEFAULT false,
  "xp_spent" integer DEFAULT 0,
  "xp_checkpoint" integer DEFAULT 0,
  
  -- Personality & Story
  "personality" text,
  "ideals" text,
  "bonds" text,
  "flaws" text,
  "goals" text,
  "secrets" text,
  "backstory" text,
  "motivations" text,
  "hooks" text,
  
  -- Relationships & Connections
  "faction" varchar(255),
  "relationships" text,
  "attitude_toward_party" varchar(100),
  "allies" text,
  "enemies" text,
  "affiliations" text,
  "resources" text,
  
  -- Metadata
  "notes" text,
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_npcs_created_by" ON "npcs"("created_by");
CREATE INDEX IF NOT EXISTS "idx_npcs_race" ON "npcs"("race");
CREATE INDEX IF NOT EXISTS "idx_npcs_challenge_rating" ON "npcs"("challenge_rating");

-- ============================================
-- WORLDBUILDER: CALENDARS
-- ============================================

CREATE TABLE IF NOT EXISTS "calendars" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "description" text,
  
  -- Time & Day/Night Cycle
  "hours_per_day" integer NOT NULL DEFAULT 24,
  "minutes_per_hour" integer NOT NULL DEFAULT 60,
  "daylight_hours" integer NOT NULL DEFAULT 12,
  "night_hours" integer NOT NULL DEFAULT 10,
  "dawn_dusk_hours" integer NOT NULL DEFAULT 2,
  
  -- Year structure
  "days_per_year" integer NOT NULL DEFAULT 365,
  
  -- Leap year rules
  "has_leap_year" boolean NOT NULL DEFAULT false,
  "leap_year_frequency" integer,
  "leap_year_exceptions" text,
  "leap_days_added" integer,
  
  -- Content flags
  "is_free" boolean DEFAULT false NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  
  -- Timestamps
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendars_created_by" ON "calendars"("created_by");

-- Weekday definitions
CREATE TABLE IF NOT EXISTS "calendar_weekdays" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "calendar_id" varchar(36) NOT NULL REFERENCES "calendars"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendar_weekdays_calendar_id" ON "calendar_weekdays"("calendar_id");

-- Month definitions with flexible week structures
CREATE TABLE IF NOT EXISTS "calendar_months" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "calendar_id" varchar(36) NOT NULL REFERENCES "calendars"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "order" integer NOT NULL,
  "season_tag" varchar(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendar_months_calendar_id" ON "calendar_months"("calendar_id");

-- Week structure within months (allows flexible week patterns)
CREATE TABLE IF NOT EXISTS "calendar_month_weeks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "month_id" varchar(36) NOT NULL REFERENCES "calendar_months"("id") ON DELETE CASCADE,
  "week_number" integer NOT NULL,
  "days_in_week" integer NOT NULL,
  "repeat_pattern" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendar_month_weeks_month_id" ON "calendar_month_weeks"("month_id");

-- Season definitions
CREATE TABLE IF NOT EXISTS "calendar_seasons" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "calendar_id" varchar(36) NOT NULL REFERENCES "calendars"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "start_day_of_year" integer NOT NULL,
  "description" text,
  -- Optional: Override daylight hours for this season
  "daylight_hours" integer,
  "dawn_dusk_hours" integer,
  "night_hours" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendar_seasons_calendar_id" ON "calendar_seasons"("calendar_id");

-- Festival/Observance definitions
CREATE TABLE IF NOT EXISTS "calendar_festivals" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "calendar_id" varchar(36) NOT NULL REFERENCES "calendars"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "day_rule" varchar(255) NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_calendar_festivals_calendar_id" ON "calendar_festivals"("calendar_id");

-- ============================================
-- CAMPAIGN MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "created_by" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "genre" varchar(100),
  "attribute_points" integer DEFAULT 150 NOT NULL,
  "skill_points" integer DEFAULT 50 NOT NULL,
  "max_points_in_skill" integer,
  "points_needed_for_next_tier" integer,
  "max_allowed_in_tier" integer,
  "tier1_enabled" boolean DEFAULT false NOT NULL,
  "tier2_enabled" boolean DEFAULT false NOT NULL,
  "tier3_enabled" boolean DEFAULT false NOT NULL,
  "spellcraft_enabled" boolean DEFAULT false NOT NULL,
  "talismanism_enabled" boolean DEFAULT false NOT NULL,
  "faith_enabled" boolean DEFAULT false NOT NULL,
  "psyonics_enabled" boolean DEFAULT false NOT NULL,
  "bardic_resonances_enabled" boolean DEFAULT false NOT NULL,
  "special_abilities_enabled" boolean DEFAULT false NOT NULL,
  "allowed_races" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_campaigns_created_by" ON "campaigns"("created_by");

CREATE TABLE IF NOT EXISTS "campaign_currencies" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "campaign_id" varchar(36) NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "credit_value" numeric(10, 4) DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_campaign_currencies_campaign_id" ON "campaign_currencies"("campaign_id");

CREATE TABLE IF NOT EXISTS "campaign_players" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "campaign_id" varchar(36) NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
  "user_id" varchar(36) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE("campaign_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_campaign_players_campaign_id" ON "campaign_players"("campaign_id");
CREATE INDEX IF NOT EXISTS "idx_campaign_players_user_id" ON "campaign_players"("user_id");

CREATE TABLE IF NOT EXISTS "campaign_characters" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "campaign_player_id" varchar(36) NOT NULL REFERENCES "campaign_players"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_campaign_characters_player_id" ON "campaign_characters"("campaign_player_id");

-- ============================================
-- SEED DEFAULT ROLES
-- ============================================

INSERT INTO "roles" ("code", "name", "description") VALUES
  ('admin', 'Administrator', 'Full system access and management capabilities'),
  ('privileged', 'Privileged User', 'Enhanced access with special privileges'),
  ('universe_creator', 'Universe Creator', 'Can create and manage multiple universes'),
  ('world_developer', 'World Developer', 'Can develop detailed worlds and content'),
  ('world_builder', 'World Builder', 'Can build and modify worlds'),
  ('free', 'Free User', 'Basic access with limited features')
ON CONFLICT ("code") DO NOTHING;
