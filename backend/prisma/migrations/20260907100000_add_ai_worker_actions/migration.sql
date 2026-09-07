CREATE TABLE "job_worker_actions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "employer_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "match_score" INTEGER,
  "match_tier" TEXT,
  "match_explanation" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "invited_at" TIMESTAMP(3),
  CONSTRAINT "job_worker_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_worker_actions_action_type_check" CHECK ("action_type" IN ('SHORTLISTED', 'INVITED')),
  CONSTRAINT "job_worker_actions_employer_fk" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_actions_job_fk" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_actions_worker_fk" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "job_worker_actions_job_worker_action_key"
  ON "job_worker_actions"("job_id", "worker_id", "action_type");
CREATE INDEX "job_worker_actions_employer_created_idx"
  ON "job_worker_actions"("employer_id", "created_at");
CREATE INDEX "job_worker_actions_job_action_idx"
  ON "job_worker_actions"("job_id", "action_type", "created_at");
CREATE INDEX "job_worker_actions_worker_action_idx"
  ON "job_worker_actions"("worker_id", "action_type");
