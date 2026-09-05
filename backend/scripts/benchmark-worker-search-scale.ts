import 'dotenv/config';
import { Pool } from 'pg';

const DATASET_SIZES = (process.env.BENCHMARK_DATASETS ?? '1000,10000,50000,100000')
  .split(',')
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);
const ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS ?? 20);
const WARMUP = Number(process.env.BENCHMARK_WARMUP ?? 5);
const PLAN_DATASET = Number(process.env.BENCHMARK_PLAN_DATASET ?? 0);
const PREFIX = 'PERF-TEST-';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type Sample = { executionMs: number; planningMs: number; sharedHitBlocks: number; sharedReadBlocks: number };

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function cleanup(client: any) {
  await client.query('BEGIN');
  try {
    await client.query(`DELETE FROM "WorkerLanguage" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM "WorkerSkill" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM "WorkerAddress" WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM worker_work_preferences WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM worker_preferred_locations WHERE "workerId" IN (SELECT id FROM "Worker" WHERE "workerCode" LIKE $1)`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM "Worker" WHERE "workerCode" LIKE $1`, [`${PREFIX}%`]);
    await client.query(`DELETE FROM "User" WHERE "email" LIKE $1`, [`perf-test-worker-%@example.com`]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}

async function seed(client: any, size: number) {
  await cleanup(client);
  await client.query('BEGIN');
  try {
    await client.query(`WITH generated AS (SELECT gs AS n, md5('perf-user-' || gs::text)::uuid AS user_id, md5('perf-worker-' || gs::text)::uuid AS worker_id FROM generate_series(1, $1::int) gs)
      INSERT INTO "User" (id, phone, email, "firstName", "lastName", status, "createdAt", "updatedAt")
      SELECT user_id, '919900' || lpad(n::text, 6, '0'), 'perf-test-worker-' || n::text || '@example.com', 'Perf' || n::text, 'Worker', 'ACTIVE'::"UserStatus", now(), now() FROM generated`, [size]);
    await client.query(`WITH generated AS (SELECT gs AS n, md5('perf-user-' || gs::text)::uuid AS user_id, md5('perf-worker-' || gs::text)::uuid AS worker_id, CASE WHEN gs % 10 < 7 THEN 'Electrician' WHEN gs % 10 < 9 THEN 'Plumber' ELSE 'Carpenter' END AS profession FROM generate_series(1, $1::int) gs)
      INSERT INTO "Worker" (id, "userId", "workerCode", bio, "experienceYears", "professionCategory", profession, "profileCompletion", "verificationStatus", "verificationScore", "availabilityStatus", "createdAt", "updatedAt")
      SELECT worker_id, user_id, $2 || lpad(n::text, 7, '0'), 'Scale benchmark worker', (3 + (n % 10))::numeric, 'Electrical', profession, 100, (CASE WHEN n % 5 = 0 THEN 'VERIFIED' ELSE 'PENDING' END)::"VerificationStatus", CASE WHEN n % 5 = 0 THEN 90 ELSE 50 END, (CASE WHEN n % 6 = 0 THEN 'WORKING' ELSE 'AVAILABLE' END)::"AvailabilityStatus", now(), now() FROM generated`, [size, PREFIX]);
    await client.query(`WITH generated AS (SELECT md5('perf-worker-' || gs::text)::uuid AS worker_id, gs AS n FROM generate_series(1, $1::int) gs)
      INSERT INTO "WorkerAddress" (id, "workerId", type, "addressLine1", city, district, state, pincode, latitude, longitude, "isCurrent", "createdAt")
      SELECT md5('perf-address-' || n::text)::uuid, worker_id, 'CURRENT'::"AddressType", 'Benchmark Address', CASE WHEN n % 10 < 7 THEN 'Chennai' ELSE 'Coimbatore' END, CASE WHEN n % 10 < 7 THEN 'Chennai' ELSE 'Coimbatore' END, 'Tamil Nadu', '600001', CASE WHEN n % 10 < 7 THEN 13.0827 + (((n % 200) - 100) * 0.001) ELSE 11.0168 + (((n % 100) - 50) * 0.001) END, CASE WHEN n % 10 < 7 THEN 80.2707 + (((n % 200) - 100) * 0.001) ELSE 76.9558 + (((n % 100) - 50) * 0.001) END, true, now() FROM generated`, [size]);
    await client.query(`WITH generated AS (SELECT md5('perf-worker-' || gs::text)::uuid AS worker_id, gs AS n FROM generate_series(1, $1::int) gs)
      INSERT INTO worker_work_preferences (id, "workerId", mobility, "willingToRelocate", "willingToTravel", "createdAt", "updatedAt")
      SELECT md5('perf-pref-' || n::text)::uuid, worker_id, CASE WHEN n % 5 = 0 THEN 'ANYWHERE_INDIA' ELSE 'LOCAL' END, n % 3 = 0, n % 4 = 0, now(), now() FROM generated`, [size]);
    await client.query(`WITH generated AS (SELECT md5('perf-worker-' || gs::text)::uuid AS worker_id, gs AS n FROM generate_series(1, $1::int) gs), skills AS (SELECT id, name FROM "Skill" WHERE name IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical'))
      INSERT INTO "WorkerSkill" ("workerId", "skillId", "experienceYears", "skillLevel", verified)
      SELECT g.worker_id, s.id, (3 + (g.n % 10))::numeric, (CASE WHEN g.n % 7 = 0 THEN 'EXPERT' WHEN g.n % 3 = 0 THEN 'ADVANCED' ELSE 'INTERMEDIATE' END)::"SkillLevel", g.n % 5 = 0 FROM generated g CROSS JOIN skills s WHERE g.n % 10 < 7 AND (g.n % 4 <> 0 OR s.name = 'Electrical Wiring')`, [size]);
    await client.query(`WITH generated AS (SELECT md5('perf-worker-' || gs::text)::uuid AS worker_id, gs AS n FROM generate_series(1, $1::int) gs), languages AS (SELECT id, name FROM "Language" WHERE name IN ('Tamil', 'English'))
      INSERT INTO "WorkerLanguage" ("workerId", "languageId", proficiency)
      SELECT g.worker_id, l.id, 'BASIC'::"LanguageLevel" FROM generated g CROSS JOIN languages l WHERE g.n % 10 < 7 AND (g.n % 6 <> 0 OR l.name = 'Tamil')`, [size]);
    await client.query('COMMIT');
    await client.query('ANALYZE "Worker"'); await client.query('ANALYZE "WorkerSkill"'); await client.query('ANALYZE "WorkerLanguage"'); await client.query('ANALYZE "WorkerAddress"'); await client.query('ANALYZE worker_work_preferences');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}

const productionLikeSql = `
WITH worker_base AS (
  SELECT w.id FROM "Worker" w JOIN "User" u ON u.id = w."userId"
  WHERE w.profession ILIKE '%Electrician%' AND w."experienceYears" >= 5 AND w."availabilityStatus" = 'AVAILABLE'
    AND EXISTS (SELECT 1 FROM "WorkerAddress" wa WHERE wa."workerId" = w.id AND wa."isCurrent" = true AND wa.latitude IS NOT NULL AND wa.longitude IS NOT NULL
      AND wa.latitude BETWEEN (13.0827 - 25.0 / 111.32) AND (13.0827 + 25.0 / 111.32)
      AND wa.longitude BETWEEN (80.2707 - 25.0 / (111.32 * cos(radians(13.0827)))) AND (80.2707 + 25.0 / (111.32 * cos(radians(13.0827))))
      AND 6371.0 * acos(least(1.0, greatest(-1.0, cos(radians(13.0827)) * cos(radians(wa.latitude::double precision)) * cos(radians(wa.longitude::double precision) - radians(80.2707)) + sin(radians(13.0827)) * sin(radians(wa.latitude::double precision))))) <= 25)
),
skill_matches AS (
  SELECT ws."workerId", count(DISTINCT ws."skillId")::int AS "matchedSkillCount" FROM "WorkerSkill" ws JOIN worker_base wb ON wb.id = ws."workerId"
  WHERE ws."skillId" IN (SELECT id FROM "Skill" WHERE name IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical')) GROUP BY ws."workerId"
),
language_matches AS (
  SELECT wl."workerId", count(DISTINCT l.id)::int AS "matchedLanguageCount" FROM "WorkerLanguage" wl JOIN worker_base wb ON wb.id = wl."workerId" JOIN "Language" l ON l.id = wl."languageId"
  WHERE l.name ILIKE '%Tamil%' OR l.name ILIKE '%English%' GROUP BY wl."workerId"
),
candidates AS (
  SELECT w.id, coalesce(sm."matchedSkillCount", 0) AS "matchedSkillCount", coalesce(lm."matchedLanguageCount", 0) AS "matchedLanguageCount",
    (SELECT min(6371.0 * acos(least(1.0, greatest(-1.0, cos(radians(13.0827)) * cos(radians(wa.latitude::double precision)) * cos(radians(wa.longitude::double precision) - radians(80.2707)) + sin(radians(13.0827)) * sin(radians(wa.latitude::double precision)))))) FROM "WorkerAddress" wa WHERE wa."workerId" = w.id AND wa."isCurrent" = true AND wa.latitude IS NOT NULL AND wa.longitude IS NOT NULL) AS "distanceKm"
  FROM worker_base wb JOIN "Worker" w ON w.id = wb.id LEFT JOIN skill_matches sm ON sm."workerId" = w.id LEFT JOIN language_matches lm ON lm."workerId" = w.id
  WHERE coalesce(sm."matchedSkillCount", 0) = 3 AND coalesce(lm."matchedLanguageCount", 0) = 2
)
SELECT id, "matchedSkillCount", "matchedLanguageCount", "distanceKm" FROM candidates ORDER BY "matchedSkillCount" DESC, "distanceKm" ASC, id ASC LIMIT 50
`;

function printPlanNodes(node: any, depth = 0) {
  const indent = ' '.repeat(depth * 2);
  const relation = node['Relation Name'] ? ` relation=${node['Relation Name']}` : '';
  const index = node['Index Name'] ? ` index=${node['Index Name']}` : '';
  const actual = node['Actual Rows'] !== undefined ? ` rows=${node['Actual Rows']}` : '';
  const loops = node['Actual Loops'] !== undefined ? ` loops=${node['Actual Loops']}` : '';
  const time = node['Actual Total Time'] !== undefined ? ` time=${node['Actual Total Time']}ms` : '';
  const buffers = node['Shared Hit Blocks'] !== undefined ? ` hit=${node['Shared Hit Blocks']} read=${node['Shared Read Blocks'] ?? 0}` : '';
  console.log(`${indent}${node['Node Type']}${relation}${index}${actual}${loops}${time}${buffers}`);
  if (node['Plans']) for (const child of node['Plans']) printPlanNodes(child, depth + 1);
}

async function explain(client: any, sql: string, dumpPlan = false): Promise<Sample> {
  const result = await client.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
  const plan = result.rows[0]['QUERY PLAN'][0];
  if (dumpPlan) {
    console.log('\n--- PLAN NODE TREE ---');
    printPlanNodes(plan['Plan']);
    console.log(`Planning Time: ${plan['Planning Time']}ms`);
    console.log(`Execution Time: ${plan['Execution Time']}ms`);
    console.log('--- END PLAN NODE TREE ---\n');
  }
  return { executionMs: Number(plan['Execution Time'] ?? 0), planningMs: Number(plan['Planning Time'] ?? 0), sharedHitBlocks: Number(plan['Plan']?.['Shared Hit Blocks'] ?? 0), sharedReadBlocks: Number(plan['Plan']?.['Shared Read Blocks'] ?? 0) };
}

async function benchmark(client: any, dumpPlan = false) {
  for (let i = 0; i < WARMUP; i++) await explain(client, productionLikeSql);
  const samples: Sample[] = [];
  for (let i = 0; i < ITERATIONS; i++) samples.push(await explain(client, productionLikeSql, dumpPlan && i === 0));
  const execution = samples.map((sample) => sample.executionMs);
  return { samples: execution.length, p50Ms: Number(percentile(execution, 50).toFixed(3)), p95Ms: Number(percentile(execution, 95).toFixed(3)), p99Ms: Number(percentile(execution, 99).toFixed(3)), minMs: Number(Math.min(...execution).toFixed(3)), maxMs: Number(Math.max(...execution).toFixed(3)), planningMs: Number(samples.at(-1)!.planningMs.toFixed(3)), executionMs: Number(samples.at(-1)!.executionMs.toFixed(3)), sharedHitBlocks: samples.at(-1)!.sharedHitBlocks, sharedReadBlocks: samples.at(-1)!.sharedReadBlocks };
}

async function run() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!DATASET_SIZES.length) throw new Error('BENCHMARK_DATASETS must contain at least one positive integer');
  const client = await pool.connect();
  try {
    console.log(`V5.3.2 scale benchmark: ${DATASET_SIZES.join(', ')} workers; ${ITERATIONS} samples; ${WARMUP} warmups`);
    console.log('The benchmark seeds isolated PERF-TEST-* workers, runs ANALYZE, executes production-like skill/language/geo discovery, then cleans them up.');
    if (PLAN_DATASET > 0) console.log(`Plan diagnostics enabled for dataset ${PLAN_DATASET}.`);
    for (const size of DATASET_SIZES) {
      console.log(`\n=== DATASET ${size} WORKERS ===`);
      const started = Date.now(); await seed(client, size); console.log(`seedMs=${Date.now() - started}`);
      console.log(JSON.stringify({ datasetWorkers: size, ...(await benchmark(client, size === PLAN_DATASET)) }));
      await cleanup(client);
    }
  } finally { client.release(); await pool.end(); }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
