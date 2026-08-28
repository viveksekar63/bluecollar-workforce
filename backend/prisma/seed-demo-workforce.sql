-- Demo workforce data for local/staging UI validation.
-- Run only in a development/staging database.
-- This creates realistic catalog-backed workers without exposing real personal data.

INSERT INTO "work_categories" ("name") VALUES
 ('Hotel & Restaurant'),('Jewellery'),('Tea Shop'),('Hospital & Healthcare')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "work_locations" ("city","district","state","pincode") VALUES
 ('Thanjavur','Thanjavur','Tamil Nadu','613001'),
 ('Kumbakonam','Thanjavur','Tamil Nadu','612001'),
 ('Trichy','Tiruchirappalli','Tamil Nadu','620001'),
 ('Chennai','Chennai','Tamil Nadu','600001')
ON CONFLICT ("city", "state") DO NOTHING;

-- Profession/category/location reference catalog. Keep worker records created by the
-- Admin CSV/API import so the same validation path is exercised during testing.
CREATE TABLE IF NOT EXISTS "work_professions" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_professions_name_category_key" UNIQUE ("name", "category")
);

INSERT INTO "work_professions" ("name","category") VALUES
 ('Parota Master','Hotel & Restaurant'),
 ('Hotel Cook','Hotel & Restaurant'),
 ('Kitchen Helper','Hotel & Restaurant'),
 ('Jewellery Sales Executive','Jewellery'),
 ('Goldsmith','Jewellery'),
 ('Tea Master','Tea Shop'),
 ('Tea Shop Helper','Tea Shop'),
 ('Ward Assistant','Hospital & Healthcare'),
 ('Hospital Housekeeping','Hospital & Healthcare')
ON CONFLICT ("name", "category") DO NOTHING;
