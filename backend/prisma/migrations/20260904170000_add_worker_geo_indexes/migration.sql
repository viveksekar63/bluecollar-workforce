-- Radius matching uses worker address coordinates. Keep a partial composite index
-- so rows without coordinates do not bloat the index.
CREATE INDEX IF NOT EXISTS "WorkerAddress_current_geo_idx"
ON "WorkerAddress" ("latitude", "longitude")
WHERE "isCurrent" = true
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL;
