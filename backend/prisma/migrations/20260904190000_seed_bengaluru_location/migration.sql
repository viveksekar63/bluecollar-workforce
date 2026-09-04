-- Add Bengaluru to the canonical hierarchical location master used by AI worker search.
-- work_locations is hierarchical: STATE -> DISTRICT -> CITY.
-- This migration is idempotent and preserves existing master rows.

DO $$
DECLARE
  v_state_id TEXT;
  v_district_id TEXT;
BEGIN
  SELECT "id"
    INTO v_state_id
  FROM "work_locations"
  WHERE "type" = 'STATE'
    AND LOWER("name") = LOWER('Karnataka')
    AND "isActive" = true
  ORDER BY "createdAt"
  LIMIT 1;

  IF v_state_id IS NULL THEN
    INSERT INTO "work_locations" ("type", "name", "code", "isActive")
    VALUES ('STATE', 'Karnataka', 'KA', true)
    RETURNING "id" INTO v_state_id;
  END IF;

  SELECT "id"
    INTO v_district_id
  FROM "work_locations"
  WHERE "type" = 'DISTRICT'
    AND "parentId" = v_state_id
    AND LOWER("name") = LOWER('Bengaluru Urban')
    AND "isActive" = true
  ORDER BY "createdAt"
  LIMIT 1;

  IF v_district_id IS NULL THEN
    INSERT INTO "work_locations" ("type", "name", "parentId", "isActive")
    VALUES ('DISTRICT', 'Bengaluru Urban', v_state_id, true)
    RETURNING "id" INTO v_district_id;
  END IF;

  INSERT INTO "work_locations" ("type", "name", "parentId", "pincode", "isActive")
  SELECT 'CITY', 'Bengaluru', v_district_id, '560001', true
  WHERE NOT EXISTS (
    SELECT 1
    FROM "work_locations"
    WHERE "type" = 'CITY'
      AND "parentId" = v_district_id
      AND LOWER("name") = LOWER('Bengaluru')
      AND "isActive" = true
  );
END $$;
