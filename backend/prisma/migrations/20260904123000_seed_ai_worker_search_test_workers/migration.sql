-- Test-only worker dataset for validating AI worker search end-to-end.
-- Safe to re-run: workerCode/phone/email are checked before insert.

DO $$
DECLARE
  i INTEGER;
  worker_id UUID;
  user_id UUID;
  lang_tamil UUID;
  lang_english UUID;
  lang_hindi UUID;
  profession_name TEXT;
  category_name TEXT;
  city_name TEXT;
  district_name TEXT;
  state_name TEXT := 'Tamil Nadu';
  pin_code TEXT;
  experience NUMERIC;
  availability_value TEXT;
  verification_value TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  SELECT "id" INTO lang_tamil FROM "Language" WHERE LOWER("name") = 'tamil' LIMIT 1;
  SELECT "id" INTO lang_english FROM "Language" WHERE LOWER("name") = 'english' LIMIT 1;
  SELECT "id" INTO lang_hindi FROM "Language" WHERE LOWER("name") = 'hindi' LIMIT 1;

  IF lang_tamil IS NULL OR lang_english IS NULL OR lang_hindi IS NULL THEN
    RAISE EXCEPTION 'Required test languages Tamil, English and Hindi are missing';
  END IF;

  FOR i IN 1..50 LOOP
    worker_id := gen_random_uuid();
    user_id := gen_random_uuid();

    -- First 20 workers are strong matches for:
    -- "electricians in Chennai with at least 3 years, Tamil, immediately available"
    IF i <= 20 THEN
      profession_name := 'Electrician';
      category_name := 'Construction';
      city_name := 'Chennai';
      district_name := 'Chennai';
      pin_code := CASE WHEN i % 2 = 0 THEN '600001' ELSE '600017' END;
      experience := 3 + (i % 10);
      availability_value := 'IMMEDIATE';
      verification_value := CASE WHEN i % 3 = 0 THEN 'VERIFIED' ELSE 'PENDING' END;
      first_name := CASE i
        WHEN 1 THEN 'Arun' WHEN 2 THEN 'Bala' WHEN 3 THEN 'Karthik' WHEN 4 THEN 'Dinesh'
        WHEN 5 THEN 'Gokul' WHEN 6 THEN 'Hari' WHEN 7 THEN 'Jeeva' WHEN 8 THEN 'Kannan'
        WHEN 9 THEN 'Manoj' WHEN 10 THEN 'Muthu' WHEN 11 THEN 'Naveen' WHEN 12 THEN 'Prakash'
        WHEN 13 THEN 'Ramesh' WHEN 14 THEN 'Sanjay' WHEN 15 THEN 'Saravanan' WHEN 16 THEN 'Sathish'
        WHEN 17 THEN 'Senthil' WHEN 18 THEN 'Surya' WHEN 19 THEN 'Vignesh' ELSE 'Vijay' END;
      last_name := 'Kumar';
    ELSE
      -- Remaining 30 records intentionally vary profession/location/experience/
      -- availability/language so ranking and filtering can be tested.
      CASE ((i - 21) % 6)
        WHEN 0 THEN profession_name := 'Plumber'; category_name := 'Construction';
        WHEN 1 THEN profession_name := 'Carpenter'; category_name := 'Construction';
        WHEN 2 THEN profession_name := 'Painter'; category_name := 'Construction';
        WHEN 3 THEN profession_name := 'Mason'; category_name := 'Construction';
        WHEN 4 THEN profession_name := 'Delivery Driver'; category_name := 'Driving';
        ELSE profession_name := 'Security Guard'; category_name := 'Security Services';
      END CASE;

      CASE ((i - 21) % 4)
        WHEN 0 THEN city_name := 'Chennai'; district_name := 'Chennai'; pin_code := '600001';
        WHEN 1 THEN city_name := 'Thanjavur'; district_name := 'Thanjavur'; pin_code := '613001';
        WHEN 2 THEN city_name := 'Kumbakonam'; district_name := 'Thanjavur'; pin_code := '612001';
        ELSE city_name := 'Trichy'; district_name := 'Tiruchirappalli'; pin_code := '620001';
      END CASE;

      experience := 1 + (i % 8);
      availability_value := CASE (i % 4)
        WHEN 0 THEN 'IMMEDIATE'
        WHEN 1 THEN 'AVAILABLE'
        WHEN 2 THEN 'WITHIN_7_DAYS'
        ELSE 'WITHIN_15_DAYS'
      END;
      verification_value := CASE WHEN i % 4 = 0 THEN 'VERIFIED' ELSE 'PENDING' END;
      first_name := 'TestWorker' || i;
      last_name := 'Labour';
    END IF;

    -- Avoid duplicates if this migration is manually re-applied.
    IF EXISTS (SELECT 1 FROM "Worker" WHERE "workerCode" = 'AI-TEST-' || LPAD(i::TEXT, 4, '0')) THEN
      CONTINUE;
    END IF;

    INSERT INTO "User" (
      "id", "phone", "email", "firstName", "lastName", "status", "createdAt", "updatedAt"
    ) VALUES (
      user_id,
      '90000' || LPAD(i::TEXT, 5, '0'),
      'ai-test-worker-' || i || '@example.com',
      first_name,
      last_name,
      'ACTIVE',
      NOW(),
      NOW()
    );

    INSERT INTO "Worker" (
      "id", "userId", "workerCode", "experienceYears", "professionCategory", "profession",
      "profileCompletion", "verificationStatus", "verificationScore", "availabilityStatus",
      "createdAt", "updatedAt"
    ) VALUES (
      worker_id,
      user_id,
      'AI-TEST-' || LPAD(i::TEXT, 4, '0'),
      experience,
      category_name,
      profession_name,
      80,
      verification_value,
      CASE WHEN verification_value = 'VERIFIED' THEN 85 + (i % 15) ELSE NULL END,
      availability_value,
      NOW(),
      NOW()
    );

    INSERT INTO "WorkerAddress" (
      "id", "workerId", "type", "addressLine1", "city", "district", "state", "pincode", "isCurrent", "createdAt"
    ) VALUES (
      gen_random_uuid(),
      worker_id,
      'CURRENT',
      'AI Test Address ' || i,
      city_name,
      district_name,
      state_name,
      pin_code,
      TRUE,
      NOW()
    );

    -- All workers speak Tamil. Add English to every second worker and Hindi to every fifth.
    INSERT INTO "WorkerLanguage" ("workerId", "languageId", "proficiency")
    VALUES (worker_id, lang_tamil, 'FLUENT');

    IF i % 2 = 0 THEN
      INSERT INTO "WorkerLanguage" ("workerId", "languageId", "proficiency")
      VALUES (worker_id, lang_english, 'FLUENT');
    END IF;

    IF i % 5 = 0 THEN
      INSERT INTO "WorkerLanguage" ("workerId", "languageId", "proficiency")
      VALUES (worker_id, lang_hindi, 'BASIC');
    END IF;

    INSERT INTO "WorkerWorkPreference" (
      "id", "workerId", "mobility", "willingToRelocate", "willingToTravel", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      worker_id,
      CASE WHEN i % 5 = 0 THEN 'ANYWHERE_INDIA' ELSE 'LOCAL' END,
      CASE WHEN i % 3 = 0 THEN TRUE ELSE FALSE END,
      CASE WHEN i % 4 = 0 THEN TRUE ELSE FALSE END,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;

-- Make the seeded dataset easy to identify and validate.
COMMENT ON TABLE "Worker" IS 'Worker records. AI-TEST-* workerCode values are development/test fixtures.';
