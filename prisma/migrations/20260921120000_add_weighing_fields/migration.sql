-- Add new fields to fuel_receipt_records table for weighing and fuel found on last unload
ALTER TABLE "fuel_receipt_records" ADD COLUMN IF NOT EXISTS "fuel_found_on_last_unload" TEXT;
ALTER TABLE "fuel_receipt_records" ADD COLUMN IF NOT EXISTS "has_weighing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fuel_receipt_records" ADD COLUMN IF NOT EXISTS "weighing_data" JSONB;
