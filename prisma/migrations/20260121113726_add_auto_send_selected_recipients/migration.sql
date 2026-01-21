-- AlterTable
ALTER TABLE "auto_send_settings" ADD COLUMN     "selected_recipient_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
