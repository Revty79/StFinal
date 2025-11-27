import { NextResponse } from 'next/server';
import { getSessionUser } from '@/server/session';
import { db } from '@/db/client';
import { 
  skills, 
  races, 
  creatures, 
  inventoryItems, 
  inventoryWeapons, 
  inventoryArmor, 
  npcs,
  campaigns,
  campaignPlayers,
  campaignCharacters
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Count worldbuilder creations
    const [
      skillsCount,
      racesCount,
      creaturesCount,
      itemsCount,
      weaponsCount,
      armorCount,
      npcsCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(skills).where(eq(skills.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(races).where(eq(races.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(creatures).where(eq(creatures.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(eq(inventoryItems.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(inventoryWeapons).where(eq(inventoryWeapons.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(inventoryArmor).where(eq(inventoryArmor.createdBy, userId)),
      db.select({ count: sql<number>`count(*)` }).from(npcs).where(eq(npcs.createdBy, userId)),
    ]);

    // Count campaigns created (as GM)
    const campaignsCreatedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(eq(campaigns.createdBy, userId));

    // Count campaigns playing in (as player)
    const campaignsPlayingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaignPlayers)
      .where(eq(campaignPlayers.userId, userId));

    // Count total characters across all campaigns
    const charactersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaignCharacters)
      .innerJoin(campaignPlayers, eq(campaignCharacters.campaignPlayerId, campaignPlayers.id))
      .where(eq(campaignPlayers.userId, userId));

    // Calculate total worldbuilder creations
    const totalCreations = 
      Number(skillsCount[0]?.count || 0) +
      Number(racesCount[0]?.count || 0) +
      Number(creaturesCount[0]?.count || 0) +
      Number(itemsCount[0]?.count || 0) +
      Number(weaponsCount[0]?.count || 0) +
      Number(armorCount[0]?.count || 0) +
      Number(npcsCount[0]?.count || 0);

    return NextResponse.json({
      ok: true,
      stats: {
        worldbuilder: {
          skills: Number(skillsCount[0]?.count || 0),
          races: Number(racesCount[0]?.count || 0),
          creatures: Number(creaturesCount[0]?.count || 0),
          items: Number(itemsCount[0]?.count || 0),
          weapons: Number(weaponsCount[0]?.count || 0),
          armor: Number(armorCount[0]?.count || 0),
          npcs: Number(npcsCount[0]?.count || 0),
          total: totalCreations,
        },
        campaigns: {
          created: Number(campaignsCreatedResult[0]?.count || 0),
          playingIn: Number(campaignsPlayingResult[0]?.count || 0),
        },
        characters: {
          total: Number(charactersResult[0]?.count || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
