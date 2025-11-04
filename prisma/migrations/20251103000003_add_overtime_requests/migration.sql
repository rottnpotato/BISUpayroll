-- =====================================================
-- CREATE OVERTIME REQUEST TABLE
-- =====================================================
-- Separate model for overtime requests (different from overload)
-- Overtime = extra hours that get overtime pay rates (1.25x - 1.5x)
-- Overload = additional teaching/work load (different pay calculation)

CREATE TABLE IF NOT EXISTS "overtime_requests" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "hoursWorked" DECIMAL(6,2) NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "status" "OverloadStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes for overtime_requests
CREATE INDEX IF NOT EXISTS "overtime_requests_userId_attendanceId_idx" ON "overtime_requests"("userId", "attendanceId");
CREATE INDEX IF NOT EXISTS "overtime_requests_userId_createdAt_idx" ON "overtime_requests"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "overtime_requests_status_idx" ON "overtime_requests"("status");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_attendanceId_fkey" 
    FOREIGN KEY ("attendanceId") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_approvedById_fkey" 
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CREATE FUNCTION: Calculate overtime pay from approved requests
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_overtime_pay_from_requests(
    p_user_id TEXT,
    p_pay_period_start DATE,
    p_pay_period_end DATE
) RETURNS TABLE(
    total_hours DECIMAL,
    total_pay DECIMAL
) AS $$
DECLARE
    v_total_hours DECIMAL := 0;
    v_total_pay DECIMAL := 0;
BEGIN
    -- Aggregate approved overtime requests within the pay period
    SELECT 
        COALESCE(SUM(CAST(ot."hoursWorked" AS DECIMAL)), 0),
        COALESCE(SUM(CAST(ot."totalAmount" AS DECIMAL)), 0)
    INTO v_total_hours, v_total_pay
    FROM "overtime_requests" ot
    JOIN "attendance_records" a ON ot."attendanceId" = a.id
    WHERE ot."userId" = p_user_id
    AND ot."status" = 'APPROVED'
    AND a.date >= p_pay_period_start
    AND a.date <= p_pay_period_end;
    
    RETURN QUERY SELECT v_total_hours, v_total_pay;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_overtime_pay_from_requests IS 'Calculates total overtime hours and pay for approved overtime requests within a pay period';
