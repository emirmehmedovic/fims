-- CreateTable
CREATE TABLE "auto_send_batches" (
    "id" TEXT NOT NULL,
    "date_from" TIMESTAMP(3) NOT NULL,
    "date_to" TIMESTAMP(3) NOT NULL,
    "total_entries" INTEGER NOT NULL,
    "batch_size" INTEGER NOT NULL,
    "total_batches" INTEGER NOT NULL,
    "recipients_count" INTEGER NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_send_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_send_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "entry_ids" TEXT[],
    "recipient_emails" TEXT[],
    "entries_count" INTEGER NOT NULL,
    "include_certificates" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_send_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auto_send_batch_items_batch_id_idx" ON "auto_send_batch_items"("batch_id");

-- CreateIndex
CREATE INDEX "auto_send_batch_items_sequence_idx" ON "auto_send_batch_items"("sequence");

-- AddForeignKey
ALTER TABLE "auto_send_batch_items" ADD CONSTRAINT "auto_send_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "auto_send_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
