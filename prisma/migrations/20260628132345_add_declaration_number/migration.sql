-- Add declaration_number column to fuel_entries table
-- Format: XXXX/YY (e.g., 0001/26)
ALTER TABLE "fuel_entries" ADD COLUMN "declaration_number" TEXT;

-- Create unique index on declaration_number
CREATE UNIQUE INDEX "fuel_entries_declaration_number_key" ON "fuel_entries"("declaration_number");

-- Backfill existing entries with declaration numbers based on their creation date
-- This uses a window function to assign sequential numbers per year
WITH numbered_entries AS (
  SELECT
    id,
    EXTRACT(YEAR FROM created_at)::INTEGER as entry_year,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM created_at)
      ORDER BY created_at, id
    ) as seq_num
  FROM fuel_entries
  WHERE declaration_number IS NULL
)
UPDATE fuel_entries fe
SET declaration_number = LPAD(ne.seq_num::TEXT, 4, '0') || '/' || RIGHT(ne.entry_year::TEXT, 2)
FROM numbered_entries ne
WHERE fe.id = ne.id;
