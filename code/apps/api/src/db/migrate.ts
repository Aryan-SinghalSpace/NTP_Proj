/**
 * Minimal forward-only SQL migration runner. Applies every *.sql under
 * apps/api/drizzle in lexical order, once, tracked in schema_migrations.
 * Runs as the OWNER role (MIGRATION_DATABASE_URL) so it can create RLS
 * policies and grants. Invoke with: `pnpm --filter @tracewell/api migrate`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';
import { env } from '../config/env';

async function main(): Promise<void> {
  const dir = join(__dirname, '..', '..', 'drizzle');
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = new Client({ connectionString: env.MIGRATION_DATABASE_URL });
  await client.connect();
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  for (const file of files) {
    const done = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [file]);
    if (done.rowCount) {
      console.log(`= skip   ${file}`);
      continue;
    }
    const ddl = readFileSync(join(dir, file), 'utf8');
    console.log(`+ apply  ${file}`);
    try {
      await client.query('BEGIN');
      await client.query(ddl);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`! failed ${file}`);
      throw err;
    }
  }

  await client.end();
  console.log('migrations complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
