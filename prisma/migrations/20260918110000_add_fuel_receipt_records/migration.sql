-- CreateTable
CREATE TABLE IF NOT EXISTS "correction_factors" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "factor" DECIMAL(10,6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "fuel_receipt_records" (
    "id" TEXT NOT NULL,
    "fuel_entry_id" TEXT NOT NULL,
    "tank_measurements" JSONB NOT NULL,
    "announced_quantity" INTEGER,
    "discharged_quantity" INTEGER,
    "difference_quantity" INTEGER,
    "meter_reading" INTEGER,
    "delivery_note_quantity" INTEGER,
    "final_difference" INTEGER,
    "has_delivery_note" BOOLEAN NOT NULL DEFAULT false,
    "has_quality_certificate" BOOLEAN NOT NULL DEFAULT false,
    "has_compliance_declaration" BOOLEAN NOT NULL DEFAULT false,
    "is_water_measured" BOOLEAN NOT NULL DEFAULT false,
    "has_water_in_tank" BOOLEAN NOT NULL DEFAULT false,
    "is_visual_inspection_done" BOOLEAN NOT NULL DEFAULT false,
    "has_additives" BOOLEAN NOT NULL DEFAULT false,
    "is_last_unload" BOOLEAN NOT NULL DEFAULT false,
    "is_tank_checked_after_last_unload" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_receipt_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "correction_factors_product_name_idx" ON "correction_factors"("product_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "correction_factors_temperature_idx" ON "correction_factors"("temperature");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "correction_factors_product_name_temperature_key" ON "correction_factors"("product_name", "temperature");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "fuel_receipt_records_fuel_entry_id_key" ON "fuel_receipt_records"("fuel_entry_id");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fuel_receipt_records_fuel_entry_id_fkey'
    ) THEN
        ALTER TABLE "fuel_receipt_records" ADD CONSTRAINT "fuel_receipt_records_fuel_entry_id_fkey"
        FOREIGN KEY ("fuel_entry_id") REFERENCES "fuel_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
