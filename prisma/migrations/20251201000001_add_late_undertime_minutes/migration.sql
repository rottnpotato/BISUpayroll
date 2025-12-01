-- Add lateMinutes and undertimeMinutes to attendance_records
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "lateMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "undertimeMinutes" INTEGER NOT NULL DEFAULT 0;
