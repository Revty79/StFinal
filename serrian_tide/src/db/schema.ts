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
  numeric,
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
  attacks: jsonb('attacks').$type<Array<{ description: string; damage: number; range: string }>>(),
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
  
  // Usage & Charges
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
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
  
  // Legendary item properties
  rarity: varchar('rarity', { length: 50 }), // common, uncommon, rare, epic, legendary, mythic
  attunement: varchar('attunement', { length: 255 }), // requirements to attune/use
  curse: text('curse'), // drawbacks, corruption, oaths
  
  // Usage & Charges
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
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
  
  // Legendary item properties
  rarity: varchar('rarity', { length: 50 }), // common, uncommon, rare, epic, legendary, mythic
  attunement: varchar('attunement', { length: 255 }), // requirements to attune/use
  curse: text('curse'), // drawbacks, corruption, oaths
  
  // Usage & Charges
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_armor_created_by').on(t.createdBy),
}));

// Inventory Artifacts table (wondrous items only: rings, amulets, cloaks, wands, staves, orbs, tomes, relics)
// For legendary weapons/armor, use the weapons/armor tables with rarity field
export const inventoryArtifacts = pgTable('inventory_artifacts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  category: varchar('category', { length: 100 }), // wondrous, consumable, relic, tome, focus, other
  rarity: varchar('rarity', { length: 50 }), // common, uncommon, rare, epic, legendary, mythic
  attunement: varchar('attunement', { length: 255 }), // requirements to use
  genreTags: text('genre_tags'),
  mechanicalEffect: text('mechanical_effect'),
  curse: text('curse'), // drawbacks, corruption, madness, oaths
  originLore: text('origin_lore'), // who forged it, where it came from
  weight: integer('weight'),
  narrativeNotes: text('narrative_notes'),
  
  // Usage & Charges
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_artifacts_created_by').on(t.createdBy),
}));

// Inventory Services table
export const inventoryServices = pgTable('inventory_services', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  category: varchar('category', { length: 100 }), // travel, lodging, healing, information, etc
  duration: varchar('duration', { length: 255 }), // instant, 1 hour, 1 day, etc
  genreTags: text('genre_tags'),
  mechanicalEffect: text('mechanical_effect'),
  weight: integer('weight'), // usually null for services
  narrativeNotes: text('narrative_notes'),
  
  // Usage & Charges
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_services_created_by').on(t.createdBy),
}));

// Inventory Companions table (pets, mounts, etc - references creatures table)
export const inventoryCompanions = pgTable('inventory_companions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  companionType: varchar('companion_type', { length: 50 }), // pet, mount, companion, familiar, summon
  creatureId: varchar('creature_id', { length: 36 }).references(() => creatures.id, { onDelete: 'set null' }),
  creatureName: varchar('creature_name', { length: 255 }), // denormalized for display
  timelineTag: varchar('timeline_tag', { length: 100 }),
  costCredits: integer('cost_credits'),
  genreTags: text('genre_tags'),
  
  // Companion-specific attributes
  loyalty: integer('loyalty'), // 0-100 loyalty score
  training: text('training'), // trained commands, skills
  personalityTraits: text('personality_traits'),
  bond: text('bond'), // relationship with owner
  
  mechanicalEffect: text('mechanical_effect'),
  narrativeNotes: text('narrative_notes'),
  
  // Usage & Charges (for special abilities)
  usageType: varchar('usage_type', { length: 50 }), // consumable, charges, at_will, other
  maxCharges: integer('max_charges'),
  rechargeWindow: varchar('recharge_window', { length: 50 }), // none, scene, session, rest, day, custom
  rechargeNotes: text('recharge_notes'),
  effectHooks: jsonb('effect_hooks').$type<any[]>(), // structured hooks for automation
  
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_inventory_companions_created_by').on(t.createdBy),
  byCreature: index('idx_inventory_companions_creature_id').on(t.creatureId),
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

// ===== CALENDARS =====

export const calendars = pgTable('calendars', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Time & Day/Night Cycle
  hoursPerDay: integer('hours_per_day').notNull().default(24),
  minutesPerHour: integer('minutes_per_hour').notNull().default(60),
  daylightHours: integer('daylight_hours').notNull().default(12),
  nightHours: integer('night_hours').notNull().default(10),
  dawnDuskHours: integer('dawn_dusk_hours').notNull().default(2),
  
  // Year structure
  daysPerYear: integer('days_per_year').notNull().default(365),
  
  // Leap year rules
  hasLeapYear: boolean('has_leap_year').notNull().default(false),
  leapYearFrequency: integer('leap_year_frequency'),
  leapYearExceptions: text('leap_year_exceptions'),
  leapDaysAdded: integer('leap_days_added'),
  
  // Content flags
  isFree: boolean('is_free').notNull().default(true),
  isPublished: boolean('is_published').notNull().default(false),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_calendars_created_by').on(t.createdBy),
}));

