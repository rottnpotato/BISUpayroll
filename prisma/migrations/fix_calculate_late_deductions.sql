-- Fix calculate_late_deductions function with default parameters
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
            WHEN 'fixed' THEN p_late_hours * p_deduction_amount
            WHEN 'hourly' THEN p_late_hours * p_hourly_rate * p_deduction_amount
            WHEN 'daily' THEN p_late_hours * p_daily_rate * p_deduction_amount
            WHEN 'per_minute' THEN (p_late_hours * 60) * (p_hourly_rate / 60) * p_deduction_amount
            ELSE 0
        END,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
