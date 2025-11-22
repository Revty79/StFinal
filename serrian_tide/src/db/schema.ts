import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  index,
  primaryKey,
  text,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

/** ===== AUTH / RBAC ONLY ===== **/
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).unique(),
  // Argon2 hash string (stores salt/params internally)
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  code: varchar('code', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
});

export const userRoles = pgTable(
  'user_roles',
  {
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleCode: varchar('role_code', { length: 50 })
      .notNull()
      .references(() => roles.code, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleCode] }),
  })
);

export const sessions = pgTable(
  'sessions',
  {
    id: varchar('id', { length: 40 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    byUser: index('idx_sessions_user').on(t.userId),
  })
);

export const userPreferences = pgTable('user_preferences', {
  userId: varchar('user_id', { length: 36 })
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 50 }).default('void'),
  backgroundImage: varchar('background_image', { length: 255 }).default('nebula.png'),
  gearImage: varchar('gear_image', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** ===== WORLDBUILDER CONTENT ===== **/

// Skills table
export const skills = pgTable('skills', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // standard, magic, sphere, discipline, resonance, spell, psionic skill, reverberation, special ability
  tier: integer('tier'), // 1, 2, 3, or null for N/A
  primaryAttribute: varchar('primary_attribute', { length: 10 }).notNull(), // STR, DEX, CON, INT, WIS, CHA, NA
  secondaryAttribute: varchar('secondary_attribute', { length: 10 }).notNull(), // STR, DEX, CON, INT, WIS, CHA, NA
  definition: text('definition'),
  parentId: varchar('parent_id', { length: 36 }).references((): any => skills.id, { onDelete: 'set null' }),
  parent2Id: varchar('parent2_id', { length: 36 }).references((): any => skills.id, { onDelete: 'set null' }),
  parent3Id: varchar('parent3_id', { length: 36 }).references((): any => skills.id, { onDelete: 'set null' }),
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_skills_created_by').on(t.createdBy),
  byType: index('idx_skills_type').on(t.type),
  byTier: index('idx_skills_tier').on(t.tier),
}));

// Magic Type Details (for spell, psionic skill, reverberation types)
export const magicTypeDetails = pgTable('magic_type_details', {
  id: varchar('id', { length: 36 }).primaryKey(),
  skillId: varchar('skill_id', { length: 36 })
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  skillName: varchar('skill_name', { length: 255 }),
  tradition: varchar('tradition', { length: 100 }), // 'spellcraft', 'psionics', 'bardic'
  tier2Path: varchar('tier2_path', { length: 100 }),
  containersJson: jsonb('containers_json').$type<any>(),
  modifiersJson: jsonb('modifiers_json').$type<Record<string, number>>(),
  manaCost: integer('mana_cost'),
  castingTime: integer('casting_time'),
  masteryLevel: integer('mastery_level'),
  notes: text('notes'),
  flavorLine: text('flavor_line'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySkill: index('idx_magic_type_details_skill_id').on(t.skillId),
}));

// Special Ability Type Details
export const specialAbilityDetails = pgTable('special_ability_details', {
  id: varchar('id', { length: 36 }).primaryKey(),
  skillId: varchar('skill_id', { length: 36 })
    .notNull()
    .references(() => skills.id, { onDelete: 'cascade' }),
  abilityType: varchar('ability_type', { length: 100 }), // 'Utility', 'Combat', 'Magic/Psionic', 'Other'
  scalingMethod: varchar('scaling_method', { length: 100 }), // 'Point-Based', etc.
  prerequisites: text('prerequisites'),
  scalingDetails: text('scaling_details'),
  
  // Stage 1
  stage1Tag: varchar('stage1_tag', { length: 255 }),
  stage1Desc: text('stage1_desc'),
  stage1Points: varchar('stage1_points', { length: 50 }),
  
  // Stage 2
  stage2Tag: varchar('stage2_tag', { length: 255 }),
  stage2Desc: text('stage2_desc'),
  stage2Points: varchar('stage2_points', { length: 50 }),
  
  // Stage 3
  stage3Tag: varchar('stage3_tag', { length: 255 }),
  stage3Desc: text('stage3_desc'),
  
  // Stage 4
  stage4Tag: varchar('stage4_tag', { length: 255 }),
  stage4Desc: text('stage4_desc'),
  
  // Final
  finalTag: varchar('final_tag', { length: 255 }),
  finalDesc: text('final_desc'),
  
  // Additional 1-4
  add1Tag: varchar('add1_tag', { length: 255 }),
  add1Desc: text('add1_desc'),
  add2Tag: varchar('add2_tag', { length: 255 }),
  add2Desc: text('add2_desc'),
  add3Tag: varchar('add3_tag', { length: 255 }),
  add3Desc: text('add3_desc'),
  add4Tag: varchar('add4_tag', { length: 255 }),
  add4Desc: text('add4_desc'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  bySkill: index('idx_special_ability_details_skill_id').on(t.skillId),
}));