export const calendarWeekdays = pgTable('calendar_weekdays', {
  id: varchar('id', { length: 36 }).primaryKey(),
  calendarId: varchar('calendar_id', { length: 36 })
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCalendar: index('idx_calendar_weekdays_calendar_id').on(t.calendarId),
}));

export const calendarMonths = pgTable('calendar_months', {
  id: varchar('id', { length: 36 }).primaryKey(),
  calendarId: varchar('calendar_id', { length: 36 })
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  order: integer('order').notNull(),
  seasonTag: varchar('season_tag', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCalendar: index('idx_calendar_months_calendar_id').on(t.calendarId),
}));

export const calendarMonthWeeks = pgTable('calendar_month_weeks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  monthId: varchar('month_id', { length: 36 })
    .notNull()
    .references(() => calendarMonths.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
  daysInWeek: integer('days_in_week').notNull(),
  repeatPattern: boolean('repeat_pattern').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byMonth: index('idx_calendar_month_weeks_month_id').on(t.monthId),
}));

export const calendarSeasons = pgTable('calendar_seasons', {
  id: varchar('id', { length: 36 }).primaryKey(),
  calendarId: varchar('calendar_id', { length: 36 })
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  startDayOfYear: integer('start_day_of_year').notNull(),
  description: text('description'),
  // Optional: Override daylight hours for this season
  daylightHours: integer('daylight_hours'),
  dawnDuskHours: integer('dawn_dusk_hours'),
  nightHours: integer('night_hours'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCalendar: index('idx_calendar_seasons_calendar_id').on(t.calendarId),
}));

export const calendarAstronomicalEvents = pgTable('calendar_astronomical_events', {
  id: varchar('id', { length: 36 }).primaryKey(),
  calendarId: varchar('calendar_id', { length: 36 })
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  dayOfYear: integer('day_of_year').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  celestialBody: varchar('celestial_body', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCalendar: index('idx_calendar_astronomical_events_calendar_id').on(t.calendarId),
}));

export const calendarFestivals = pgTable('calendar_festivals', {
  id: varchar('id', { length: 36 }).primaryKey(),
  calendarId: varchar('calendar_id', { length: 36 })
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  dayRule: varchar('day_rule', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCalendar: index('idx_calendar_festivals_calendar_id').on(t.calendarId),
}));

/** ===== CAMPAIGN MANAGEMENT ===== **/

export const campaigns = pgTable('campaigns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  genre: varchar('genre', { length: 100 }),
  
  // Character Configuration
  attributePoints: integer('attribute_points').notNull().default(150),
  skillPoints: integer('skill_points').notNull().default(50),
  maxPointsInSkill: integer('max_points_in_skill'),
  pointsNeededForNextTier: integer('points_needed_for_next_tier'),
  maxAllowedInTier: integer('max_allowed_in_tier'),
  
  // Enabled Systems
  tier1Enabled: boolean('tier1_enabled').notNull().default(false),
  tier2Enabled: boolean('tier2_enabled').notNull().default(false),
  tier3Enabled: boolean('tier3_enabled').notNull().default(false),
  spellcraftEnabled: boolean('spellcraft_enabled').notNull().default(false),
  talismanismEnabled: boolean('talismanism_enabled').notNull().default(false),
  faithEnabled: boolean('faith_enabled').notNull().default(false),
  psyonicsEnabled: boolean('psyonics_enabled').notNull().default(false),
  bardicResonancesEnabled: boolean('bardic_resonances_enabled').notNull().default(false),
  specialAbilitiesEnabled: boolean('special_abilities_enabled').notNull().default(false),
  
  // Allowed Races (array of race IDs)
  allowedRaces: jsonb('allowed_races').$type<string[]>().notNull().default([]),
  
  // Starting Resources
  startingCredits: integer('starting_credits').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCreator: index('idx_campaigns_created_by').on(t.createdBy),
}));

export const campaignCurrencies = pgTable('campaign_currencies', {
  id: varchar('id', { length: 36 }).primaryKey(),
  campaignId: varchar('campaign_id', { length: 36 })
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 10 }),
  creditValue: numeric('credit_value', { precision: 10, scale: 4 }).notNull().default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('idx_campaign_currencies_campaign_id').on(t.campaignId),
}));

export const campaignPlayers = pgTable('campaign_players', {
  id: varchar('id', { length: 36 }).primaryKey(),
  campaignId: varchar('campaign_id', { length: 36 })
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('idx_campaign_players_campaign_id').on(t.campaignId),
  byUser: index('idx_campaign_players_user_id').on(t.userId),
  unique: primaryKey({ columns: [t.campaignId, t.userId] }),
}));

