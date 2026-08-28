CREATE TABLE "work_categories" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_categories_code_key" UNIQUE ("code"),
  CONSTRAINT "work_categories_name_key" UNIQUE ("name")
);

CREATE TABLE "work_professions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "categoryId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_professions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_professions_code_key" UNIQUE ("code"),
  CONSTRAINT "work_professions_category_name_key" UNIQUE ("categoryId", "name"),
  CONSTRAINT "work_professions_category_fkey" FOREIGN KEY ("categoryId") REFERENCES "work_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "work_professions_categoryId_idx" ON "work_professions"("categoryId");
CREATE INDEX "work_professions_active_idx" ON "work_professions"("isActive");

CREATE TABLE "work_locations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "parentId" TEXT,
  "pincode" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "work_locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "work_locations_parent_fkey" FOREIGN KEY ("parentId") REFERENCES "work_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "work_locations_type_check" CHECK ("type" IN ('STATE','DISTRICT','CITY'))
);
CREATE INDEX "work_locations_parentId_idx" ON "work_locations"("parentId");
CREATE INDEX "work_locations_type_idx" ON "work_locations"("type");
CREATE INDEX "work_locations_active_idx" ON "work_locations"("isActive");
CREATE UNIQUE INDEX "work_locations_parent_name_key" ON "work_locations"("parentId", "name");

INSERT INTO "work_categories" ("code", "name") VALUES
  ('HOTEL_RESTAURANT','Hotel & Restaurant'),
  ('JEWELLERY','Jewellery'),
  ('TEA_SHOP','Tea Shop'),
  ('HOSPITAL_HEALTHCARE','Hospital & Healthcare')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "work_professions" ("categoryId", "code", "name")
SELECT c."id", v.code, v.name
FROM "work_categories" c
JOIN (VALUES
  ('HOTEL_RESTAURANT','PAROTA_MASTER','Parota Master'),
  ('HOTEL_RESTAURANT','HOTEL_COOK','Hotel Cook'),
  ('HOTEL_RESTAURANT','KITCHEN_HELPER','Kitchen Helper'),
  ('JEWELLERY','JEWELLERY_SALES_EXECUTIVE','Jewellery Sales Executive'),
  ('JEWELLERY','GOLDSMITH','Goldsmith'),
  ('TEA_SHOP','TEA_MASTER','Tea Master'),
  ('TEA_SHOP','TEA_SHOP_HELPER','Tea Shop Helper'),
  ('HOSPITAL_HEALTHCARE','WARD_ASSISTANT','Ward Assistant'),
  ('HOSPITAL_HEALTHCARE','HOSPITAL_HOUSEKEEPING','Hospital Housekeeping')
) AS v(category_code, code, name) ON c."code" = v.category_code
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "work_locations" ("type", "name", "code") VALUES
  ('STATE','Tamil Nadu','TN')
ON CONFLICT DO NOTHING;

INSERT INTO "work_locations" ("type", "name", "parentId")
SELECT 'DISTRICT', v.name, s."id"
FROM "work_locations" s
JOIN (VALUES ('Thanjavur'),('Tiruchirappalli'),('Chennai')) v(name) ON true
WHERE s."type"='STATE' AND s."code"='TN'
ON CONFLICT ("parentId", "name") DO NOTHING;

INSERT INTO "work_locations" ("type", "name", "pincode", "parentId")
SELECT 'CITY', v.name, v.pincode, d."id"
FROM "work_locations" d
JOIN (VALUES
  ('Thanjavur','Thanjavur','613001'),
  ('Kumbakonam','Thanjavur','612001'),
  ('Trichy','Tiruchirappalli','620001'),
  ('Chennai','Chennai','600001')
) v(name, district, pincode) ON d."name"=v.district AND d."type"='DISTRICT'
ON CONFLICT ("parentId", "name") DO NOTHING;
