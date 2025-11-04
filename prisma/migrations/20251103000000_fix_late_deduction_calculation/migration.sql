-- =====================================================
-- FIX: Correct late deduction calculation for per_minute basis
-- =====================================================
-- Issue: The per_minute calculation was incorrectly multiplying by
-- both (hourly_rate/60) AND deduction_amount, causing inflated deductions
-- 
-- Example of the bug:
-- 5 late hours × 60 = 300 minutes
-- 300 × (125/60) × 20 = 12,500 (WRONG!)
-- Should be: 300 × 20 = 6,000 (CORRECT)

CREATE OR REPLACE FUNCTION calculate_late_deductions(
    p_late_hours DECIMAL,
    p_hourly_rate DECIMAL DEFAULT 0,
    p_daily_rate DECIMAL DEFAULT 0,
    p_deduction_amount DECIMAL DEFAULT 0,
    p_deduction_basis TEXT DEFAULT 'fixed'
) RETURNS DECIMAL AS $$
BEGIN
    IF p_late_hours <= 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(
        CASE p_deduction_basis
            -- Fixed amount per late instance
            WHEN 'fixed' THEN p_late_hours * p_deduction_amount
            
            -- Percentage of hourly rate per late hour
            WHEN 'hourly' THEN p_late_hours * p_hourly_rate * p_deduction_amount
            
            -- Percentage of daily rate per late day
            WHEN 'daily' THEN p_late_hours * p_daily_rate * p_deduction_amount
            
            -- Fixed amount per minute late
            -- Corrected formula: just multiply minutes by the per-minute deduction amount
            WHEN 'per_minute' THEN (p_late_hours * 60) * p_deduction_amount
            
            ELSE 0
        END,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_late_deductions IS 'Calculates late deductions based on configured basis. Fixed bug in per_minute calculation that was multiplying by both hourly_rate and deduction_amount.';
