INSERT INTO "work_categories" ("code", "name") VALUES
  ('HOSPITALITY','Hospitality'),
  ('MANUFACTURING','Manufacturing'),
  ('AGRICULTURE','Agriculture'),
  ('BEAUTY_SALON','Beauty & Salon'),
  ('OFFICE_SUPPORT','Office Support'),
  ('MAINTENANCE','Maintenance')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "work_professions" ("categoryId", "code", "name")
SELECT c."id", v.code, v.name
FROM "work_categories" c
JOIN (VALUES
  ('HOSPITALITY','WAITER','Waiter'),
  ('HOSPITALITY','HOTEL_HOUSEKEEPER','Hotel Housekeeper'),
  ('HOSPITALITY','CHEF','Chef'),
  ('HOSPITALITY','KITCHEN_HELPER','Kitchen Helper'),
  ('HOSPITALITY','RECEPTIONIST','Receptionist'),
  ('MANUFACTURING','FACTORY_WORKER','Factory Worker'),
  ('MANUFACTURING','MACHINE_OPERATOR','Machine Operator'),
  ('MANUFACTURING','PRODUCTION_HELPER','Production Helper'),
  ('AGRICULTURE','FARM_WORKER','Farm Worker'),
  ('AGRICULTURE','AGRICULTURAL_HELPER','Agricultural Helper'),
  ('BEAUTY_SALON','BEAUTICIAN','Beautician'),
  ('BEAUTY_SALON','BARBER','Barber'),
  ('OFFICE_SUPPORT','OFFICE_HELPER','Office Helper'),
  ('OFFICE_SUPPORT','OFFICE_ASSISTANT','Office Assistant'),
  ('MAINTENANCE','MAINTENANCE_TECHNICIAN','Maintenance Technician'),
  ('MAINTENANCE','GENERAL_MAINTENANCE_WORKER','General Maintenance Worker')
) AS v(category_code, code, name) ON c."code" = v.category_code
ON CONFLICT ("code") DO NOTHING;
