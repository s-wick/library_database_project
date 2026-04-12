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

SET @audio_code = (
	SELECT item_code
	FROM item_type
	WHERE item_type = 'Audio'
	LIMIT 1
);

SET @video_code = (
	SELECT item_code
	FROM item_type
	WHERE item_type = 'Video'
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

-- Audiobooks

INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
VALUES
	(@audio_code, 'Atomic Habits (Audio)', NULL, 24.99, 4, @librarian_id),
	(@audio_code, 'Becoming (Audio)', NULL, 21.50, 3, @librarian_id),
	(@audio_code, 'Educated (Audio)', NULL, 19.75, 2, @librarian_id),
	(@audio_code, 'The Martian (Audio)', NULL, 17.25, 5, @librarian_id),
	(@audio_code, 'Sapiens (Audio)', NULL, 22.40, 3, @librarian_id);

INSERT INTO audio (item_id, audio_length_seconds, audio_file)
SELECT item_id, 36000, X''
FROM item
WHERE title = 'Atomic Habits (Audio)';

INSERT INTO audio (item_id, audio_length_seconds, audio_file)
SELECT item_id, 72000, X''
FROM item
WHERE title = 'Becoming (Audio)';

INSERT INTO audio (item_id, audio_length_seconds, audio_file)
SELECT item_id, 36000, X''
FROM item
WHERE title = 'Educated (Audio)';

INSERT INTO audio (item_id, audio_length_seconds, audio_file)
SELECT item_id, 39600, X''
FROM item
WHERE title = 'The Martian (Audio)';

INSERT INTO audio (item_id, audio_length_seconds, audio_file)
SELECT item_id, 54000, X''
FROM item
WHERE title = 'Sapiens (Audio)';

-- Videos

INSERT INTO item (item_type_code, title, thumbnail_image, monetary_value, inventory, created_by)
VALUES
	(@video_code, 'Apollo 13 (Video)', NULL, 14.99, 2, @librarian_id),
	(@video_code, 'Inception (Video)', NULL, 13.50, 4, @librarian_id),
	(@video_code, 'Hidden Figures (Video)', NULL, 12.75, 3, @librarian_id),
	(@video_code, 'Interstellar (Video)', NULL, 15.25, 2, @librarian_id),
	(@video_code, 'The Social Network (Video)', NULL, 11.40, 4, @librarian_id);

INSERT INTO video (item_id, video_length_seconds, video_file)
SELECT item_id, 8400, X''
FROM item
WHERE title = 'Apollo 13 (Video)';

INSERT INTO video (item_id, video_length_seconds, video_file)
SELECT item_id, 8880, X''
FROM item
WHERE title = 'Inception (Video)';

INSERT INTO video (item_id, video_length_seconds, video_file)
SELECT item_id, 7620, X''
FROM item
WHERE title = 'Hidden Figures (Video)';

INSERT INTO video (item_id, video_length_seconds, video_file)
SELECT item_id, 10140, X''
FROM item
WHERE title = 'Interstellar (Video)';

INSERT INTO video (item_id, video_length_seconds, video_file)
SELECT item_id, 7200, X''
FROM item
WHERE title = 'The Social Network (Video)';
