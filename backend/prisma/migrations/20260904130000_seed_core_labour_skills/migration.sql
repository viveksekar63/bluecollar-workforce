-- Core skills used by labour worker discovery and AI requirement normalization.
INSERT INTO "Skill" ("id", "name", "category")
VALUES
  (gen_random_uuid(), 'Electrical Wiring', 'Construction'),
  (gen_random_uuid(), 'Panel Installation', 'Construction'),
  (gen_random_uuid(), 'Industrial Electrical', 'Construction'),
  (gen_random_uuid(), 'Plumbing Installation', 'Construction'),
  (gen_random_uuid(), 'Pipe Fitting', 'Construction'),
  (gen_random_uuid(), 'Carpentry', 'Construction'),
  (gen_random_uuid(), 'Welding', 'Construction')
ON CONFLICT ("name") DO NOTHING;

-- Give the first test electricians realistic skill combinations so multi-skill
-- matching can be validated end-to-end without changing production workers.
INSERT INTO "WorkerSkill" ("workerId", "skillId", "experienceYears", "skillLevel", "verified")
SELECT
  w."id",
  s."id",
  w."experienceYears",
  CASE
    WHEN w."experienceYears" >= 8 THEN 'ADVANCED'::"SkillLevel"
    WHEN w."experienceYears" >= 5 THEN 'INTERMEDIATE'::"SkillLevel"
    ELSE 'BEGINNER'::"SkillLevel"
  END,
  w."verificationStatus" = 'VERIFIED'::"VerificationStatus"
FROM "Worker" w
JOIN "Skill" s
  ON s."name" IN (
    CASE
      WHEN CAST(SUBSTRING(w."workerCode" FROM 9) AS INTEGER) % 3 IN (0, 1)
        THEN 'Electrical Wiring'
      ELSE 'Panel Installation'
    END,
    CASE
      WHEN CAST(SUBSTRING(w."workerCode" FROM 9) AS INTEGER) % 2 = 0
        THEN 'Panel Installation'
      ELSE 'Industrial Electrical'
    END
  )
WHERE w."workerCode" LIKE 'AI-TEST-%'
  AND w."profession" = 'Electrician'
ON CONFLICT ("workerId", "skillId") DO NOTHING;

-- Ensure a few test electricians have all three requested skills.
INSERT INTO "WorkerSkill" ("workerId", "skillId", "experienceYears", "skillLevel", "verified")
SELECT
  w."id",
  s."id",
  w."experienceYears",
  'ADVANCED'::"SkillLevel",
  w."verificationStatus" = 'VERIFIED'::"VerificationStatus"
FROM "Worker" w
CROSS JOIN "Skill" s
WHERE w."workerCode" IN ('AI-TEST-0006', 'AI-TEST-0012', 'AI-TEST-0018')
  AND s."name" IN ('Electrical Wiring', 'Panel Installation', 'Industrial Electrical')
  AND w."profession" = 'Electrician'
ON CONFLICT ("workerId", "skillId") DO NOTHING;
