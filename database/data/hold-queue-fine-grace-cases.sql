-- Hold queue cases where queue front user has outstanding fines.
-- Case 1: Grace period still active.
-- Case 2: Grace period expired but still unpaid (not yet processed by fine update path).
-- Users are intentionally disjoint across cases:
-- - Case 1 uses qcase1-front + qcase1-next
-- - Case 2 uses qcase2-front + qcase2-next

-- Fresh accounts dedicated to queue/grace testing so no pre-existing fines interfere.
INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase1.front@lib.com',
  src.password,
  'CaseOne',
  NULL,
  'Front',
  0
FROM user_account src
WHERE src.email = 'student3.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase1.front@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase1.next@lib.com',
  src.password,
  'CaseOne',
  NULL,
  'Next',
  0
FROM user_account src
WHERE src.email = 'student3.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase1.next@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase2.front@lib.com',
  src.password,
  'CaseTwo',
  NULL,
  'Front',
  1
FROM user_account src
WHERE src.email = 'faculty.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase2.front@lib.com'
  )
LIMIT 1;

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase2.next@lib.com',
  src.password,
  'CaseTwo',
  NULL,
  'Next',
  0
FROM user_account src
WHERE src.email = 'student3.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase2.next@lib.com'
  )
LIMIT 1;

SET @case1_front_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase1.front@lib.com'
 LIMIT 1
);

SET @case1_next_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase1.next@lib.com'
 LIMIT 1
);

SET @case2_front_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase2.front@lib.com'
 LIMIT 1
);

SET @case2_next_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase2.next@lib.com'
 LIMIT 1
);

-- ---------------------------------------------------------------------------
-- Dedicated out-of-stock items for queue testing
-- ---------------------------------------------------------------------------

SET @librarian_id = (
 SELECT staff_id
 FROM staff_account
 WHERE email = 'librarian.staff@lib.com'
 LIMIT 1
);

SET @book_code = (
 SELECT item_code
 FROM item_type
 WHERE item_type = 'Book'
 LIMIT 1
);

SET @equipment_code = (
 SELECT item_code
 FROM item_type
 WHERE item_type = 'Rental Equipment'
 LIMIT 1
);

-- User that keeps the queue-case items checked out so inventory is effectively out-of-stock.
INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase.stockholder@lib.com',
  src.password,
  'QueueCase',
  NULL,
  'Stockholder',
  0
FROM user_account src
WHERE src.email = 'student3.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase.stockholder@lib.com'
  )
LIMIT 1;

SET @qcase_stockholder_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase.stockholder@lib.com'
 LIMIT 1
);

-- Item for case 1 queue: out-of-stock book copy.
INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
SELECT @book_code, 'Queue Case - Academic Statistics Handbook', NULL, 58.00, 1, @librarian_id
WHERE @book_code IS NOT NULL
  AND @librarian_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM item i
    WHERE i.title = 'Queue Case - Academic Statistics Handbook'
  );

SET @case1_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'Queue Case - Academic Statistics Handbook'
 ORDER BY item_id DESC
 LIMIT 1
);

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT @case1_item_id, 'Nora Whitfield', '3rd', 'Northbridge Academic Press', '2021-08-10'
WHERE @case1_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM book b
    WHERE b.item_id = @case1_item_id
  );

-- Item for case 2 queue: out-of-stock equipment.
INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
SELECT @equipment_code, 'Queue Case - Sony WH-1000XM5 Headphones', NULL, 399.00, 1, @librarian_id
WHERE @equipment_code IS NOT NULL
  AND @librarian_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM item i
    WHERE i.title = 'Queue Case - Sony WH-1000XM5 Headphones'
  );

SET @case2_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'Queue Case - Sony WH-1000XM5 Headphones'
 ORDER BY item_id DESC
 LIMIT 1
);

INSERT INTO rental_equipment (item_id)
SELECT @case2_item_id
WHERE @case2_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM rental_equipment re
    WHERE re.item_id = @case2_item_id
  );

