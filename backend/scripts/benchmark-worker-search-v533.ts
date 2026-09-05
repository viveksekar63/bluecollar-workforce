import { Pool } from 'pg';

const DATASET = Number(process.env.BENCHMARK_DATASET ?? 10000);
const ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS ?? 10);
const WARMUP = Number(process.env.BENCHMARK_WARMUP ?? 3);
const PREFIX = 'PERF-V533-';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type Sample = { ms: number; planningMs: number; executionMs: number; hit: number; read: number };

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function cleanup(client: any) {
  await client.query('BEGIN');
  try {
    await client.query('DELETE FROM "WorkerSkill" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)', [`${PREFIX}%`]);
    await client.query('DELETE FROM "WorkerLanguage" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)', [`${PREFIX}%`]);
    await client.query('DELETE FROM "WorkerAddress" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)', [`${PREFIX}%`]);
    await client.query('DELETE FROM worker_work_preferences WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)', [`${PREFIX}%`]);
    await client.query('DELETE FROM "Worker" WHERE "workerCode" LIKE $1', [`${PREFIX}%`]);
    await client.query('DELETE FROM "User" WHERE email LIKE $1', ['perf-v533-worker-%@example.com']);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function seed(client: any, size: number) {
  await cleanup(client);
  await client.query('BEGIN');
  try {
    await client.query(`
      WITH generated AS (
        SELECT gs n, md5('v533-user-' || gs::text)::uuid user_id, md5('v533-worker-' || gs::text)::uuid worker_id
        FROM generate_series(1, $1::int) gs
      )
      INSERT INTO "User" (id, phone, email, "firstName", "lastName", status, "createdAt", "updatedAt")
      SELECT user_id, '918800' || lpad(n::text, 6, '0'), 'perf-v533-worker-' || n::text || '@example.com', 'Perf' || n, 'Worker', 'ACTIVE'::"UserStatus", now(), now()
      FROM generated
    `, [size]);

    await client.query(`
      WITH generated AS (
        SELECT gs n, md5('v533-user-' || gs::text)::uuid user_id, md5('v533-worker-' || gs::text)::uuid worker_id,
          CASE WHEN gs % 10 < 7 THEN 'Electrician' WHEN gs % 10 < 9 THEN 'Plumber' ELSE 'Carpenter' END profession
        FROM generate_series(1, $1::int) gs
      )
      INSERT INTO "Worker" (id, "userId", "workerCode", bio, "experienceYears", "professionCategory", profession, "profileCompletion", "verificationStatus", "verificationScore", "availabilityStatus", "createdAt", "updatedAt")
      SELECT worker_id, user_id, $2 || lpad(n::text, 7, '0'), 'V5.3.3 benchmark worker', (3 + n % 10)::numeric, 'Electrical', profession, 100,
        (CASE WHEN n % 5 = 0 THEN 'VERIFIED' ELSE 'PENDING' END)::"VerificationStatus", CASE WHEN n % 5 = 0 THEN 90 ELSE 50 END,
        (CASE WHEN n % 6 = 0 THEN 'WORKING' ELSE 'AVAILABLE' END)::"AvailabilityStatus", now(), now()
      FROM generated
    `, [size, PREFIX]);

    await client.query(`
      WITH generated AS (SELECT gs n, md5('v533-worker-' || gs::text)::uuid worker_id FROM generate_series(1, $1::int) gs)
      INSERT INTO "WorkerAddress" (id, "workerId", type, "addressLine1", city, district, state, pincode, latitude, longitude, "isCurrent", "createdAt")
      SELECT md5('v533-address-' || n::text)::uuid, worker_id, 'CURRENT'::"AddressType", 'Benchmark Address',
        CASE WHEN n % 10 < 7 THEN 'Chennai' ELSE 'Coimbatore' END,
        CASE WHEN n % 10 < 7 THEN 'Chennai' ELSE 'Coimbatore' END, 'Tamil Nadu', '600001',
        CASE WHEN n % 10 < 7 THEN 13.0827 + (((n % 200) - 100) * 0.001) ELSE 11.0168 + (((n % 100) - 50) * 0.001) END,
        CASE WHEN n % 10 < 7 THEN 80.2707 + (((n % 200) - 100) * 0.001) ELSE 76.9558 + (((n % 100) - 50) * 0.001) END, true, now()
      FROM generated
    `, [size]);

    await client.query(`
      WITH generated AS (SELECT gs n, md5('v533-worker-' || gs::text)::uuid worker_id FROM generate_series(1, $1::int) gs)
      INSERT INTO worker_work_preferences (id, "workerId", mobility, "willingToRelocate", "willingToTravel", "createdAt", "updatedAt")
      SELECT md5('v533-pref-' || n::text)::uuid, worker_id, CASE WHEN n % 5 = 0 THEN 'ANYWHERE_INDIA' ELSE 'LOCAL' END, n % 3 = 0, n % 4 = 0, now(), now()
      FROM generated
    `, [size]);

    await client.query(`
      WITH generated AS (SELECT gs n, md5('v533-worker-' || gs::text)::uuid worker_id FROM generate_series(1, $1::int) gs),
      skills AS (SELECT id, name FROM "Skill" WHERE name IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical'))
      INSERT INTO "WorkerSkill" ("workerId", "skillId", "experienceYears", "skillLevel", verified)
      SELECT g.worker_id, s.id, (3 + g.n % 10)::numeric,
        (CASE WHEN g.n % 7 = 0 THEN 'EXPERT' WHEN g.n % 3 = 0 THEN 'ADVANCED' ELSE 'INTERMEDIATE' END)::"SkillLevel", g.n % 5 = 0
      FROM generated g CROSS JOIN skills s WHERE g.n % 10 < 7 AND (g.n % 4 <> 0 OR s.name = 'Electrical Wiring')
    `, [size]);

    await client.query(`
      WITH generated AS (SELECT gs n, md5('v533-worker-' || gs::text)::uuid worker_id FROM generate_series(1, $1::int) gs),
      languages AS (SELECT id, name FROM "Language" WHERE name IN ('Tamil', 'English'))
      INSERT INTO "WorkerLanguage" ("workerId", "languageId", proficiency)
      SELECT g.worker_id, l.id, 'BASIC'::"LanguageLevel"
      FROM generated g CROSS JOIN languages l WHERE g.n % 10 < 7 AND (g.n % 6 <> 0 OR l.name = 'Tamil')
    `, [size]);

    await client.query('COMMIT');
    for (const table of ['"Worker"', '"WorkerSkill"', '"WorkerLanguage"', '"WorkerAddress"', 'worker_work_preferences']) await client.query(`ANALYZE ${table}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

const skillIdsSql = `SELECT id FROM "Skill" WHERE name IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical')`;
const languagePredicate = `(l.name ILIKE '%Tamil%' OR l.name ILIKE '%English%')`;
const geo = `EXISTS (SELECT 1 FROM "WorkerAddress" wa WHERE wa."workerId" = w.id AND wa."isCurrent" = true AND wa.latitude IS NOT NULL AND wa.longitude IS NOT NULL
  AND wa.latitude BETWEEN (13.0827 - 25.0 / 111.32) AND (13.0827 + 25.0 / 111.32)
  AND wa.longitude BETWEEN (80.2707 - 25.0 / (111.32 * cos(radians(13.0827)))) AND (80.2707 + 25.0 / (111.32 * cos(radians(13.0827))))
  AND 6371.0 * acos(least(1.0, greatest(-1.0, cos(radians(13.0827)) * cos(radians(wa.latitude::double precision)) * cos(radians(wa.longitude::double precision) - radians(80.2707)) + sin(radians(13.0827)) * sin(radians(wa.latitude::double precision))))) <= 25)`;

const currentSql = `
WITH worker_base AS (
  SELECT w.id FROM "Worker" w JOIN "User" u ON u.id = w."userId"
  WHERE w."workerCode" LIKE '${PREFIX}%' AND w.profession ILIKE '%Electrician%' AND w."experienceYears" >= 5 AND w."availabilityStatus" = 'AVAILABLE' AND ${geo}
),
skill_matches AS (
  SELECT ws."workerId", count(DISTINCT ws."skillId")::int matched
  FROM "WorkerSkill" ws JOIN worker_base wb ON wb.id = ws."workerId"
  WHERE ws."skillId" IN (${skillIdsSql}) GROUP BY ws."workerId"
),
language_matches AS (
  SELECT wl."workerId", count(DISTINCT l.id)::int matched
  FROM "WorkerLanguage" wl JOIN worker_base wb ON wb.id = wl."workerId" JOIN "Language" l ON l.id = wl."languageId"
  WHERE ${languagePredicate} GROUP BY wl."workerId"
)
SELECT w.id, COALESCE(sm.matched,0) skill_matches, COALESCE(lm.matched,0) language_matches
FROM "Worker" w JOIN worker_base wb ON wb.id=w.id LEFT JOIN skill_matches sm ON sm."workerId"=w.id LEFT JOIN language_matches lm ON lm."workerId"=w.id
WHERE COALESCE(lm.matched,0)=2
ORDER BY COALESCE(sm.matched,0) DESC, w."experienceYears" DESC LIMIT 50`;

const scalarSql = `
WITH worker_base AS (
  SELECT w.id FROM "Worker" w JOIN "User" u ON u.id = w."userId"
  WHERE w."workerCode" LIKE '${PREFIX}%' AND w.profession ILIKE '%Electrician%' AND w."experienceYears" >= 5 AND w."availabilityStatus" = 'AVAILABLE' AND ${geo}
),
metrics AS (
  SELECT wb.id,
    (SELECT count(*)::int FROM "WorkerSkill" ws WHERE ws."workerId"=wb.id AND ws."skillId" IN (${skillIdsSql})) skill_matches,
    (SELECT count(DISTINCT l.id)::int FROM "WorkerLanguage" wl JOIN "Language" l ON l.id=wl."languageId" WHERE wl."workerId"=wb.id AND ${languagePredicate}) language_matches
  FROM worker_base wb
)
SELECT w.id, m.skill_matches, m.language_matches
FROM metrics m JOIN "Worker" w ON w.id=m.id
WHERE m.language_matches=2
ORDER BY m.skill_matches DESC, w."experienceYears" DESC LIMIT 50`;

const candidateSql = `
WITH worker_base AS (
  SELECT w.id, w."experienceYears" FROM "Worker" w JOIN "User" u ON u.id = w."userId"
  WHERE w."workerCode" LIKE '${PREFIX}%' AND w.profession ILIKE '%Electrician%' AND w."experienceYears" >= 5 AND w."availabilityStatus" = 'AVAILABLE' AND ${geo}
),
ranked AS (
  SELECT wb.id,
    (SELECT count(*)::int FROM "WorkerSkill" ws WHERE ws."workerId"=wb.id AND ws."skillId" IN (${skillIdsSql})) skill_matches,
    (SELECT count(DISTINCT l.id)::int FROM "WorkerLanguage" wl JOIN "Language" l ON l.id=wl."languageId" WHERE wl."workerId"=wb.id AND ${languagePredicate}) language_matches,
    wb."experienceYears"
  FROM worker_base wb
),
selected AS (
  SELECT id, skill_matches, language_matches FROM ranked WHERE language_matches=2 ORDER BY skill_matches DESC, "experienceYears" DESC, id LIMIT 50
)
SELECT * FROM selected`;

async function explain(client: any, sql: string): Promise<Sample> {
  const start = process.hrtime.bigint();
  const result = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
  const wall = Number(process.hrtime.bigint() - start) / 1e6;
  const plan = result.rows[0]['QUERY PLAN'][0];
  return { ms: wall, planningMs: plan['Planning Time'], executionMs: plan['Execution Time'], hit: plan['Plan']['Shared Hit Blocks'] ?? 0, read: plan['Plan']['Shared Read Blocks'] ?? 0 };
}

async function runStrategy(client: any, name: string, sql: string) {
  for (let i = 0; i < WARMUP; i++) await explain(client, sql);
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) samples.push(await explain(client, sql));
  const times = samples.map((s) => s.ms);
  console.log(JSON.stringify({ strategy: name, datasetWorkers: DATASET, samples: ITERATIONS, p50Ms: percentile(times,50), p95Ms: percentile(times,95), p99Ms: percentile(times,99), minMs: Math.min(...times), maxMs: Math.max(...times), planningMs: samples[0].planningMs, executionMs: percentile(samples.map(s=>s.executionMs),50), sharedHitBlocks: samples[0].hit, sharedReadBlocks: samples[0].read }));
}

async function main() {
  const client = await pool.connect();
  try {
    console.log(`V5.3.3 query strategy benchmark: ${DATASET} workers; ${ITERATIONS} samples; ${WARMUP} warmups`);
    await seed(client, DATASET);
    await runStrategy(client, 'current-aggregate-joins', currentSql);
    await runStrategy(client, 'scalar-candidate-metrics', scalarSql);
    await runStrategy(client, 'ranked-candidate-ids', candidateSql);
  } finally {
    await cleanup(client);
    client.release();
    await pool.end();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
