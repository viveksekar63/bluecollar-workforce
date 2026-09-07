ALTER TABLE "job_worker_actions"
  ADD COLUMN "response_status" TEXT,
  ADD COLUMN "responded_at" TIMESTAMP(3);

ALTER TABLE "job_worker_actions"
  ADD CONSTRAINT "job_worker_actions_response_status_check"
  CHECK ("response_status" IS NULL OR "response_status" IN ('PENDING', 'ACCEPTED', 'DECLINED'));

CREATE INDEX "job_worker_actions_worker_response_idx"
  ON "job_worker_actions"("worker_id", "action_type", "response_status");
