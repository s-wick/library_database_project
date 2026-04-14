-- Extra sample data set (separate from core seeds)
-- Adds 5 additional user accounts and a month-long borrow history.
-- Intended to run AFTER users.sql and items.sql are already loaded.

-- 1) Create five additional users with the same seeded password hash/value as existing users.
INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'student3.user@lib.com',
  src.password,
  'Avery',
  NULL,
  'Brooks',
  0
FROM user_account src
WHERE src.email = 'student1.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'student3.user@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'student4.user@lib.com',
  src.password,
  'Noah',
  NULL,
  'Patel',
  0
FROM user_account src
WHERE src.email = 'student1.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'student4.user@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'student5.user@lib.com',
  src.password,
  'Mina',
  NULL,
  'Alvarez',
  0
FROM user_account src
WHERE src.email = 'student1.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'student5.user@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'student6.user@lib.com',
  src.password,
  'Ethan',
  NULL,
  'Wright',
  0
FROM user_account src
WHERE src.email = 'student1.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'student6.user@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'faculty2.user@lib.com',
  src.password,
  'Sofia',
  NULL,
  'Romero',
  1
FROM user_account src
WHERE src.email = 'faculty.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'faculty2.user@lib.com'
  )
LIMIT 1;

SET @student3_id = (
  SELECT user_id
  FROM user_account
  WHERE email = 'student3.user@lib.com'
  LIMIT 1
);

SET @student4_id = (
  SELECT user_id
  FROM user_account
  WHERE email = 'student4.user@lib.com'
  LIMIT 1
);

SET @student5_id = (
  SELECT user_id
  FROM user_account
  WHERE email = 'student5.user@lib.com'
  LIMIT 1
);

SET @student6_id = (
  SELECT user_id
  FROM user_account
  WHERE email = 'student6.user@lib.com'
  LIMIT 1
);

SET @faculty2_id = (
  SELECT user_id
  FROM user_account
  WHERE email = 'faculty2.user@lib.com'
  LIMIT 1
);

-- 2) Month-long borrow history (2026-03-15 through 2026-04-14).
-- Notes:
-- - Student due dates follow 7-day windows.
-- - Faculty due dates follow 14-day windows.
-- - Active borrows per user are kept under trigger limits.

-- student3.user@lib.com
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-03-15 09:05:00', '2026-03-22 09:05:00', '2026-03-21 13:20:00'
FROM item WHERE title = 'To Kill a Mockingbird' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-03-20 10:30:00', '2026-03-27 10:30:00', '2026-03-27 09:10:00'
FROM item WHERE title = 'Atomic Habits' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-03-26 11:10:00', '2026-04-02 11:10:00', '2026-04-01 17:45:00'
FROM item WHERE title = 'Apollo 13' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-04-01 14:20:00', '2026-04-08 14:20:00', '2026-04-07 12:35:00'
FROM item WHERE title = 'The Great Gatsby' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-04-06 08:55:00', '2026-04-13 08:55:00', NULL
FROM item WHERE title = 'Inception' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student3_id, '2026-04-10 15:15:00', '2026-04-17 15:15:00', NULL
FROM item WHERE title = '1984' LIMIT 1;

-- student4.user@lib.com
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-03-16 09:25:00', '2026-03-23 09:25:00', '2026-03-22 16:10:00'
FROM item WHERE title = 'Pride and Prejudice' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-03-21 13:10:00', '2026-03-28 13:10:00', '2026-03-27 11:00:00'
FROM item WHERE title = 'The Social Network' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-03-28 10:00:00', '2026-04-04 10:00:00', '2026-04-03 18:20:00'
FROM item WHERE title = 'Sapiens' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-04-03 16:40:00', '2026-04-10 16:40:00', '2026-04-10 09:40:00'
FROM item WHERE title = 'Shure SM58 Microphone' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-04-07 11:35:00', '2026-04-14 11:35:00', NULL
FROM item WHERE title = 'Interstellar' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student4_id, '2026-04-09 09:20:00', '2026-04-16 09:20:00', NULL
FROM item WHERE title = 'The Hobbit' LIMIT 1;

-- student5.user@lib.com
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-03-17 08:40:00', '2026-03-24 08:40:00', '2026-03-24 08:15:00'
FROM item WHERE title = 'Educated' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-03-24 14:10:00', '2026-03-31 14:10:00', '2026-03-30 17:25:00'
FROM item WHERE title = 'Hidden Figures' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-03-30 12:05:00', '2026-04-06 12:05:00', '2026-04-05 12:20:00'
FROM item WHERE title = 'The Martian' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-04-05 09:30:00', '2026-04-12 09:30:00', '2026-04-11 14:00:00'
FROM item WHERE title = 'Canon EOS Rebel T7 Camera Kit' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-04-08 10:45:00', '2026-04-15 10:45:00', NULL
FROM item WHERE title = 'To Kill a Mockingbird' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student5_id, '2026-04-11 16:25:00', '2026-04-18 16:25:00', NULL
FROM item WHERE title = 'Becoming' LIMIT 1;

-- student6.user@lib.com
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-03-18 10:20:00', '2026-03-25 10:20:00', '2026-03-24 15:00:00'
FROM item WHERE title = '1984' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-03-25 08:55:00', '2026-04-01 08:55:00', '2026-03-31 09:05:00'
FROM item WHERE title = 'Apollo 13' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-03-31 11:45:00', '2026-04-07 11:45:00', '2026-04-06 13:30:00'
FROM item WHERE title = 'Dell Latitude 5440 Laptop' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-04-04 14:15:00', '2026-04-11 14:15:00', '2026-04-10 18:50:00'
FROM item WHERE title = 'The Great Gatsby' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-04-09 09:05:00', '2026-04-16 09:05:00', NULL
FROM item WHERE title = 'The Social Network' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student6_id, '2026-04-12 12:10:00', '2026-04-19 12:10:00', NULL
FROM item WHERE title = 'Sapiens' LIMIT 1;

-- faculty2.user@lib.com
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-03-15 09:40:00', '2026-03-29 09:40:00', '2026-03-28 10:10:00'
FROM item WHERE title = 'The Hobbit' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-03-22 15:10:00', '2026-04-05 15:10:00', '2026-04-04 08:45:00'
FROM item WHERE title = 'Atomic Habits' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-03-28 13:00:00', '2026-04-11 13:00:00', NULL
FROM item WHERE title = 'Inception' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-04-02 10:50:00', '2026-04-16 10:50:00', NULL
FROM item WHERE title = 'Canon EOS Rebel T7 Camera Kit' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-04-06 09:35:00', '2026-04-20 09:35:00', NULL
FROM item WHERE title = 'Pride and Prejudice' LIMIT 1;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty2_id, '2026-04-10 14:40:00', '2026-04-24 14:40:00', NULL
FROM item WHERE title = 'Interstellar' LIMIT 1;
