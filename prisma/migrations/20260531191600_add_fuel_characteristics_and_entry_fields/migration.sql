-- AlterTable: Add manufacturers and type columns to fuel_characteristics
ALTER TABLE "fuel_characteristics"
ADD COLUMN IF NOT EXISTS "manufacturers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "type" TEXT;

-- AlterTable: Add new columns to fuel_entries
ALTER TABLE "fuel_entries"
ADD COLUMN IF NOT EXISTS "additive_details" TEXT,
ADD COLUMN IF NOT EXISTS "client_id" TEXT,
ADD COLUMN IF NOT EXISTS "laboratory_id" TEXT,
ADD COLUMN IF NOT EXISTS "vehicle_registration" TEXT;

-- AddForeignKey: Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fuel_entries_client_id_fkey'
    ) THEN
        ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_client_id_fkey"
        FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fuel_entries_laboratory_id_fkey'
    ) THEN
        ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_laboratory_id_fkey"
        FOREIGN KEY ("laboratory_id") REFERENCES "laboratories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
