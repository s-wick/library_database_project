-- Holds and fines test data

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

-- Student 1 places a hold on an item that is currently in stock.
INSERT INTO hold_item (item_id, user_id)
SELECT item_id, @student1_id
FROM item
WHERE title = 'Apollo 13'
LIMIT 1;

-- Student 2 places a hold, then receives a fine that removes holds.
INSERT INTO hold_item (item_id, user_id)
SELECT item_id, @student2_id
FROM item
WHERE title = 'Inception'
LIMIT 1;

SET @fine_checkout_ts = DATE_SUB(NOW(), INTERVAL 3 DAY);

INSERT INTO borrow (item_id, user_id, checkout_date, due_date, return_date)
SELECT item_id, @student2_id, @fine_checkout_ts, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL
FROM item
WHERE title = '1984'
LIMIT 1;

INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
SELECT item_id, @student2_id, @fine_checkout_ts, 12.50, 0.00
FROM item
WHERE title = '1984'
LIMIT 1;
