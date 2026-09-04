-- Workforce catalog seed data.
-- Safe to run repeatedly: existing catalog rows are preserved.
-- This is intentionally catalog-only; worker creation/import remains a separate admin workflow.

CREATE TABLE IF NOT EXISTS "work_categories" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "work_locations" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "state" TEXT NOT NULL,
  "pincode" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_locations_city_state_key" UNIQUE ("city", "state")
);

INSERT INTO "work_categories" ("name") VALUES
 ('Hotel & Restaurant'),('Jewellery'),('Tea Shop'),('Hospital & Healthcare'),
 ('Housekeeping'),('Security'),('Delivery'),('Electrical'),('Construction'),('Retail & Sales')
ON CONFLICT ("name") DO NOTHING;

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
