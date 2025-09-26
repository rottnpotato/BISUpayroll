-- Attendance ledger sample seed (Mon–Fri) for one employee
-- Update the email below to target the correct user before running.
-- This script uses Postgres enums "Role" and "AttendanceStatus" from your Prisma schema.

BEGIN;

-- Optional: clear existing test rows for the user and week
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph' -- CHANGE THIS
)
DELETE FROM attendance_records ar
USING emp
WHERE ar."userId" = emp.user_id
  AND ar."date" >= date '2025-09-22'
  AND ar."date" <  date '2025-09-27';

-- MON: Full day, on-time (8.00 hrs)
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph'
), admin AS (
  SELECT id AS admin_id FROM users WHERE role = 'ADMIN'::"Role" ORDER BY "createdAt" LIMIT 1
)
INSERT INTO attendance_records (
  id, "userId", "date", "timeIn", "timeOut", "hoursWorked", "isLate", "isAbsent",
  "sessionType", "isHalfDay", "isEarlyOut", "earlyOutReason",
  "morningTimeIn", "morningTimeOut", "afternoonTimeIn", "afternoonTimeOut",
  "totalSessions", "createdAt", "updatedAt", "approvedAt", "approvedById", status
)
SELECT
  'att_2025_09_22_full', emp.user_id,
  timestamp '2025-09-22 00:00:00',
  timestamp '2025-09-22 08:00:00',
  timestamp '2025-09-22 17:00:00',
  8.00, FALSE, FALSE,
  'full_day', FALSE, FALSE, NULL,
  timestamp '2025-09-22 08:00:00', timestamp '2025-09-22 12:00:00',
  timestamp '2025-09-22 13:00:00', timestamp '2025-09-22 17:00:00',
  2, now(), now(), now(), admin.admin_id, 'APPROVED'::"AttendanceStatus"
FROM emp, admin;

-- TUE: Late arrival (7.75 hrs)
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph'
), admin AS (
  SELECT id AS admin_id FROM users WHERE role = 'ADMIN'::"Role" ORDER BY "createdAt" LIMIT 1
)
INSERT INTO attendance_records (
  id, "userId", "date", "timeIn", "timeOut", "hoursWorked", "isLate", "isAbsent",
  "sessionType", "isHalfDay", "isEarlyOut", "earlyOutReason",
  "morningTimeIn", "morningTimeOut", "afternoonTimeIn", "afternoonTimeOut",
  "totalSessions", "createdAt", "updatedAt", "approvedAt", "approvedById", status
)
SELECT
  'att_2025_09_23_late', emp.user_id,
  timestamp '2025-09-23 00:00:00',
  timestamp '2025-09-23 09:15:00',
  timestamp '2025-09-23 17:00:00',
  7.75, TRUE, FALSE,
  'full_day', FALSE, FALSE, NULL,
  timestamp '2025-09-23 09:15:00', timestamp '2025-09-23 12:00:00',
  timestamp '2025-09-23 13:00:00', timestamp '2025-09-23 17:00:00',
  2, now(), now(), now(), admin.admin_id, 'APPROVED'::"AttendanceStatus"
FROM emp, admin;

-- WED: Early out (7.00 hrs)
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph'
), admin AS (
  SELECT id AS admin_id FROM users WHERE role = 'ADMIN'::"Role" ORDER BY "createdAt" LIMIT 1
)
INSERT INTO attendance_records (
  id, "userId", "date", "timeIn", "timeOut", "hoursWorked", "isLate", "isAbsent",
  "sessionType", "isHalfDay", "isEarlyOut", "earlyOutReason",
  "morningTimeIn", "morningTimeOut", "afternoonTimeIn", "afternoonTimeOut",
  "totalSessions", "createdAt", "updatedAt", "approvedAt", "approvedById", status
)
SELECT
  'att_2025_09_24_early', emp.user_id,
  timestamp '2025-09-24 00:00:00',
  timestamp '2025-09-24 08:00:00',
  timestamp '2025-09-24 16:00:00',
  7.00, FALSE, FALSE,
  'full_day', FALSE, TRUE, 'Personal errand',
  timestamp '2025-09-24 08:00:00', timestamp '2025-09-24 12:00:00',
  timestamp '2025-09-24 13:00:00', timestamp '2025-09-24 16:00:00',
  2, now(), now(), now(), admin.admin_id, 'APPROVED'::"AttendanceStatus"
FROM emp, admin;

-- THU: Half-day (morning only, 4.00 hrs)
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph'
), admin AS (
  SELECT id AS admin_id FROM users WHERE role = 'ADMIN'::"Role" ORDER BY "createdAt" LIMIT 1
)
INSERT INTO attendance_records (
  id, "userId", "date", "timeIn", "timeOut", "hoursWorked", "isLate", "isAbsent",
  "sessionType", "isHalfDay", "isEarlyOut", "earlyOutReason",
  "morningTimeIn", "morningTimeOut", "afternoonTimeIn", "afternoonTimeOut",
  "totalSessions", "createdAt", "updatedAt", "approvedAt", "approvedById", status
)
SELECT
  'att_2025_09_25_half', emp.user_id,
  timestamp '2025-09-25 00:00:00',
  timestamp '2025-09-25 08:00:00',
  timestamp '2025-09-25 12:00:00',
  4.00, FALSE, FALSE,
  'morning', TRUE, FALSE, NULL,
  timestamp '2025-09-25 08:00:00', timestamp '2025-09-25 12:00:00',
  NULL, NULL,
  1, now(), now(), now(), admin.admin_id, 'APPROVED'::"AttendanceStatus"
FROM emp, admin;

-- FRI: Absent (no hours)
WITH emp AS (
  SELECT id AS user_id FROM users WHERE email = 'juan.delacruz@bisu.edu.ph'
), admin AS (
  SELECT id AS admin_id FROM users WHERE role = 'ADMIN'::"Role" ORDER BY "createdAt" LIMIT 1
)
INSERT INTO attendance_records (
  id, "userId", "date", "timeIn", "timeOut", "hoursWorked", "isLate", "isAbsent",
  "sessionType", "isHalfDay", "isEarlyOut", "earlyOutReason",
  "morningTimeIn", "morningTimeOut", "afternoonTimeIn", "afternoonTimeOut",
  "totalSessions", "createdAt", "updatedAt", "approvedAt", "approvedById", status
)
SELECT
  'att_2025_09_26_absent', emp.user_id,
  timestamp '2025-09-26 00:00:00',
  NULL, NULL,
  NULL, FALSE, TRUE,
  NULL, FALSE, FALSE, NULL,
  NULL, NULL, NULL, NULL,
  0, now(), now(), now(), admin.admin_id, 'APPROVED'::"AttendanceStatus"
FROM emp, admin;

COMMIT;


