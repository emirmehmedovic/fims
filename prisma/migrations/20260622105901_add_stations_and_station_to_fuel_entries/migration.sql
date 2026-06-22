-- CreateTable
CREATE TABLE IF NOT EXISTS "stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- AlterTable - Add station_id to fuel_entries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fuel_entries' AND column_name = 'station_id'
    ) THEN
        ALTER TABLE "fuel_entries" ADD COLUMN "station_id" TEXT;
    END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "stations_code_key" ON "stations"("code");

-- CreateIndex - Add missing indexes on fuel_entries if they don't exist
CREATE INDEX IF NOT EXISTS "fuel_entries_client_id_idx" ON "fuel_entries"("client_id");
CREATE INDEX IF NOT EXISTS "fuel_entries_supplier_id_idx" ON "fuel_entries"("supplier_id");
CREATE INDEX IF NOT EXISTS "fuel_entries_transporter_id_idx" ON "fuel_entries"("transporter_id");
CREATE INDEX IF NOT EXISTS "fuel_entries_laboratory_id_idx" ON "fuel_entries"("laboratory_id");
CREATE INDEX IF NOT EXISTS "fuel_entries_station_id_idx" ON "fuel_entries"("station_id");
CREATE INDEX IF NOT EXISTS "fuel_entries_is_active_entry_date_idx" ON "fuel_entries"("is_active", "entry_date");
CREATE INDEX IF NOT EXISTS "fuel_entries_warehouse_id_entry_date_idx" ON "fuel_entries"("warehouse_id", "entry_date");
CREATE INDEX IF NOT EXISTS "fuel_entries_warehouse_id_is_active_idx" ON "fuel_entries"("warehouse_id", "is_active");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fuel_entries_station_id_fkey'
    ) THEN
        ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_station_id_fkey"
        FOREIGN KEY ("station_id") REFERENCES "stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
