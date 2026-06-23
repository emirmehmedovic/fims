-- CreateTable: user_stations for User-Station many-to-many relationship
CREATE TABLE IF NOT EXISTS "user_stations" (
    "userId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_stations_pkey" PRIMARY KEY ("userId","stationId")
);

-- AddForeignKey: user_stations -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_stations_userId_fkey'
    ) THEN
        ALTER TABLE "user_stations" ADD CONSTRAINT "user_stations_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey: user_stations -> stations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_stations_stationId_fkey'
    ) THEN
        ALTER TABLE "user_stations" ADD CONSTRAINT "user_stations_stationId_fkey"
        FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
