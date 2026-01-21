-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'AUTO_SEND';

-- CreateTable
CREATE TABLE "auto_email_recipients" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_email_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auto_email_recipients_email_key" ON "auto_email_recipients"("email");

-- CreateIndex
CREATE INDEX "auto_email_recipients_is_active_idx" ON "auto_email_recipients"("is_active");
