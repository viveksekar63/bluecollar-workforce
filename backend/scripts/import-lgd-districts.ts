import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

type Row = {
  stateCode: string;
  stateName: string;
  districtCode: string;
  districtName: string;
};

function parseCsv(filePath: string): Row[] {
  const lines = readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    if (values.length !== 4 || values.some((value) => !value)) {
      throw new Error(`Invalid CSV row ${index + 2}: ${line}`);
    }

    const [stateCode, stateName, districtCode, districtName] = values;
    return { stateCode, stateName, districtCode, districtName };
  });
}

async function upsertLocation(
  pool: Pool,
  type: 'STATE' | 'DISTRICT',
  name: string,
  code: string,
  parentId: string | null,
): Promise<string> {
  const existing = await pool.query<{ id: string }>(
    `SELECT "id"
       FROM "work_locations"
      WHERE "type" = $1
        AND "name" = $2
        AND (("parentId" = $3) OR ("parentId" IS NULL AND $3 IS NULL))
      LIMIT 1`,
    [type, name, parentId],
  );

  if (existing.rowCount) {
    const id = existing.rows[0].id;
    await pool.query(
      `UPDATE "work_locations"
          SET "code" = $1,
              "isActive" = true,
              "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $2`,
      [code, id],
    );
    return id;
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO "work_locations"
      ("type", "name", "code", "parentId", "isActive")
     VALUES ($1, $2, $3, $4, true)
     RETURNING "id"`,
    [type, name, code, parentId],
  );

  return inserted.rows[0].id;
}

async function main() {
  const filePath = resolve(
    process.cwd(),
    process.argv[2] ?? 'scripts/data/tn-districts.csv',
  );

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const rows = parseCsv(filePath);
  if (!rows.length) {
    throw new Error(`No rows found in ${filePath}`);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('BEGIN');

    const states = new Map<string, string>();
    for (const row of rows) {
      const stateKey = `${row.stateCode}:${row.stateName}`;
      if (!states.has(stateKey)) {
        const stateId = await upsertLocation(
          pool,
          'STATE',
          row.stateName,
          `IN-${row.stateCode}`,
          null,
        );
        states.set(stateKey, stateId);
      }

      await upsertLocation(
        pool,
        'DISTRICT',
        row.districtName,
        `IN-${row.stateCode}-${row.districtCode}`,
        states.get(stateKey)!,
      );
    }

    await pool.query('COMMIT');
    console.log(
      `LGD import completed: ${rows.length} district rows across ${states.size} state(s).`,
    );
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('LGD import failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
