-- Worker search filters are dominated by profession, experience, availability
-- and verification. Keep these indexes narrow so normal writes remain cheap.
CREATE INDEX IF NOT EXISTS "Worker_experience_years_idx"
ON "Worker" ("experienceYears");

CREATE INDEX IF NOT EXISTS "Worker_availability_status_idx"
ON "Worker" ("availabilityStatus");

CREATE INDEX IF NOT EXISTS "Worker_verification_status_idx"
ON "Worker" ("verificationStatus");

-- The existing primary key on WorkerSkill is (workerId, skillId), while
-- skill-filtered discovery starts from skillId in several query paths.
-- The skillId index already exists in the Prisma schema; keep this migration
-- focused on missing search-path indexes.

-- Current-address lookups are repeatedly scoped by workerId + isCurrent.
CREATE INDEX IF NOT EXISTS "WorkerAddress_current_worker_idx"
ON "WorkerAddress" ("workerId")
WHERE "isCurrent" = true;

-- Language filtering joins from WorkerLanguage by workerId and languageId.
-- The composite primary key covers that access path; languageId already has
-- its own Prisma index.

-- Preference ranking/filtering commonly joins by workerId and reads mobility.
CREATE INDEX IF NOT EXISTS "worker_work_preferences_worker_mobility_idx"
ON "worker_work_preferences" ("workerId", "mobility");

-- Preferred-location matching is already covered by (city, state) and workerId
-- indexes in Prisma. No redundant duplicate index is added here.

-- The service uses ILIKE '%term%' for profession/category and free-text search.
-- pg_trgm makes those predicates indexable without changing application semantics.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Worker_profession_trgm_idx"
ON "Worker" USING GIN ("profession" gin_trgm_ops)
WHERE "profession" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Worker_profession_category_trgm_idx"
ON "Worker" USING GIN ("professionCategory" gin_trgm_ops)
WHERE "professionCategory" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "WorkerAddress_city_trgm_idx"
ON "WorkerAddress" USING GIN ("city" gin_trgm_ops)
WHERE "isCurrent" = true;

CREATE INDEX IF NOT EXISTS "WorkerAddress_district_trgm_idx"
ON "WorkerAddress" USING GIN ("district" gin_trgm_ops)
WHERE "isCurrent" = true AND "district" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "WorkerAddress_state_trgm_idx"
ON "WorkerAddress" USING GIN ("state" gin_trgm_ops)
WHERE "isCurrent" = true;

-- Preferred locations are queried with ILIKE as well. These indexes are
-- intentionally separate because the service can search city/district/state.
CREATE INDEX IF NOT EXISTS "worker_preferred_locations_city_trgm_idx"
ON "worker_preferred_locations" USING GIN ("city" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "worker_preferred_locations_district_trgm_idx"
ON "worker_preferred_locations" USING GIN ("district" gin_trgm_ops)
WHERE "district" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "worker_preferred_locations_state_trgm_idx"
ON "worker_preferred_locations" USING GIN ("state" gin_trgm_ops);
