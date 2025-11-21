# Database Setup (Manual Mode)

Currently using manual SQL schema management while in development.

## Setup Fresh Database

1. **Drop existing database** (if restarting):
   - Go to your Render dashboard or use psql
   - Drop all tables or recreate the database

2. **Run the schema**:
   ```bash
   # Using psql
   psql $DATABASE_URL -f db_schema.sql
   
   # Or copy/paste the contents of db_schema.sql into Render's SQL editor
   ```

3. **Verify roles were seeded**:
   ```sql
   SELECT * FROM roles;
   ```
   Should see: admin, privileged, universe_creator, world_developer, world_builder, free

## Schema File

- `db_schema.sql` - Complete database schema with all tables and roles seeded

## Notes

- Drizzle removed temporarily for faster iteration during development
- Will bring back Drizzle ORM when schema stabilizes
- Schema.ts still used for TypeScript types with drizzle-orm queries