-- Keep both queue items actively borrowed by another user so stock becomes zero.
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case1_item_id, @qcase_stockholder_user_id, '2026-04-14 08:30:00', '2026-04-21 08:30:00', NULL
WHERE @case1_item_id IS NOT NULL
  AND @qcase_stockholder_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM borrow b
    WHERE b.item_id = @case1_item_id
      AND b.user_id = @qcase_stockholder_user_id
      AND b.return_date IS NULL
  );

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case2_item_id, @qcase_stockholder_user_id, '2026-04-14 08:40:00', '2026-04-21 08:40:00', NULL
WHERE @case2_item_id IS NOT NULL
  AND @qcase_stockholder_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM borrow b
    WHERE b.item_id = @case2_item_id
      AND b.user_id = @qcase_stockholder_user_id
      AND b.return_date IS NULL
  );

-- ---------------------------------------------------------------------------
-- Case 1: Active grace at front of queue (item: Queue Case - Academic Statistics Handbook)
-- Front: qcase1.front@lib.com (unpaid fine inserted now -> grace active)
-- Next:  qcase1.next@lib.com
-- ---------------------------------------------------------------------------

SET @case1_fine_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'Apollo 13'
 LIMIT 1
);

SET @case1_checkout_ts = '2026-04-15 09:00:00';

INSERT INTO hold_item (item_id, user_id, request_datetime)
SELECT @case1_item_id, @case1_front_user_id, '2026-04-16 09:00:00'
WHERE @case1_item_id IS NOT NULL
  AND @case1_front_user_id IS NOT NULL;

INSERT INTO hold_item (item_id, user_id, request_datetime)
SELECT @case1_item_id, @case1_next_user_id, '2026-04-16 09:05:00'
WHERE @case1_item_id IS NOT NULL
  AND @case1_next_user_id IS NOT NULL;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case1_fine_item_id, @case1_front_user_id, @case1_checkout_ts, '2026-04-16 09:00:00', '2026-04-17 09:00:00'
WHERE @case1_fine_item_id IS NOT NULL
  AND @case1_front_user_id IS NOT NULL;

INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
SELECT @case1_fine_item_id, @case1_front_user_id, @case1_checkout_ts, 11.25, 0.00
WHERE @case1_fine_item_id IS NOT NULL
  AND @case1_front_user_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Case 2: Expired grace at front of queue (item: Queue Case - Sony WH-1000XM5 Headphones)
-- Front: qcase2.front@lib.com (grace manually moved to past; still unpaid)
-- Next:  qcase2.next@lib.com
-- ---------------------------------------------------------------------------

SET @case2_fine_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'The Hobbit'
 LIMIT 1
);

SET @case2_checkout_ts = '2026-04-13 14:00:00';

INSERT INTO hold_item (item_id, user_id, request_datetime)
SELECT @case2_item_id, @case2_front_user_id, '2026-04-14 08:00:00'
WHERE @case2_item_id IS NOT NULL
  AND @case2_front_user_id IS NOT NULL;

INSERT INTO hold_item (item_id, user_id, request_datetime)
SELECT @case2_item_id, @case2_next_user_id, '2026-04-14 08:05:00'
WHERE @case2_item_id IS NOT NULL
  AND @case2_next_user_id IS NOT NULL;

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case2_fine_item_id, @case2_front_user_id, @case2_checkout_ts, '2026-04-14 14:00:00', '2026-04-15 14:00:00'
WHERE @case2_fine_item_id IS NOT NULL
  AND @case2_front_user_id IS NOT NULL;

INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
SELECT @case2_fine_item_id, @case2_front_user_id, @case2_checkout_ts, 13.75, 0.00
WHERE @case2_fine_item_id IS NOT NULL
  AND @case2_front_user_id IS NOT NULL;

-- Keep hold open but mark grace as expired to emulate "past grace" state.
UPDATE hold_item
   SET grace_started_at = DATE_SUB(NOW(), INTERVAL 30 HOUR),
       grace_expires_at = DATE_SUB(NOW(), INTERVAL 6 HOUR)
 WHERE item_id = @case2_item_id
  AND user_id = @case2_front_user_id
   AND request_datetime = '2026-04-14 08:00:00'
   AND close_datetime IS NULL;

-- Fire queue reassignment logic for case 2 by returning the active stockholder borrow.
-- Expected outcome:
-- 1) qcase2.front hold is closed (grace expired + unpaid fine)
-- 2) qcase2.next receives a "Hold ready for pickup" notification
UPDATE borrow
   SET return_date = NOW()
 WHERE item_id = @case2_item_id
   AND user_id = @qcase_stockholder_user_id
   AND return_date IS NULL
 ORDER BY checkout_date ASC
 LIMIT 1;

