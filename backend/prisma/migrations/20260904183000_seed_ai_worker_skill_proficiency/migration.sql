-- Seed realistic skill experience, proficiency and verification metadata for AI test workers.
-- Only AI-TEST-* fixtures are modified.

UPDATE "WorkerSkill" ws
SET
  "experienceYears" = CASE
    WHEN w."workerCode" = 'AI-TEST-0018' THEN 11
    WHEN w."workerCode" = 'AI-TEST-0012' THEN 5
    WHEN w."workerCode" = 'AI-TEST-0006' THEN 9
    ELSE GREATEST(1, COALESCE(w."experienceYears", 1) - CASE WHEN ws."skillId" = (SELECT "id" FROM "Skill" WHERE "name" = 'Industrial Electrical' LIMIT 1) THEN 2 ELSE 0 END)
  END,
  "skillLevel" = CASE
    WHEN w."workerCode" = 'AI-TEST-0018' THEN 'EXPERT'::"SkillLevel"
    WHEN w."workerCode" IN ('AI-TEST-0012', 'AI-TEST-0006') THEN 'ADVANCED'::"SkillLevel"
    WHEN w."workerCode" IN ('AI-TEST-0016', 'AI-TEST-0004') THEN 'INTERMEDIATE'::"SkillLevel"
    ELSE 'BEGINNER'::"SkillLevel"
  END,
  "verified" = CASE
    WHEN w."workerCode" IN ('AI-TEST-0018', 'AI-TEST-0012', 'AI-TEST-0006') THEN TRUE
    WHEN w."workerCode" IN ('AI-TEST-0016', 'AI-TEST-0004') THEN FALSE
    ELSE ws."verified"
  END
FROM "Worker" w
WHERE ws."workerId" = w."id"
  AND w."workerCode" LIKE 'AI-TEST-%';
