/*
  Warnings:

  - You are about to drop the column `contact` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `transporters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "fuel_entries" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "contact",
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "transporters" DROP COLUMN "contact",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "transporters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
