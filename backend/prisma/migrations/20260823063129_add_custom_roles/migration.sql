-- Convert the existing Role.name enum values to TEXT
ALTER TABLE "Role"
ALTER COLUMN "name" TYPE TEXT USING "name"::TEXT;

-- Add custom-role metadata while preserving existing roles
ALTER TABLE "Role"
ADD COLUMN "description" TEXT,
ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing predefined roles are system roles
UPDATE "Role"
SET "isSystem" = true
WHERE "name" IN (
    'SUPER_ADMIN',
    'ADMIN',
    'VERIFICATION_AGENT',
    'EMPLOYER',
    'SUPERVISOR',
    'WORKER'
);
