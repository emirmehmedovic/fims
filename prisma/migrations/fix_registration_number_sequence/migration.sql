-- Fix registration number generation using PostgreSQL SEQUENCE
-- This ensures atomic, thread-safe registration number generation

-- Step 1: Create sequence (Prisma autoincrement default naming)
CREATE SEQUENCE IF NOT EXISTS "fuel_entries_registration_number_seq" START 12345;

-- Step 2: Set sequence to current max value (if entries already exist)
DO $$
DECLARE
  max_reg_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(registration_number), 12344) INTO max_reg_num FROM fuel_entries;
  PERFORM setval('fuel_entries_registration_number_seq', max_reg_num + 1, false);
END $$;

-- Step 3: Set default value for registration_number column
ALTER TABLE "fuel_entries"
ALTER COLUMN "registration_number"
SET DEFAULT nextval('fuel_entries_registration_number_seq');

-- Optional: Grant usage on sequence to application user (if needed)
-- GRANT USAGE, SELECT ON SEQUENCE "fuel_entries_registration_number_seq" TO your_app_user;
