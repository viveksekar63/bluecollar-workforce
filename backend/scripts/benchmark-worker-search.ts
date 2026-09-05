import 'dotenv/config';
import { Pool } from 'pg';

const ITERATIONS = Number(process.env.BENCHMARK_ITERATIONS ?? 20);
const WARMUP = Number(process.env.BENCHMARK_WARMUP ?? 5);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const scenarios = [
  {
    name: 'profession',
    sql: `
      SELECT count(*)
      FROM "Worker" w
      WHERE w."profession" ILIKE '%Electrician%'
    `,
  },
  {
    name: 'profession + experience + availability',
    sql: `
      SELECT count(*)
      FROM "Worker" w
      WHERE w."profession" ILIKE '%Electrician%'
        AND w."experienceYears" >= 5
        AND w."availabilityStatus" = 'AVAILABLE'
    `,
  },
  {
    name: 'profession + skills',
    sql: `
      SELECT count(*)
      FROM "Worker" w
      WHERE w."profession" ILIKE '%Electrician%'
        AND EXISTS (
          SELECT 1
          FROM "WorkerSkill" ws
          JOIN "Skill" s ON s."id" = ws."skillId"
          WHERE ws."workerId" = w."id"
            AND s."name" IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical')
        )
    `,
  },
  {
    name: 'profession + skills + languages',
    sql: `
      SELECT count(*)
      FROM "Worker" w
      WHERE w."profession" ILIKE '%Electrician%'
        AND EXISTS (
          SELECT 1
          FROM "WorkerSkill" ws
          JOIN "Skill" s ON s."id" = ws."skillId"
          WHERE ws."workerId" = w."id"
            AND s."name" IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical')
        )
        AND (
          SELECT count(DISTINCT l."id")
          FROM "WorkerLanguage" wl
          JOIN "Language" l ON l."id" = wl."languageId"
          WHERE wl."workerId" = w."id"
            AND l."name" IN ('Tamil', 'English')
        ) = 2
    `,
  },
  {
    name: 'profession + geo radius (Chennai 25km)',
    sql: `
      SELECT count(*)
      FROM "Worker" w
      WHERE w."profession" ILIKE '%Electrician%'
        AND EXISTS (
          SELECT 1
          FROM "WorkerAddress" wa
          WHERE wa."workerId" = w."id"
            AND wa."isCurrent" = true
            AND wa."latitude" IS NOT NULL
            AND wa."longitude" IS NOT NULL
            AND wa."latitude" BETWEEN (13.0827 - 25.0 / 111.32)
                                   AND (13.0827 + 25.0 / 111.32)
            AND wa."longitude" BETWEEN (80.2707 - 25.0 / (111.32 * cos(radians(13.0827))))
                                    AND (80.2707 + 25.0 / (111.32 * cos(radians(13.0827))))
            AND (
              6371.0 * acos(least(1.0, greatest(-1.0,
                cos(radians(13.0827)) * cos(radians(wa."latitude"::double precision)) *
                cos(radians(wa."longitude"::double precision) - radians(80.2707)) +
                sin(radians(13.0827)) * sin(radians(wa."latitude"::double precision))
              )))
            ) <= 25
        )
    `,
  },
];

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function explain(sql: string) {
  const result = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`);
  const plan = result.rows[0]['QUERY PLAN'][0];
  return {
    executionMs: Number(plan['Execution Time'] ?? 0),
    planningMs: Number(plan['Planning Time'] ?? 0),
    plan,
  };
}

async function run() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  console.log(`Worker search DB benchmark: ${ITERATIONS} samples, ${WARMUP} warmups`);
  console.log('Run against a representative dataset (1K / 10K / 50K / 100K workers) for comparable results.');

  for (const scenario of scenarios) {
    for (let i = 0; i < WARMUP; i++) await explain(scenario.sql);

    const samples: number[] = [];
    let lastPlan: any = null;
    for (let i = 0; i < ITERATIONS; i++) {
      const result = await explain(scenario.sql);
      samples.push(result.executionMs);
      lastPlan = result.plan;
    }

    console.log(JSON.stringify({
      scenario: scenario.name,
      samples: samples.length,
      p50Ms: Number(percentile(samples, 50).toFixed(3)),
      p95Ms: Number(percentile(samples, 95).toFixed(3)),
      p99Ms: Number(percentile(samples, 99).toFixed(3)),
      minMs: Number(Math.min(...samples).toFixed(3)),
      maxMs: Number(Math.max(...samples).toFixed(3)),
      planningMs: Number((lastPlan?.['Planning Time'] ?? 0).toFixed(3)),
      executionMs: Number((lastPlan?.['Execution Time'] ?? 0).toFixed(3)),
      sharedHitBlocks: lastPlan?.['Plan']?.['Shared Hit Blocks'] ?? null,
      sharedReadBlocks: lastPlan?.['Plan']?.['Shared Read Blocks'] ?? null,
    }));
  }
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
