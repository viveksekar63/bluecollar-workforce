CREATE TABLE "job_worker_outreach" (
  "id" TEXT NOT NULL,
  "employer_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_CONTACTED',
  "preferred_channel" TEXT,
  "last_channel" TEXT,
  "contact_attempts" INTEGER NOT NULL DEFAULT 0,
  "last_contacted_at" TIMESTAMP(3),
  "next_follow_up_at" TIMESTAMP(3),
  "outcome" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_worker_outreach_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_worker_outreach_status_check" CHECK ("status" IN ('NOT_CONTACTED','CONTACTED','NO_RESPONSE','INTERESTED','INTERVIEW','SELECTED','HIRED','NOT_INTERESTED','UNAVAILABLE','WRONG_NUMBER')),
  CONSTRAINT "job_worker_outreach_channel_check" CHECK ("preferred_channel" IS NULL OR "preferred_channel" IN ('PHONE','WHATSAPP','SMS','EMAIL')),
  CONSTRAINT "job_worker_outreach_last_channel_check" CHECK ("last_channel" IS NULL OR "last_channel" IN ('PHONE','WHATSAPP','SMS','EMAIL')),
  CONSTRAINT "job_worker_outreach_employer_fk" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_outreach_job_fk" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_outreach_worker_fk" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "job_worker_outreach_job_worker_key"
  ON "job_worker_outreach"("job_id", "worker_id");
CREATE INDEX "job_worker_outreach_employer_job_status_idx"
  ON "job_worker_outreach"("employer_id", "job_id", "status");
CREATE INDEX "job_worker_outreach_follow_up_idx"
  ON "job_worker_outreach"("employer_id", "next_follow_up_at");

CREATE TABLE "job_worker_outreach_events" (
  "id" TEXT NOT NULL,
  "outreach_id" TEXT NOT NULL,
  "employer_id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "outcome" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_worker_outreach_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_worker_outreach_events_channel_check" CHECK ("channel" IN ('PHONE','WHATSAPP','SMS','EMAIL')),
  CONSTRAINT "job_worker_outreach_events_outreach_fk" FOREIGN KEY ("outreach_id") REFERENCES "job_worker_outreach"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_outreach_events_employer_fk" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_outreach_events_job_fk" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_worker_outreach_events_worker_fk" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "job_worker_outreach_events_outreach_created_idx"
  ON "job_worker_outreach_events"("outreach_id", "created_at");
CREATE INDEX "job_worker_outreach_events_employer_job_created_idx"
  ON "job_worker_outreach_events"("employer_id", "job_id", "created_at");
