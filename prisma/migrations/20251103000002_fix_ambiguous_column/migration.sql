-- =====================================================
-- FIX: Ambiguous column reference in calculate_overload_pay
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_overload_pay(
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
    -- Aggregate approved overload records within the pay period
    -- Fixed: Explicitly qualify hoursWorked column to avoid ambiguity
    SELECT 
        COALESCE(SUM(CAST(o."hoursWorked" AS DECIMAL)), 0),
        COALESCE(SUM(CAST(o."totalAmount" AS DECIMAL)), 0)
    INTO v_total_hours, v_total_pay
    FROM "overload_records" o
    JOIN "attendance_records" a ON o."attendanceId" = a.id
    WHERE o."userId" = p_user_id
    AND o."status" = 'APPROVED'
    AND a.date >= p_pay_period_start
    AND a.date <= p_pay_period_end;
    
    RETURN QUERY SELECT v_total_hours, v_total_pay;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_overload_pay IS 'Calculates total overload hours and pay for approved overload records within a pay period';