export const campaignCharacters = pgTable('campaign_characters', {
  id: varchar('id', { length: 36 }).primaryKey(),
  campaignPlayerId: varchar('campaign_player_id', { length: 36 })
    .notNull()
    .references(() => campaignPlayers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  
  // Identity Fields
  playerName: varchar('player_name', { length: 255 }),
  campaignName: varchar('campaign_name', { length: 255 }),
  raceId: varchar('race_id', { length: 36 }).references(() => races.id, { onDelete: 'set null' }),
  race: varchar('race', { length: 255 }), // Store race name for display
  age: integer('age'),
  baseMagic: integer('base_magic'),
  baseMovement: integer('base_movement'),
  sex: varchar('sex', { length: 50 }),
  height: integer('height'), // in inches
  weight: integer('weight'), // in pounds
  skinColor: varchar('skin_color', { length: 100 }),
  eyeColor: varchar('eye_color', { length: 100 }),
  hairColor: varchar('hair_color', { length: 100 }),
  deity: varchar('deity', { length: 255 }),
  definingMarks: text('defining_marks'),
  
  // In-Game Values (GM assigned/earned)
  fame: integer('fame').notNull().default(0),
  experience: integer('experience').notNull().default(0),
  totalExperience: integer('total_experience').notNull().default(0),
  quintessence: integer('quintessence').notNull().default(0),
  totalQuintessence: integer('total_quintessence').notNull().default(0),
  
  // Attributes
  strength: integer('strength').notNull().default(25),
  dexterity: integer('dexterity').notNull().default(25),
  constitution: integer('constitution').notNull().default(25),
  intelligence: integer('intelligence').notNull().default(25),
  wisdom: integer('wisdom').notNull().default(25),
  charisma: integer('charisma').notNull().default(25),
  
  // Skills - stored as {"skillId": points, "parentId:skillId": points}
  skillAllocations: jsonb('skill_allocations').$type<Record<string, number>>().notNull().default({}),
  
  // Story & Personality
  personality: text('personality'),
  ideals: text('ideals'),
  goals: text('goals'),
  secrets: text('secrets'),
  backstory: text('backstory'),
  motivations: text('motivations'),
  
  // Connections & Power
  faction: text('faction'),
  relationships: text('relationships'),
  attitudeTowardParty: text('attitude_toward_party'),
  allies: text('allies'),
  enemies: text('enemies'),
  affiliations: text('affiliations'),
  resources: text('resources'),
  
  // Equipment & Resources
  creditsRemaining: integer('credits_remaining').notNull().default(0),
  equipment: jsonb('equipment').$type<any[]>().notNull().default([]),
  
  // Combat Stats (calculated or assigned)
  hpTotal: integer('hp_total'),
  initiative: integer('initiative'),
  mana: integer('mana'),
  armorSoak: varchar('armor_soak', { length: 100 }),
  defenseNotes: text('defense_notes'),
  challengeRating: integer('challenge_rating'),
  
  // Skill Management
  skillCheckpoint: jsonb('skill_checkpoint').$type<Record<string, number>>(),
  isInitialSetupLocked: boolean('is_initial_setup_locked').notNull().default(false),
  xpSpent: integer('xp_spent').notNull().default(0),
  xpCheckpoint: integer('xp_checkpoint').notNull().default(0),
  
  notes: text('notes'),
  isSetupComplete: boolean('is_setup_complete').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byPlayer: index('idx_campaign_characters_player_id').on(t.campaignPlayerId),
}));

// Campaign Store Items - tracks which inventory items are available in each campaign's starting gear shop
export const campaignStoreItems = pgTable('campaign_store_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  campaignId: varchar('campaign_id', { length: 36 })
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  
  // Reference to the inventory item (polymorphic reference)
  sourceType: varchar('source_type', { length: 20 }).notNull(), // 'item', 'weapon', 'armor'
  sourceId: varchar('source_id', { length: 36 }).notNull(),
  
  // Cached fields for quick display (denormalized from source)
  name: varchar('name', { length: 255 }).notNull(),
  itemType: varchar('item_type', { length: 20 }).notNull(), // 'Item', 'Weapon', 'Armor'
  costCredits: integer('cost_credits').notNull().default(0),
  
  // Store-specific settings
  isEnabled: boolean('is_enabled').notNull().default(true),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  byCampaign: index('idx_campaign_store_items_campaign_id').on(t.campaignId),
  bySource: index('idx_campaign_store_items_source').on(t.sourceType, t.sourceId),
  uniqueItem: index('idx_campaign_store_items_unique').on(t.campaignId, t.sourceType, t.sourceId),
}));
