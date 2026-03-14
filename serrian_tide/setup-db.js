/**
 * Run the full bootstrap schema file.
 * Usage: node setup-db.js
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { Pool } from "pg";

config({ path: ".env.local" });

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    console.log("Reading schema file...");
    const schema = readFileSync("./db_schema.sql", "utf-8");

    console.log("Applying db_schema.sql...");
    await pool.query(schema);

    console.log("Database schema applied successfully.");

    const result = await pool.query("SELECT code, name FROM roles ORDER BY code");
    console.log("\nAvailable roles:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.code}: ${row.name}`);
    });

    console.log(
      '\nNext step: run "npm run db:migrate" to apply incremental SQL migrations.'
    );
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
