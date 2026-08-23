ALTER TABLE "Worker"
  ADD COLUMN "professionCategory" TEXT,
  ADD COLUMN "profession" TEXT;

CREATE INDEX "Worker_professionCategory_idx" ON "Worker"("professionCategory");
CREATE INDEX "Worker_profession_idx" ON "Worker"("profession");