// Races table
export const races = pgTable('races', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  tagline: text('tagline'),
  
  // Identity & Lore (stored as JSONB for flexibility)
  definition: jsonb('definition').$type<{
    legacy_description?: string | null;
    physical_characteristics?: string | null;
    physical_description?: string | null;
    racial_quirk?: string | null;
    quirk_success_effect?: string | null;
    quirk_failure_effect?: string | null;
    common_languages_known?: string | null;
    common_archetypes?: string | null;
    examples_by_genre?: string | null;
    cultural_mindset?: string | null;
    outlook_on_magic?: string | null;
  }>(),
  
  // Attributes (stored as JSONB)
  attributes: jsonb('attributes').$type<{
    age_range?: string | null;
    size?: string | null;
    strength_max?: string | null;
    dexterity_max?: string | null;
    constitution_max?: string | null;
    intelligence_max?: string | null;
    wisdom_max?: string | null;
    charisma_max?: string | null;
    base_magic?: string | null;
    base_movement?: string | null;
  }>(),
  
  // Bonus skills and special abilities (stored as JSONB arrays)
  bonusSkills: jsonb('bonus_skills').$type<Array<{ skillId?: string | null; skillName: string; points: string }>>(),
  specialAbilities: jsonb('special_abilities').$type<Array<{ skillId?: string | null; skillName: string; points: string }>>(),
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_races_created_by').on(t.createdBy),
}));

// Creatures table
export const creatures = pgTable('creatures', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  altNames: text('alt_names'),
  challengeRating: varchar('challenge_rating', { length: 50 }),
  encounterScale: varchar('encounter_scale', { length: 50 }),
  type: varchar('type', { length: 100 }),
  role: varchar('role', { length: 100 }),
  size: varchar('size', { length: 50 }),
  genreTags: text('genre_tags'),
  descriptionShort: text('description_short'),
  
  // Stats
  strength: integer('strength'),
  dexterity: integer('dexterity'),
  constitution: integer('constitution'),
  intelligence: integer('intelligence'),
  wisdom: integer('wisdom'),
  charisma: integer('charisma'),
  hpTotal: integer('hp_total'),
  initiative: integer('initiative'),
  hpByLocation: text('hp_by_location'),
  armorSoak: text('armor_soak'),
  
  // Combat
  attackModes: text('attack_modes'),
  damage: text('damage'),
  rangeText: text('range_text'),
  specialAbilities: text('special_abilities'),
  magicResonanceInteraction: text('magic_resonance_interaction'),
  
  // Behavior & Lore
  behaviorTactics: text('behavior_tactics'),
  habitat: text('habitat'),
  diet: text('diet'),
  variants: text('variants'),
  lootHarvest: text('loot_harvest'),
  storyHooks: text('story_hooks'),
  notes: text('notes'),
  
  // Usage flags for mount/pet/companion
  canBeMount: boolean('can_be_mount').default(false),
  canBePet: boolean('can_be_pet').default(false),
  canBeCompanion: boolean('can_be_companion').default(false),
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_creatures_created_by').on(t.createdBy),
}));

