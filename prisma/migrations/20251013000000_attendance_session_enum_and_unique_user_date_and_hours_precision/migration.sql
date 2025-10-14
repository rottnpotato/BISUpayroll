-- Prisma Migration: attendance_session_enum_and_unique_user_date_and_hours_precision
-- Changes:
-- 1) Widen attendance_records.hoursWorked from DECIMAL(4,2) to DECIMAL(6,2)
-- 2) Convert attendance_records.sessionType from TEXT to enum AttendanceSessionType ('FULL_DAY','HALF_DAY')
-- 3) Add unique constraint on (userId, date)

BEGIN;

-- 1) Ensure enum type exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'AttendanceSessionType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AttendanceSessionType" AS ENUM ('FULL_DAY', 'HALF_DAY');
  END IF;
END $$;

-- 2) Add sessionType column if not exists
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "sessionType" "AttendanceSessionType";

-- 2a) Backfill sessionType from isHalfDay when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'isHalfDay'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'attendance_records' AND column_name = 'isAbsent'
    ) THEN
      UPDATE "attendance_records"
      SET "sessionType" = CASE WHEN "isHalfDay" = TRUE THEN 'HALF_DAY'::"AttendanceSessionType" ELSE 'FULL_DAY'::"AttendanceSessionType" END
      WHERE "sessionType" IS NULL AND "isAbsent" = FALSE;
    ELSE
      UPDATE "attendance_records"
      SET "sessionType" = CASE WHEN "isHalfDay" = TRUE THEN 'HALF_DAY'::"AttendanceSessionType" ELSE 'FULL_DAY'::"AttendanceSessionType" END
      WHERE "sessionType" IS NULL;
    END IF;
  END IF;
END $$;

-- 3) Widen precision for hoursWorked
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attendance_records' AND column_name = 'hoursWorked'
  ) THEN
    ALTER TABLE "attendance_records" ALTER COLUMN "hoursWorked" TYPE DECIMAL(6,2);
  END IF;
END $$;

-- 4) Add unique constraint on (userId, date) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'attendance_records'
      AND constraint_name = 'attendance_records_userId_date_key'
  ) THEN
    ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_userId_date_key" UNIQUE ("userId", "date");
  END IF;
END $$;

COMMIT;
