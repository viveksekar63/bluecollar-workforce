CREATE TABLE "worker_work_preferences" (
  "id" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "mobility" TEXT NOT NULL DEFAULT 'LOCAL',
  "willingToRelocate" BOOLEAN NOT NULL DEFAULT false,
  "willingToTravel" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worker_work_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "worker_work_preferences_workerId_key" UNIQUE ("workerId"),
  CONSTRAINT "worker_work_preferences_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "worker_work_preferences_mobility_check" CHECK ("mobility" IN ('LOCAL','WITHIN_RADIUS','WITHIN_STATE','SPECIFIC_LOCATIONS','ANYWHERE_INDIA'))
);

CREATE INDEX "worker_work_preferences_mobility_idx" ON "worker_work_preferences"("mobility");

CREATE TABLE "worker_preferred_locations" (
  "id" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "state" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'India',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worker_preferred_locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "worker_preferred_locations_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "worker_preferred_locations_workerId_idx" ON "worker_preferred_locations"("workerId");
CREATE INDEX "worker_preferred_locations_city_state_idx" ON "worker_preferred_locations"("city", "state");
CREATE UNIQUE INDEX "worker_preferred_locations_worker_city_state_key" ON "worker_preferred_locations"("workerId", "city", "state");
