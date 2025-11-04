-- =====================================================
-- Add default working hours system setting
-- =====================================================
-- Ensures working_hours_dailyHours has a default value of 8
-- This is used by the payroll calculation stored procedure
-- =====================================================

-- Insert default working hours setting if it doesn't exist
INSERT INTO "system_settings" (id, key, value, description, category, "dataType", "isActive", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'working_hours_dailyHours',
    '8',
    'Standard daily working hours for employees',
    'working_hours',
    'STRING',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    "updatedAt" = NOW()
WHERE "system_settings"."isActive" = true;

-- Also add other common working hours settings if they don't exist
INSERT INTO "system_settings" (id, key, value, description, category, "dataType", "isActive", "createdAt", "updatedAt")
VALUES 
    (
        gen_random_uuid()::text,
        'working_hours_lateDeductionAmount',
        '10',
        'Amount to deduct per late instance (based on lateDeductionBasis)',
        'working_hours',
        'STRING',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'working_hours_lateDeductionBasis',
        'per_minute',
        'Basis for late deduction calculation (fixed, hourly, daily, per_minute)',
        'working_hours',
        'STRING',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'rates_overtimeRate1',
        '1.25',
        'Overtime multiplier for first 2 hours',
        'rates',
        'STRING',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'rates_overtimeRate2',
        '1.5',
        'Overtime multiplier for hours beyond 2',
        'rates',
        'STRING',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'rates_regularHolidayRate',
        '2.0',
        'Pay multiplier for regular holidays',
        'rates',
        'STRING',
        true,
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid()::text,
        'rates_specialHolidayRate',
        '1.3',
        'Pay multiplier for special non-working holidays',
        'rates',
        'STRING',
        true,
        NOW(),
        NOW()
    )
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE "system_settings" IS 'System-wide configuration settings for payroll, working hours, and rates';
