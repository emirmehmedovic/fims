-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT_PDF', 'BULK_EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "password_changed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warehouses" (
    "userId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_warehouses_pkey" PRIMARY KEY ("userId","warehouseId")
);

-- CreateTable
CREATE TABLE "fuel_entries" (
    "id" TEXT NOT NULL,
    "registration_number" INTEGER NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "delivery_note_number" TEXT,
    "delivery_note_date" TIMESTAMP(3),
    "customs_declaration_number" TEXT,
    "customs_declaration_date" TIMESTAMP(3),
    "is_higher_quality" BOOLEAN NOT NULL DEFAULT false,
    "improved_characteristics" TEXT[],
    "country_of_origin" TEXT,
    "laboratory_name" TEXT,
    "lab_accreditation_number" TEXT,
    "test_report_number" TEXT,
    "test_report_date" TIMESTAMP(3),
    "operator_id" TEXT NOT NULL,
    "order_opened_by" TEXT,
    "pickup_location" TEXT,
    "supplier_id" TEXT,
    "transporter_id" TEXT,
    "driver_name" TEXT,
    "certificate_path" TEXT,
    "certificate_file_name" TEXT,
    "certificate_uploaded_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_entries_registration_number_key" ON "fuel_entries"("registration_number");

-- CreateIndex
CREATE INDEX "fuel_entries_registration_number_idx" ON "fuel_entries"("registration_number");

-- CreateIndex
CREATE INDEX "fuel_entries_warehouse_id_idx" ON "fuel_entries"("warehouse_id");

-- CreateIndex
CREATE INDEX "fuel_entries_entry_date_idx" ON "fuel_entries"("entry_date");

-- CreateIndex
CREATE INDEX "fuel_entries_product_name_idx" ON "fuel_entries"("product_name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "transporters_code_key" ON "transporters"("code");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "user_warehouses" ADD CONSTRAINT "user_warehouses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warehouses" ADD CONSTRAINT "user_warehouses_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "fuel_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
