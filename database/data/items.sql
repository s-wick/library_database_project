-- Item types

INSERT INTO item_type (item_type)
VALUES
	('Book'),
	('Audio'),
	('Video'),
	('Rental Equipment');

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

-- Books

INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
VALUES
	(@book_code, 'To Kill a Mockingbird', NULL, 18.99, 4, @librarian_id),
	(@book_code, '1984', NULL, 16.50, 5, @librarian_id),
	(@book_code, 'The Great Gatsby', NULL, 14.25, 3, @librarian_id),
	(@book_code, 'Pride and Prejudice', NULL, 12.75, 4, @librarian_id),
	(@book_code, 'The Hobbit', NULL, 17.40, 2, @librarian_id);

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT item_id, 'Harper Lee', '50th Anniversary', 'J.B. Lippincott & Co.', '1960-07-11'
FROM item
WHERE title = 'To Kill a Mockingbird';

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT item_id, 'George Orwell', '1st', 'Secker & Warburg', '1949-06-08'
FROM item
WHERE title = '1984';

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT item_id, 'F. Scott Fitzgerald', '1st', 'Charles Scribner''s Sons', '1925-04-10'
FROM item
WHERE title = 'The Great Gatsby';

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT item_id, 'Jane Austen', '1st', 'T. Egerton', '1813-01-28'
FROM item
WHERE title = 'Pride and Prejudice';

INSERT INTO book (item_id, author, edition, publication, publication_date)
SELECT item_id, 'J.R.R. Tolkien', '1st', 'George Allen & Unwin', '1937-09-21'
FROM item
WHERE title = 'The Hobbit';

-- Rental equipment

INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
VALUES
	(@equipment_code, 'Canon EOS Rebel T7 Camera Kit', NULL, 499.00, 2, @librarian_id),
	(@equipment_code, 'Dell Latitude 5440 Laptop', NULL, 1099.00, 3, @librarian_id),
	(@equipment_code, 'Shure SM58 Microphone', NULL, 99.00, 5, @librarian_id);

INSERT INTO rental_equipment (item_id)
SELECT item_id
FROM item
WHERE title IN (
	'Canon EOS Rebel T7 Camera Kit',
	'Dell Latitude 5440 Laptop',
	'Shure SM58 Microphone'
);