-- ---------------------------------------------------------------------------
-- Case 3: User is in active grace when stock returns (must NOT become pickup-ready)
-- Then fine is paid and a later return makes the hold pickup-ready.
-- ---------------------------------------------------------------------------

INSERT INTO user_account (email, password, first_name, middle_name, last_name, is_faculty)
SELECT
  'qcase3.front@lib.com',
  src.password,
  'CaseThree',
  NULL,
  'Front',
  0
FROM user_account src
WHERE src.email = 'student3.user@lib.com'
  AND NOT EXISTS (
    SELECT 1
    FROM user_account u
    WHERE u.email = 'qcase3.front@lib.com'
  )
LIMIT 1;

SET @case3_front_user_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'qcase3.front@lib.com'
 LIMIT 1
);

INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
SELECT @book_code, 'Queue Case - Grace Gate Test Book', NULL, 42.00, 1, @librarian_id
WHERE @book_code IS NOT NULL
  AND @librarian_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM item i
    WHERE i.title = 'Queue Case - Grace Gate Test Book'
  );

SET @case3_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'Queue Case - Grace Gate Test Book'
 ORDER BY item_id DESC
 LIMIT 1
);

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT @case3_item_id, 'Maya Chen', '1st', 'Queue Testing Press', '2022-03-01'
WHERE @case3_item_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM book b
    WHERE b.item_id = @case3_item_id
  );

-- Start out-of-stock with stockholder active borrow.
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case3_item_id, @qcase_stockholder_user_id, '2026-04-14 09:00:00', '2026-04-21 09:00:00', NULL
WHERE @case3_item_id IS NOT NULL
  AND @qcase_stockholder_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM borrow b
    WHERE b.item_id = @case3_item_id
      AND b.user_id = @qcase_stockholder_user_id
      AND b.return_date IS NULL
  );

-- Front user holds item while stock is unavailable.
INSERT INTO hold_item (item_id, user_id, request_datetime)
SELECT @case3_item_id, @case3_front_user_id, '2026-04-16 10:00:00'
WHERE @case3_item_id IS NOT NULL
  AND @case3_front_user_id IS NOT NULL;

-- Create unpaid fine so this user is blocked and should enter grace.
SET @case3_fine_item_id = (
 SELECT item_id
 FROM item
 WHERE title = 'Apollo 13'
 LIMIT 1
);

SET @case3_checkout_ts = '2026-04-15 10:00:00';

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case3_fine_item_id, @case3_front_user_id, @case3_checkout_ts, '2026-04-16 10:00:00', '2026-04-17 10:00:00'
WHERE @case3_fine_item_id IS NOT NULL
  AND @case3_front_user_id IS NOT NULL;

INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
SELECT @case3_fine_item_id, @case3_front_user_id, @case3_checkout_ts, 9.50, 0.00
WHERE @case3_fine_item_id IS NOT NULL
  AND @case3_front_user_id IS NOT NULL;

-- First return event while user still has unpaid fine.
-- Expected: hold enters grace (no pickup-ready assignment yet).
UPDATE borrow
   SET return_date = NOW()
 WHERE item_id = @case3_item_id
   AND user_id = @qcase_stockholder_user_id
   AND return_date IS NULL
 ORDER BY checkout_date ASC
 LIMIT 1;

-- User pays fine while grace is active.
UPDATE fined_for
   SET amount_paid = amount
 WHERE item_id = @case3_fine_item_id
   AND user_id = @case3_front_user_id
   AND checkout_date = @case3_checkout_ts;

-- Recreate out-of-stock and trigger another return event.
-- Expected: now that fine is paid, hold becomes pickup-ready and user gets notification.
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT @case3_item_id, @qcase_stockholder_user_id, '2026-04-18 09:30:00', '2026-04-25 09:30:00', NULL
WHERE @case3_item_id IS NOT NULL
  AND @qcase_stockholder_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM borrow b
    WHERE b.item_id = @case3_item_id
      AND b.user_id = @qcase_stockholder_user_id
      AND b.checkout_date = '2026-04-18 09:30:00'
  );

UPDATE borrow
   SET return_date = NOW()
 WHERE item_id = @case3_item_id
   AND user_id = @qcase_stockholder_user_id
   AND checkout_date = '2026-04-18 09:30:00'
   AND return_date IS NULL
 LIMIT 1;
