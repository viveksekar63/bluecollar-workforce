-- Demo workforce data for local/staging validation.
-- Safe to re-run: rows are keyed by deterministic phone/workerCode and skills by name.
-- Do NOT use these synthetic records as production worker data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  r RECORD;
  u_id TEXT;
  w_id TEXT;
  skill_id TEXT;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('9000000001','Arun','Kumar','PAROTA_MASTER','Parota Master','Thanjavur','Thanjavur','Tamil Nadu','613001',6,'MALE','AVAILABLE','VERIFIED'),
      ('9000000002','Ramesh','Raj','TEA_MASTER','Tea Master','Kumbakonam','Thanjavur','Tamil Nadu','612001',5,'MALE','AVAILABLE','VERIFIED'),
      ('9000000003','Suresh','Babu','HOTEL_CHEF','Hotel Chef','Trichy','Tiruchirappalli','Tamil Nadu','620001',8,'MALE','AVAILABLE','VERIFIED'),
      ('9000000004','Meena','Devi','HOUSEKEEPING','Housekeeping Staff','Thanjavur','Thanjavur','Tamil Nadu','613004',3,'FEMALE','AVAILABLE','VERIFIED'),
      ('9000000005','Karthik','M','SECURITY_GUARD','Security Guard','Chennai','Chennai','Tamil Nadu','600001',4,'MALE','AVAILABLE','VERIFIED'),
      ('9000000006','Selvi','R','SALES_EXECUTIVE','Jewellery Sales Executive','Madurai','Madurai','Tamil Nadu','625001',4,'FEMALE','AVAILABLE','VERIFIED'),
      ('9000000007','Bala','Murugan','WAITER','Hotel Waiter','Thanjavur','Thanjavur','Tamil Nadu','613007',2,'MALE','AVAILABLE','VERIFIED'),
      ('9000000008','Priya','S','NURSE_ASSISTANT','Hospital Nurse Assistant','Chennai','Chennai','Tamil Nadu','600010',3,'FEMALE','AVAILABLE','VERIFIED'),
      ('9000000009','Mani','K','DELIVERY_EXECUTIVE','Delivery Executive','Kumbakonam','Thanjavur','Tamil Nadu','612002',2,'MALE','AVAILABLE','VERIFIED'),
      ('9000000010','Lakshmi','P','CLEANER','Cleaner','Mayiladuthurai','Mayiladuthurai','Tamil Nadu','609001',5,'FEMALE','AVAILABLE','VERIFIED'),
      ('9000000011','Vijay','S','ELECTRICIAN','Electrician','Trichy','Tiruchirappalli','Tamil Nadu','620018',7,'MALE','AVAILABLE','VERIFIED'),
      ('9000000012','Deepa','K','RECEPTIONIST','Receptionist','Coimbatore','Coimbatore','Tamil Nadu','641001',3,'FEMALE','AVAILABLE','VERIFIED')
    ) AS x(phone,first_name,last_name,category,profession,city,district,state,pincode,experience,gender,availability,verification)
  LOOP
    INSERT INTO "User" (id, phone, "firstName", "lastName", status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, r.phone, r.first_name, r.last_name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (phone) DO UPDATE SET "firstName"=EXCLUDED."firstName", "lastName"=EXCLUDED."lastName", "updatedAt"=CURRENT_TIMESTAMP
    RETURNING id INTO u_id;

    SELECT id INTO w_id FROM "Worker" WHERE "userId" = u_id LIMIT 1;
    IF w_id IS NULL THEN
      INSERT INTO "Worker" (id, "userId", "workerCode", "experienceYears", gender, "professionCategory", profession, "profileCompletion", "verificationStatus", "availabilityStatus", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, u_id, 'DEMO-' || r.category || '-' || RIGHT(r.phone,4), r.experience, r.gender::"Gender", r.category, r.profession, 95, r.verification::"VerificationStatus", r.availability::"AvailabilityStatus", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id INTO w_id;
    ELSE
      UPDATE "Worker" SET "professionCategory"=r.category, profession=r.profession, "experienceYears"=r.experience, gender=r.gender::"Gender", "verificationStatus"=r.verification::"VerificationStatus", "availabilityStatus"=r.availability::"AvailabilityStatus", "updatedAt"=CURRENT_TIMESTAMP WHERE id=w_id;
    END IF;

    DELETE FROM "WorkerAddress" WHERE "workerId"=w_id;
    INSERT INTO "WorkerAddress" (id, "workerId", type, "addressLine1", city, district, state, pincode, "isCurrent", "createdAt")
    VALUES (gen_random_uuid()::text, w_id, 'CURRENT', 'Demo Address', r.city, r.district, r.state, r.pincode, true, CURRENT_TIMESTAMP);

    INSERT INTO "Skill" (id,name,category,"createdAt") VALUES (gen_random_uuid()::text,r.profession,r.category,CURRENT_TIMESTAMP)
    ON CONFLICT (name) DO NOTHING;
    SELECT id INTO skill_id FROM "Skill" WHERE name=r.profession;
    INSERT INTO "WorkerSkill" ("workerId","skillId","experienceYears","skillLevel",verified)
    VALUES (w_id,skill_id,r.experience,'ADVANCED',true)
    ON CONFLICT ("workerId","skillId") DO UPDATE SET "experienceYears"=EXCLUDED."experienceYears",verified=true;
  END LOOP;
END $$;

-- A few common searchable skill/category names that can be used by the employer filters.
INSERT INTO "Skill" (id,name,category,"createdAt") VALUES
  (gen_random_uuid()::text,'Kitchen Helper','HOTEL_RESTAURANT',CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Jewellery Sales','JEWELLERY',CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Store Helper','RETAIL',CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Hospital Attender','HEALTHCARE',CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Security Guard','SECURITY',CURRENT_TIMESTAMP),
  (gen_random_uuid()::text,'Cleaner','HOUSEKEEPING',CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;
