ALTER TABLE "job_ai_requirements"
  ADD COLUMN "profession" TEXT,
  ADD COLUMN "professionCategory" TEXT;

CREATE INDEX "job_ai_requirements_profession_idx"
  ON "job_ai_requirements"("profession");
