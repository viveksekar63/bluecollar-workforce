-- Workforce catalog seed data.
-- Run after Prisma migrations have created the catalog tables.
-- Safe to run repeatedly: existing catalog rows are preserved.
-- Location hierarchy: STATE -> DISTRICT -> CITY.
-- Worker creation/import remains a separate admin workflow.

INSERT INTO "work_categories" ("name") VALUES
 ('Hotel & Restaurant'),('Jewellery'),('Tea Shop'),('Hospital & Healthcare'),
 ('Housekeeping'),('Security'),('Delivery'),('Electrical'),('Construction'),('Retail & Sales')
ON CONFLICT ("name") DO NOTHING;

DO $$
DECLARE
  v_state_id TEXT;
  v_district_id TEXT;
BEGIN
  -- Tamil Nadu
  INSERT INTO "work_locations" ("type", "name", "code", "isActive")
  SELECT 'STATE', 'Tamil Nadu', 'TN', true
  WHERE NOT EXISTS (
    SELECT 1 FROM "work_locations"
    WHERE "type" = 'STATE' AND LOWER("name") = LOWER('Tamil Nadu') AND "isActive" = true
  );

  SELECT "id" INTO v_state_id
  FROM "work_locations"
  WHERE "type" = 'STATE' AND LOWER("name") = LOWER('Tamil Nadu') AND "isActive" = true
  ORDER BY "createdAt"
  LIMIT 1;

  -- Thanjavur district: Thanjavur + Kumbakonam
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Thanjavur', 'TN-TJV', v_state_id, true
  WHERE NOT EXISTS (
    SELECT 1 FROM "work_locations"
    WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Thanjavur') AND "isActive" = true
  );
  SELECT "id" INTO v_district_id FROM "work_locations"
  WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Thanjavur') AND "isActive" = true
  ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Thanjavur', 'TN-TJV-C', v_district_id, '613001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Thanjavur') AND "isActive" = true);
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Kumbakonam', 'TN-KUM-C', v_district_id, '612001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Kumbakonam') AND "isActive" = true);

  -- Chennai district: Chennai
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Chennai', 'TN-CHE', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Chennai') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Chennai') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Chennai', 'TN-CHE-C', v_district_id, '600001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Chennai') AND "isActive" = true);

  -- Tiruchirappalli district: Trichy
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Tiruchirappalli', 'TN-TRY', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Tiruchirappalli') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Tiruchirappalli') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Trichy', 'TN-TRY-C', v_district_id, '620001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Trichy') AND "isActive" = true);

  -- Madurai district: Madurai
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Madurai', 'TN-MDU', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Madurai') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Madurai') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Madurai', 'TN-MDU-C', v_district_id, '625001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Madurai') AND "isActive" = true);

  -- Mayiladuthurai district: Mayiladuthurai
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Mayiladuthurai', 'TN-MYL', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Mayiladuthurai') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Mayiladuthurai') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Mayiladuthurai', 'TN-MYL-C', v_district_id, '609001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Mayiladuthurai') AND "isActive" = true);

  -- Coimbatore district: Coimbatore
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Coimbatore', 'TN-CBE', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Coimbatore') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Coimbatore') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Coimbatore', 'TN-CBE-C', v_district_id, '641001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Coimbatore') AND "isActive" = true);

  -- Salem district: Salem
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Salem', 'TN-SLM', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Salem') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Salem') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Salem', 'TN-SLM-C', v_district_id, '636001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Salem') AND "isActive" = true);

  -- Karnataka / Bengaluru Urban / Bengaluru
  INSERT INTO "work_locations" ("type", "name", "code", "isActive")
  SELECT 'STATE', 'Karnataka', 'KA', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'STATE' AND LOWER("name") = LOWER('Karnataka') AND "isActive" = true);
  SELECT "id" INTO v_state_id FROM "work_locations" WHERE "type" = 'STATE' AND LOWER("name") = LOWER('Karnataka') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;

  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "isActive")
  SELECT 'DISTRICT', 'Bengaluru Urban', 'KA-BLR-U', v_state_id, true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Bengaluru Urban') AND "isActive" = true);
  SELECT "id" INTO v_district_id FROM "work_locations" WHERE "type" = 'DISTRICT' AND "parentId" = v_state_id AND LOWER("name") = LOWER('Bengaluru Urban') AND "isActive" = true ORDER BY "createdAt" LIMIT 1;
  INSERT INTO "work_locations" ("type", "name", "code", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Bengaluru', 'KA-BLR-C', v_district_id, '560001', true
  WHERE NOT EXISTS (SELECT 1 FROM "work_locations" WHERE "type" = 'CITY' AND "parentId" = v_district_id AND LOWER("name") = LOWER('Bengaluru') AND "isActive" = true);
END $$;
INSERT INTO "work_locations" ("city","district","state","pincode") VALUES
 ('Thanjavur','Thanjavur','Tamil Nadu','613001'),
 ('Kumbakonam','Thanjavur','Tamil Nadu','612001'),
 ('Trichy','Tiruchirappalli','Tamil Nadu','620001'),
 ('Chennai','Chennai','Tamil Nadu','600001'),
 ('Madurai','Madurai','Tamil Nadu','625001'),
 ('Mayiladuthurai','Mayiladuthurai','Tamil Nadu','609001'),
 ('Coimbatore','Coimbatore','Tamil Nadu','641001'),
 ('Salem','Salem','Tamil Nadu','636001'),
 ('Bengaluru','Bengaluru Urban','Karnataka','560001')
ON CONFLICT ("city", "state") DO NOTHING;
