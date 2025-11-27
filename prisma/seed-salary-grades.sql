-- Seed Salary Grades for BISUpayroll (PostgreSQL Version)
-- Run this SQL file to insert/update salary grades in the database
-- Note: This is for PostgreSQL. The schema uses 'grade' as unique, representing the SSL Salary Grade.
-- Each salary grade maps to ONE position-rank combination as per 2024 SSL.

-- Clear existing salary grades
DELETE FROM salary_grades;

-- Salary Grade 1-6: Administrative Aides (Non-Teaching Staff)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 1, 'Administrative Aide', 1, 14061.00, 639.14, 'Administrative Aide 1 - SG 1', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 2, 'Administrative Aide', 2, 14925.00, 678.41, 'Administrative Aide 2 - SG 2', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 3, 'Administrative Aide', 3, 15852.00, 720.55, 'Administrative Aide 3 - SG 3', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 4, 'Administrative Aide', 4, 16833.00, 765.14, 'Administrative Aide 4 - SG 4', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 5, 'Administrative Aide', 5, 17866.00, 812.09, 'Administrative Aide 5 - SG 5', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 6, 'Administrative Aide', 6, 18957.00, 861.68, 'Administrative Aide 6 - SG 6', true, NOW(), NOW(), NOW());

-- Salary Grade 7-8: Administrative Assistants (Non-Teaching Staff)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 7, 'Administrative Assistant', 1, 20110.00, 914.09, 'Administrative Assistant 1 - SG 7', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 8, 'Administrative Assistant', 2, 21448.00, 974.91, 'Administrative Assistant 2 - SG 8', true, NOW(), NOW(), NOW());

-- Salary Grade 9: Senior Administrative Assistant (or Project Staff)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 9, 'Administrative Assistant', 3, 23176.00, 1053.45, 'Administrative Assistant 3 - SG 9', true, NOW(), NOW(), NOW());

-- Salary Grade 10-11: Administrative Officers (Non-Teaching Staff)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 10, 'Administrative Officer', 1, 25586.00, 1163.00, 'Administrative Officer 1 - SG 10', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 11, 'Administrative Officer', 2, 30024.00, 1364.73, 'Administrative Officer 2 - SG 11', true, NOW(), NOW(), NOW());

-- Salary Grade 12-14: Instructors (Teaching Personnel)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 12, 'Instructor', 1, 32245.00, 1465.68, 'Instructor 1 - SG 12', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 13, 'Instructor', 2, 34421.00, 1564.59, 'Instructor 2 - SG 13', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 14, 'Instructor', 3, 37024.00, 1682.91, 'Instructor 3 - SG 14', true, NOW(), NOW(), NOW());

-- Salary Grade 15-18: Assistant Professors (Teaching Personnel)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 15, 'Assistant Professor', 1, 40208.00, 1827.64, 'Assistant Professor 1 - SG 15', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 16, 'Assistant Professor', 2, 43560.00, 1980.00, 'Assistant Professor 2 - SG 16', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 17, 'Assistant Professor', 3, 47247.00, 2147.59, 'Assistant Professor 3 - SG 17', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 18, 'Assistant Professor', 4, 51304.00, 2332.00, 'Assistant Professor 4 - SG 18', true, NOW(), NOW(), NOW());

-- Salary Grade 19-23: Associate Professors (Teaching Personnel)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 19, 'Associate Professor', 1, 56390.00, 2563.18, 'Associate Professor 1 - SG 19', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 20, 'Associate Professor', 2, 62967.00, 2862.14, 'Associate Professor 2 - SG 20', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 21, 'Associate Professor', 3, 70103.00, 3186.50, 'Associate Professor 3 - SG 21', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 22, 'Associate Professor', 4, 78162.00, 3552.82, 'Associate Professor 4 - SG 22', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 23, 'Associate Professor', 5, 87315.00, 3968.86, 'Associate Professor 5 - SG 23', true, NOW(), NOW(), NOW());

-- Salary Grade 24-29: Professors (Teaching Personnel)
INSERT INTO salary_grades (id, grade, position, rank, monthly_rate, daily_rate, description, is_active, effective_date, created_at, updated_at)
VALUES 
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 24, 'Professor', 1, 98185.00, 4462.95, 'Professor 1 - SG 24', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 25, 'Professor', 2, 111727.00, 5078.50, 'Professor 2 - SG 25', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 26, 'Professor', 3, 126252.00, 5738.73, 'Professor 3 - SG 26', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 27, 'Professor', 4, 142663.00, 6484.68, 'Professor 4 - SG 27', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 28, 'Professor', 5, 160469.00, 7294.05, 'Professor 5 - SG 28', true, NOW(), NOW(), NOW()),
  (CONCAT('sg_', REPLACE(gen_random_uuid()::text, '-', '')), 29, 'Professor', 6, 180492.00, 8204.18, 'Professor 6 - SG 29', true, NOW(), NOW(), NOW());

-- Verify insertion
SELECT * FROM salary_grades ORDER BY grade;