// Inventory Items table
export const inventoryItems = pgTable('inventory_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  category: varchar('category', { length: 100 }),
  subtype: varchar('subtype', { length: 100 }),
  genreTags: text('genre_tags'),
  mechanicalEffect: text('mechanical_effect'),
  weight: integer('weight'),
  narrativeNotes: text('narrative_notes'),
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_items_created_by').on(t.createdBy),
}));

// Inventory Weapons table
export const inventoryWeapons = pgTable('inventory_weapons', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  category: varchar('category', { length: 100 }),
  handedness: varchar('handedness', { length: 50 }),
  dtype: varchar('dtype', { length: 100 }),
  rangeType: varchar('range_type', { length: 50 }),
  rangeText: varchar('range_text', { length: 100 }),
  genreTags: text('genre_tags'),
  weight: integer('weight'),
  damage: integer('damage'),
  effect: text('effect'),
  narrativeNotes: text('narrative_notes'),
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_weapons_created_by').on(t.createdBy),
}));

// Inventory Armor table
export const inventoryArmor = pgTable('inventory_armor', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  areaCovered: varchar('area_covered', { length: 100 }),
  soak: integer('soak'),
  category: varchar('category', { length: 100 }),
  atype: varchar('atype', { length: 100 }),
  genreTags: text('genre_tags'),
  weight: integer('weight'),
  encumbrancePenalty: integer('encumbrance_penalty'),
  effect: text('effect'),
  narrativeNotes: text('narrative_notes'),
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_armor_created_by').on(t.createdBy),
}));

// NPCs table
export const npcs = pgTable('npcs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Identity
  name: varchar('name', { length: 255 }).notNull(),
  alias: varchar('alias', { length: 255 }),
  importance: varchar('importance', { length: 100 }),
  role: varchar('role', { length: 255 }),
  race: varchar('race', { length: 100 }),
  occupation: varchar('occupation', { length: 255 }),
  location: varchar('location', { length: 255 }),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  tags: text('tags'),
  age: varchar('age', { length: 50 }),
  gender: varchar('gender', { length: 50 }),
  
  // Descriptions
  descriptionShort: text('description_short'),
  appearance: text('appearance'),
  
  // Stats & Attributes
  strength: integer('strength').default(25),
  dexterity: integer('dexterity').default(25),
  constitution: integer('constitution').default(25),
  intelligence: integer('intelligence').default(25),
  wisdom: integer('wisdom').default(25),
  charisma: integer('charisma').default(25),
  
  baseMovement: integer('base_movement').default(5),
  hpTotal: integer('hp_total'),
  initiative: integer('initiative'),
  armorSoak: varchar('armor_soak', { length: 100 }),
  defenseNotes: text('defense_notes'),
  
  // Challenge Rating & XP
  challengeRating: integer('challenge_rating').default(1),
  
  // Skills (stored as JSON: { skillId: points })
  skillAllocations: jsonb('skill_allocations').$type<Record<string, number>>(),
  skillCheckpoint: jsonb('skill_checkpoint').$type<Record<string, number>>(),
  isInitialSetupLocked: boolean('is_initial_setup_locked').default(false),
  xpSpent: integer('xp_spent').default(0),
  xpCheckpoint: integer('xp_checkpoint').default(0),
  
  // Story & Personality
  personality: text('personality'),
  ideals: text('ideals'),
  bonds: text('bonds'),
  flaws: text('flaws'),
  goals: text('goals'),
  secrets: text('secrets'),
  backstory: text('backstory'),
  motivations: text('motivations'),
  hooks: text('hooks'),
  
  // Connections
  faction: varchar('faction', { length: 255 }),
  relationships: text('relationships'),
  attitudeTowardParty: varchar('attitude_toward_party', { length: 100 }),
  allies: text('allies'),
  enemies: text('enemies'),
  affiliations: text('affiliations'),
  resources: text('resources'),
  
  // Metadata
  notes: text('notes'),
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_npcs_created_by').on(t.createdBy),
  byRace: index('idx_npcs_race').on(t.race),
  byCR: index('idx_npcs_challenge_rating').on(t.challengeRating),
}));

