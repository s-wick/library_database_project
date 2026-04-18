-- sample-base-date: 2026-04-18
-- sample-shift-days: 0
-- Borrow transactions

SET @student1_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'student1.user@lib.com'
 LIMIT 1
);

SET @student2_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'student2.user@lib.com'
 LIMIT 1
);

SET @faculty_id = (
 SELECT user_id
 FROM user_account
 WHERE email = 'faculty.user@lib.com'
 LIMIT 1
);

-- Student user has borrowed some items (not overdue)
-- sample-shift-days-next: 0
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student1_id, '2026-04-15 10:00:00', '2026-04-22 10:00:00', NULL
FROM item
WHERE title = 'To Kill a Mockingbird';

-- Student user has a book due tomorrow
-- sample-shift-days-next: 0
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student1_id, '2026-04-11 12:00:00', '2026-04-19 12:00:00', NULL
FROM item
WHERE title = 'Pride and Prejudice';

-- Student user 2 is overdue (due date more than 7 days before sample-base-date)

-- sample-shift-days-next: -7
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student2_id, '2026-03-06 09:15:00', '2026-03-13 09:15:00', NULL
FROM item
WHERE title = 'The Great Gatsby';

-- sample-shift-days-next: -7
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student2_id, '2026-03-08 11:00:00', '2026-03-15 11:00:00', NULL
FROM item
WHERE title = 'Pride and Prejudice';

-- Faculty user is overdue (due date more than 14 days before sample-base-date)

-- sample-shift-days-next: -14
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty_id, '2026-01-29 13:20:00', '2026-02-12 13:20:00', NULL
FROM item
WHERE title = 'The Hobbit';

-- sample-shift-days-next: -14
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty_id, '2026-02-01 16:45:00', '2026-02-15 16:45:00', NULL
FROM item
WHERE title = 'Dell Latitude 5440 Laptop';
