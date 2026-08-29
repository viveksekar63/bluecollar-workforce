CREATE TABLE "employer_worker_shortlists" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "workerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employer_worker_shortlists_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employer_worker_shortlists_employerId_workerId_key" UNIQUE ("employerId", "workerId"),
  CONSTRAINT "employer_worker_shortlists_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "employers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employer_worker_shortlists_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "employer_worker_shortlists_employerId_createdAt_idx" ON "employer_worker_shortlists"("employerId", "createdAt");
CREATE INDEX "employer_worker_shortlists_workerId_idx" ON "employer_worker_shortlists"("workerId");
