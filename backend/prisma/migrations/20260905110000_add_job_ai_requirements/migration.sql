CREATE TABLE "job_ai_requirements" (
  "jobId" UUID NOT NULL,
  "minimumExperienceYears" DECIMAL(5,2),
  "minimumSkillLevel" TEXT,
  "availability" TEXT,
  "mobility" TEXT,
  "willingToRelocate" BOOLEAN,
  "willingToTravel" BOOLEAN,
  "accommodationAvailable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_ai_requirements_pkey" PRIMARY KEY ("jobId"),
  CONSTRAINT "job_ai_requirements_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_ai_requirements_skill_level_check" CHECK ("minimumSkillLevel" IS NULL OR "minimumSkillLevel" IN ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT')),
  CONSTRAINT "job_ai_requirements_availability_check" CHECK ("availability" IS NULL OR "availability" IN ('IMMEDIATE','AVAILABLE','WORKING','NOT_AVAILABLE')),
  CONSTRAINT "job_ai_requirements_mobility_check" CHECK ("mobility" IS NULL OR "mobility" IN ('LOCAL','WITHIN_CITY','WITHIN_STATE','ANYWHERE_INDIA'))
);

CREATE TABLE "job_ai_requirement_languages" (
  "jobId" UUID NOT NULL,
  "languageId" UUID NOT NULL,
  CONSTRAINT "job_ai_requirement_languages_pkey" PRIMARY KEY ("jobId", "languageId"),
  CONSTRAINT "job_ai_requirement_languages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_ai_requirement_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "job_ai_requirement_languages_languageId_idx" ON "job_ai_requirement_languages"("languageId");
CREATE INDEX "job_ai_requirements_availability_idx" ON "job_ai_requirements"("availability");
CREATE INDEX "job_ai_requirements_skill_level_idx" ON "job_ai_requirements"("minimumSkillLevel");