CREATE TABLE "user_guide_completions" (
    "user_id" TEXT NOT NULL,
    "guide_key" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_guide_completions_pkey" PRIMARY KEY ("user_id", "guide_key"),
    CONSTRAINT "user_guide_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
