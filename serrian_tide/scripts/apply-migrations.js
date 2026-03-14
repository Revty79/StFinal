/**
 * Applies SQL files in ./migrations with execution tracking.
 * Usage: npm run db:migrate
 */

import { config } from "dotenv";
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "..", "migrations");

function isMigrationFile(name) {
  return /^\d+.*\.sql$/i.test(name);
}

function checksumFor(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env.local");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log("Preparing migration metadata table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "name" varchar(255) PRIMARY KEY,
        "checksum" varchar(64) NOT NULL,
        "applied_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir))
      .filter(isMigrationFile)
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log("No migration files found.");
      return;
    }

    const appliedRows = await pool.query(
      `SELECT "name", "checksum" FROM "schema_migrations"`
    );
    const applied = new Map(
      appliedRows.rows.map((row) => [String(row.name), String(row.checksum)])
    );

    let appliedCount = 0;
    let skippedCount = 0;

    for (const fileName of files) {
      const fullPath = path.join(migrationsDir, fileName);
      const sql = await readFile(fullPath, "utf8");
      const checksum = checksumFor(sql);
      const existingChecksum = applied.get(fileName);

      if (existingChecksum) {
        if (existingChecksum !== checksum) {
          throw new Error(
            `Checksum mismatch for already-applied migration "${fileName}".`
          );
        }
        skippedCount += 1;
        console.log(`Skipping ${fileName} (already applied)`);
        continue;
      }

      console.log(`Applying ${fileName}...`);
      await pool.query(sql);
      await pool.query(
        `INSERT INTO "schema_migrations" ("name", "checksum") VALUES ($1, $2)`,
        [fileName, checksum]
      );
      appliedCount += 1;
      console.log(`Applied ${fileName}`);
    }

    console.log(
      `Migration run complete. Applied: ${appliedCount}, Skipped: ${skippedCount}`
    );
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Migration run failed:", error);
  process.exit(1);
});
