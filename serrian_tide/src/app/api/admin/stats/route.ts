import { NextResponse } from "next/server";
import { pool } from "@/db/client";
import { getSessionUser } from "@/server/session";

// GET /api/admin/stats
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Get users by role
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    const usersByRole: Record<string, number> = {};
    rolesResult.rows.forEach((row) => {
      usersByRole[row.role] = parseInt(row.count);
    });

    // Get content counts
    const contentResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM skills) as skills,
        (SELECT COUNT(*) FROM npcs) as npcs,
        (SELECT COUNT(*) FROM creatures) as creatures,
        (SELECT COUNT(*) FROM inventory_items) as items,
        (SELECT COUNT(*) FROM races) as races,
        (SELECT COUNT(*) FROM calendars) as calendars
    `);

    const contentCounts = contentResult.rows[0];

    // Get free vs premium
    const freeVsPremiumResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM skills WHERE is_free = true) as free_skills,
        (SELECT COUNT(*) FROM skills WHERE is_free = false) as premium_skills,
        (SELECT COUNT(*) FROM npcs WHERE is_free = true) as free_npcs,
        (SELECT COUNT(*) FROM npcs WHERE is_free = false) as premium_npcs
    `);

    const fvp = freeVsPremiumResult.rows[0];

    const stats = {
      usersByRole,
      contentCounts: {
        skills: parseInt(contentCounts.skills),
        npcs: parseInt(contentCounts.npcs),
        creatures: parseInt(contentCounts.creatures),
        items: parseInt(contentCounts.items),
        races: parseInt(contentCounts.races),
        calendars: parseInt(contentCounts.calendars),
      },
      freeVsPremium: {
        freeSkills: parseInt(fvp.free_skills),
        premiumSkills: parseInt(fvp.premium_skills),
        freeNpcs: parseInt(fvp.free_npcs),
        premiumNpcs: parseInt(fvp.premium_npcs),
      },
    };

    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    console.error("Get admin stats error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
