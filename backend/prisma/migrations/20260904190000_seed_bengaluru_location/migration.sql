-- Add Bengaluru as the canonical Karnataka city used by AI worker search.
-- Bangalore is handled as an input alias and normalized to Bengaluru by the parser.
INSERT INTO "work_locations" ("city", "district", "state", "pincode")
VALUES ('Bengaluru', 'Bengaluru Urban', 'Karnataka', '560001')
ON CONFLICT ("city", "state") DO NOTHING;
