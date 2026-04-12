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

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student1_id, '2026-04-08 10:00:00', '2026-04-15 10:00:00', NULL
FROM item
WHERE title = 'To Kill a Mockingbird';

-- Student user has a book due tomorrow
INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student1_id, '2026-04-10 12:00:00', '2026-04-12 12:00:00', NULL
FROM item
WHERE title = 'Pride and Prejudice';

-- Student user 2 is overdue (due date more than 7 days before 2026-04-11)

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student2_id, '2026-03-20 09:15:00', '2026-03-27 09:15:00', NULL
FROM item
WHERE title = '1984';

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student2_id, '2026-03-22 11:00:00', '2026-03-29 11:00:00', NULL
FROM item
WHERE title = 'Pride and Prejudice';

-- Faculty user is overdue (due date more than 14 days before 2026-04-11)

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty_id, '2026-03-05 13:20:00', '2026-03-19 13:20:00', NULL
FROM item
WHERE title = 'The Hobbit';

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @faculty_id, '2026-03-08 16:45:00', '2026-03-22 16:45:00', NULL
FROM item
WHERE title = 'Dell Latitude 5440 Laptop';
