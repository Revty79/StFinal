import { NextResponse } from "next/server";
import { pool } from "@/db/client";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/calendars/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    const result = await pool.query(
      `
      SELECT 
        c.*,
        (
          SELECT json_agg(
            json_build_object(
              'id', cw.id,
              'name', cw.name,
              'order', cw.order
            ) ORDER BY cw.order
          )
          FROM calendar_weekdays cw
          WHERE cw.calendar_id = c.id
        ) as weekdays,
        (
          SELECT json_agg(
            json_build_object(
              'id', cm.id,
              'name', cm.name,
              'order', cm.order,
              'seasonTag', cm.season_tag,
              'weekStructure', (
                SELECT json_agg(
                  json_build_object(
                    'id', cmw.id,
                    'weekNumber', cmw.week_number,
                    'daysInWeek', cmw.days_in_week,
                    'repeatPattern', cmw.repeat_pattern
                  ) ORDER BY cmw.week_number
                )
                FROM calendar_month_weeks cmw
                WHERE cmw.month_id = cm.id
              )
            ) ORDER BY cm.order
          )
          FROM calendar_months cm
          WHERE cm.calendar_id = c.id
        ) as months,
        (
          SELECT json_agg(
            json_build_object(
              'id', cs.id,
              'name', cs.name,
              'startDayOfYear', cs.start_day_of_year,
              'description', cs.description,
              'daylightHours', cs.daylight_hours,
              'dawnDuskHours', cs.dawn_dusk_hours,
              'nightHours', cs.night_hours
            )
          )
          FROM calendar_seasons cs
          WHERE cs.calendar_id = c.id
        ) as seasons,
        (
          SELECT json_agg(
            json_build_object(
              'id', cf.id,
              'name', cf.name,
              'dayRule', cf.day_rule,
              'description', cf.description
            )
          )
          FROM calendar_festivals cf
          WHERE cf.calendar_id = c.id
        ) as festivals
      FROM calendars c
      WHERE c.id = $1 AND (c.created_by = $2 OR c.is_free = true OR $3 = 'admin')
      `,
      [id, user.id, user.role]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    const row = result.rows[0];
    const calendar = {
      id: row.id,
      name: row.name,
      description: row.description,
      hoursPerDay: row.hours_per_day,
      minutesPerHour: row.minutes_per_hour,
      daylightHours: row.daylight_hours,
      nightHours: row.night_hours,
      dawnDuskHours: row.dawn_dusk_hours,
      daysPerYear: row.days_per_year,
      hasLeapYear: row.has_leap_year,
      leapYearFrequency: row.leap_year_frequency,
      leapYearExceptions: row.leap_year_exceptions,
      leapDaysAdded: row.leap_days_added,
      weekdays: row.weekdays || [],
      months: row.months || [],
      seasons: row.seasons || [],
      festivals: row.festivals || [],
    };

    return NextResponse.json({ ok: true, calendar });
  } catch (err) {
    console.error("Get calendar error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// PATCH /api/worldbuilder/calendars/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null) as any;
    if (!body) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    // Check ownership
    const checkResult = await client.query(
      `SELECT created_by FROM calendars WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (checkResult.rows[0].created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    await client.query('BEGIN');

    // Update calendar
    await client.query(
      `
      UPDATE calendars SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        hours_per_day = COALESCE($4, hours_per_day),
        minutes_per_hour = COALESCE($5, minutes_per_hour),
        daylight_hours = COALESCE($6, daylight_hours),
        night_hours = COALESCE($7, night_hours),
        dawn_dusk_hours = COALESCE($8, dawn_dusk_hours),
        days_per_year = COALESCE($9, days_per_year),
        has_leap_year = COALESCE($10, has_leap_year),
        leap_year_frequency = $11,
        leap_year_exceptions = $12,
        leap_days_added = $13,
        updated_at = now()
      WHERE id = $1
      `,
      [
        id,
        body.name,
        body.description,
        body.hoursPerDay,
        body.minutesPerHour,
        body.daylightHours,
        body.nightHours,
        body.dawnDuskHours,
        body.daysPerYear,
        body.hasLeapYear,
        body.leapYearFrequency,
        body.leapYearExceptions,
        body.leapDaysAdded,
      ]
    );

    // Update weekdays - delete all and re-insert
    if (body.weekdays) {
      await client.query(`DELETE FROM calendar_weekdays WHERE calendar_id = $1`, [id]);
      for (const wd of body.weekdays) {
        await client.query(
          `INSERT INTO calendar_weekdays (id, calendar_id, name, "order") VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), id, wd.name, wd.order]
        );
      }
    }

    // Update months - delete all and re-insert (cascades to weeks)
    if (body.months) {
      await client.query(`DELETE FROM calendar_months WHERE calendar_id = $1`, [id]);
      for (let i = 0; i < body.months.length; i++) {
        const month = body.months[i];
        const monthId = crypto.randomUUID();
        
        await client.query(
          `INSERT INTO calendar_months (id, calendar_id, name, "order", season_tag) VALUES ($1, $2, $3, $4, $5)`,
          [monthId, id, month.name, i + 1, month.seasonTag || null]
        );

        if (month.weekStructure && Array.isArray(month.weekStructure)) {
          for (const week of month.weekStructure) {
            await client.query(
              `INSERT INTO calendar_month_weeks (id, month_id, week_number, days_in_week, repeat_pattern) VALUES ($1, $2, $3, $4, $5)`,
              [crypto.randomUUID(), monthId, week.weekNumber, week.daysInWeek, week.repeatPattern || false]
            );
          }
        }
      }
    }

    // Update seasons
    if (body.seasons) {
      await client.query(`DELETE FROM calendar_seasons WHERE calendar_id = $1`, [id]);
      for (const season of body.seasons) {
        await client.query(
          `INSERT INTO calendar_seasons (id, calendar_id, name, start_day_of_year, description, daylight_hours, dawn_dusk_hours, night_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            crypto.randomUUID(),
            id,
            season.name,
            season.startDayOfYear,
            season.description || null,
            season.daylightHours || null,
            season.dawnDuskHours || null,
            season.nightHours || null,
          ]
        );
      }
    }

    // Update festivals
    if (body.festivals) {
      await client.query(`DELETE FROM calendar_festivals WHERE calendar_id = $1`, [id]);
      for (const festival of body.festivals) {
        await client.query(
          `INSERT INTO calendar_festivals (id, calendar_id, name, day_rule, description) VALUES ($1, $2, $3, $4, $5)`,
          [crypto.randomUUID(), id, festival.name, festival.dayRule, festival.description || null]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Update calendar error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/worldbuilder/calendars/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const checkResult = await pool.query(
      `SELECT created_by FROM calendars WHERE id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    if (checkResult.rows[0].created_by !== user.id && user.role !== 'admin') {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    // Delete calendar (cascades to related tables)
    await pool.query(`DELETE FROM calendars WHERE id = $1`, [id]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete calendar error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
