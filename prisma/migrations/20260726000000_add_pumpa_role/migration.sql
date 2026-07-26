-- Manual Migration: Add PUMPA role to Role enum
-- This migration adds the PUMPA role for gas station pump operators

-- Add PUMPA value to Role enum
ALTER TYPE "Role" ADD VALUE 'PUMPA';

-- Create HIFA-PETROL supplier with code 650 if not exists
INSERT INTO suppliers (id, name, code, address, is_active, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    'HIFA-PETROL D.O.O. SARAJEVO',
    '650',
    'Sarajevo, BiH',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM suppliers WHERE code = '650'
);

-- Create DEFAULT warehouse (DEF-001) for PUMPA users if not exists
INSERT INTO warehouses (id, name, code, location, capacity, description, is_active, created_at, updated_at)
SELECT
    gen_random_uuid()::text,
    'DEFAULT',
    'DEF-001',
    'N/A',
    0,
    'Default terminal for PUMPA users',
    true,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM warehouses WHERE code = 'DEF-001'
);
