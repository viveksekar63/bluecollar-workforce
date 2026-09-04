INSERT INTO "work_categories" ("code", "name") VALUES
  ('CONSTRUCTION','Construction'),
  ('DRIVING','Driving'),
  ('DOMESTIC_SERVICES','Domestic Services'),
  ('SECURITY','Security Services'),
  ('DELIVERY_LOGISTICS','Delivery & Logistics')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "work_professions" ("categoryId", "code", "name")
SELECT c."id", v.code, v.name
FROM "work_categories" c
JOIN (VALUES
  ('CONSTRUCTION','ELECTRICIAN','Electrician'),
  ('CONSTRUCTION','PLUMBER','Plumber'),
  ('CONSTRUCTION','CARPENTER','Carpenter'),
  ('CONSTRUCTION','PAINTER','Painter'),
  ('CONSTRUCTION','MASON','Mason'),
  ('CONSTRUCTION','TILE_WORKER','Tile Worker'),
  ('CONSTRUCTION','WELDER','Welder'),
  ('CONSTRUCTION','FABRICATOR','Fabricator'),
  ('CONSTRUCTION','AC_TECHNICIAN','AC Technician'),
  ('CONSTRUCTION','CIVIL_HELPER','Civil Helper'),
  ('CONSTRUCTION','GENERAL_LABOURER','General Labourer'),
  ('DRIVING','CAR_DRIVER','Car Driver'),
  ('DRIVING','HEAVY_VEHICLE_DRIVER','Heavy Vehicle Driver'),
  ('DRIVING','AUTO_DRIVER','Auto Driver'),
  ('DRIVING','DELIVERY_DRIVER','Delivery Driver'),
  ('DOMESTIC_SERVICES','HOUSE_MAID','House Maid'),
  ('DOMESTIC_SERVICES','DOMESTIC_COOK','Domestic Cook'),
  ('DOMESTIC_SERVICES','BABYSITTER','Babysitter'),
  ('DOMESTIC_SERVICES','CAREGIVER','Caregiver'),
  ('SECURITY','SECURITY_GUARD','Security Guard'),
  ('SECURITY','SECURITY_SUPERVISOR','Security Supervisor'),
  ('DELIVERY_LOGISTICS','DELIVERY_EXECUTIVE','Delivery Executive'),
  ('DELIVERY_LOGISTICS','WAREHOUSE_HELPER','Warehouse Helper'),
  ('DELIVERY_LOGISTICS','LOADER','Loader')
) AS v(category_code, code, name) ON c."code" = v.category_code
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Language" ("id", "name")
VALUES (gen_random_uuid()::text, 'Tamil')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Language" ("id", "name")
VALUES (gen_random_uuid()::text, 'English')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Language" ("id", "name")
VALUES (gen_random_uuid()::text, 'Hindi')
ON CONFLICT ("name") DO NOTHING;
