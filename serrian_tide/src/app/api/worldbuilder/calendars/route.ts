import { NextResponse } from "next/server";
import { pool } from "@/db/client";
import { getSessionUser } from "@/server/session";
import crypto from "crypto";

// GET /api/worldbuilder/calendars
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Admins see all, users see their own + free content
    const whereClause = user.role === 'admin'
      ? ''
      : `WHERE c.created_by = $1 OR c.is_free = true`;

    const params = user.role === 'admin' ? [] : [user.id];

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
      ${whereClause}
      ORDER BY c.name
      `,
      params
    );

    const calendars = result.rows.map((row) => ({
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
    }));

    return NextResponse.json({ ok: true, calendars });
  } catch (err) {
    console.error("Get calendars error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// POST /api/worldbuilder/calendars
export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as any;
    if (!body || !body.name) {
      return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
    }

    await client.query('BEGIN');

    const calendarId = crypto.randomUUID();

    // Insert calendar
    await client.query(
      `
      INSERT INTO calendars (
        id, created_by, name, description,
        hours_per_day, minutes_per_hour, daylight_hours, night_hours, dawn_dusk_hours,
        days_per_year, has_leap_year, leap_year_frequency, leap_year_exceptions, leap_days_added,
        is_free, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        calendarId,
        user.id,
        body.name,
        body.description || null,
        body.hoursPerDay || 24,
        body.minutesPerHour || 60,
        body.daylightHours || 12,
        body.nightHours || 10,
        body.dawnDuskHours || 2,
        body.daysPerYear || 365,
        body.hasLeapYear || false,
        body.leapYearFrequency || null,
        body.leapYearExceptions || null,
        body.leapDaysAdded || null,
        body.isFree !== undefined ? body.isFree : false,
        body.isPublished !== undefined ? body.isPublished : false,
      ]
    );

    // Insert weekdays
    if (body.weekdays && Array.isArray(body.weekdays)) {
      for (const wd of body.weekdays) {
        await client.query(
          `INSERT INTO calendar_weekdays (id, calendar_id, name, "order") VALUES ($1, $2, $3, $4)`,
          [crypto.randomUUID(), calendarId, wd.name, wd.order]
        );
      }
    }

    // Insert months with week structures
    if (body.months && Array.isArray(body.months)) {
      for (let i = 0; i < body.months.length; i++) {
        const month = body.months[i];
        const monthId = crypto.randomUUID();
        
        await client.query(
          `INSERT INTO calendar_months (id, calendar_id, name, "order", season_tag) VALUES ($1, $2, $3, $4, $5)`,
          [monthId, calendarId, month.name, i + 1, month.seasonTag || null]
        );

        // Insert week structures
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

    // Insert seasons
    if (body.seasons && Array.isArray(body.seasons)) {
      for (const season of body.seasons) {
        await client.query(
          `INSERT INTO calendar_seasons (id, calendar_id, name, start_day_of_year, description, daylight_hours, dawn_dusk_hours, night_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            crypto.randomUUID(),
            calendarId,
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

    // Insert festivals
    if (body.festivals && Array.isArray(body.festivals)) {
      for (const festival of body.festivals) {
        await client.query(
          `INSERT INTO calendar_festivals (id, calendar_id, name, day_rule, description) VALUES ($1, $2, $3, $4, $5)`,
          [crypto.randomUUID(), calendarId, festival.name, festival.dayRule, festival.description || null]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({ ok: true, id: calendarId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create calendar error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  } finally {
    client.release();
  }
}
