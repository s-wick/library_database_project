-- ==================================================
-- Library Database Sample Data
-- No image table / no image item type
-- Requires: library_schema.sql
-- ==================================================

USE `librarydatabase`;

-- ==================================================
-- USERS
-- ==================================================

INSERT INTO `student_user`
(`student_id`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `borrowed_items`, `fines`, `user_type_code`)
VALUES
(1001, 'emma.johnson@uni.edu', 'pass123', 'Emma', NULL, 'Johnson', 2, 0, 1),
(1002, 'liam.smith@uni.edu', 'pass123', 'Liam', NULL, 'Smith', 1, 1, 1),
(1003, 'olivia.brown@uni.edu', 'pass123', 'Olivia', 'Grace', 'Brown', 0, 0, 1),
(1004, 'noah.davis@uni.edu', 'pass123', 'Noah', NULL, 'Davis', 3, 0, 1),
(1005, 'ava.miller@uni.edu', 'pass123', 'Ava', NULL, 'Miller', 1, 0, 1);

INSERT INTO `faculty_user`
(`faculty_id`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `borrowed_items`, `fines`, `user_type_code`)
VALUES
(2001, 'daniel.anderson@uni.edu', 'pass123', 'Daniel', NULL, 'Anderson', 2, 0, 2),
(2002, 'mia.thomas@uni.edu', 'pass123', 'Mia', NULL, 'Thomas', 1, 0, 2),
(2003, 'william.jackson@uni.edu', 'pass123', 'William', 'R.', 'Jackson', 0, 0, 2);

INSERT INTO `librarian`
(`librarian_id`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `phone_number`)
VALUES
(3001, 'maria.garcia@library.com', 'admin123', 'Maria', 'Beth', 'Garcia', '555-210-3001'),
(3002, 'henry.martin@library.com', 'admin123', 'Henry', 'John', 'Martin', '555-210-3002');

INSERT INTO `system_administrator`
(`administrator_id`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `phone_number`)
VALUES
(4001, 'sysadmin1@library.com', 'admin123', 'System', 'Admin', 'Admin1', '555-900-4001'),
(4002, 'sysadmin2@library.com', 'admin123', 'System', 'Admin', 'Admin2', '555-900-4002');

-- ==================================================
-- ROOMS
-- ==================================================

INSERT INTO `meeting_room`
(`room_number`, `capacity`, `has_projector`, `has_whiteboard`)
VALUES
('R101', 2, 0, 1),
('R102', 4, 1, 1),
('R201', 8, 1, 1),
('R202', 12, 1, 0),
('R301', 20, 1, 1),
('R302', 30, 0, 1);

-- ==================================================
-- BOOKS (10)
-- ==================================================

INSERT INTO `book`
(`book_id`, `title`, `author`, `edition`, `publication`, `publication_date`, `thumbnail_image`, `monetary_value`, `books_in_stock`, `online_pdf_url`, `created_at`, `created_by`, `item_type_code`)
VALUES
(1, 'Database Systems Concepts', 'Abraham Silberschatz', '7th', 'McGraw-Hill', '2019-01-15', NULL, 89.99, 6, NULL, '2026-03-22', 'sysadmin1', 1),
(2, 'Operating System Concepts', 'Abraham Silberschatz', '10th', 'Wiley', '2018-03-05', NULL, 94.50, 4, NULL, '2026-03-22', 'sysadmin1', 1),
(3, 'Computer Networks', 'Andrew S. Tanenbaum', '5th', 'Pearson', '2016-10-10', NULL, 84.25, 5, NULL, '2026-03-22', 'sysadmin1', 1),
(4, 'Clean Code', 'Robert C. Martin', '1st', 'Prentice Hall', '2008-08-11', NULL, 49.99, 7, NULL, '2026-03-22', 'sysadmin1', 1),
(5, 'Design Patterns', 'Erich Gamma', '1st', 'Addison-Wesley', '1994-10-21', NULL, 54.95, 3, NULL, '2026-03-22', 'sysadmin1', 1),
(6, 'Introduction to Algorithms', 'Thomas H. Cormen', '4th', 'MIT Press', '2022-04-05', NULL, 99.95, 5, NULL, '2026-03-22', 'sysadmin1', 1),
(7, 'Artificial Intelligence: A Modern Approach', 'Stuart Russell', '4th', 'Pearson', '2020-04-28', NULL, 109.99, 2, NULL, '2026-03-22', 'sysadmin1', 1),
(8, 'Python Crash Course', 'Eric Matthes', '3rd', 'No Starch Press', '2023-01-10', NULL, 39.95, 8, NULL, '2026-03-22', 'sysadmin1', 1),
(9, 'The Pragmatic Programmer', 'Andrew Hunt', '2nd', 'Addison-Wesley', '2019-09-13', NULL, 47.99, 6, NULL, '2026-03-22', 'sysadmin1', 1),
(10, 'SQL for Data Analysis', 'Cathy Tanimura', '1st', 'OReilly Media', '2021-12-21', NULL, 44.99, 0, 'https://example.com/sql-for-data-analysis', '2026-03-22', 'sysadmin1', 1);

-- ==================================================
-- VIDEOS (10)
-- ==================================================

INSERT INTO `video`
(`video_id`, `video_name`, `video_length_seconds`, `monetary_value`, `videos_in_stock`, `created_at`, `created_by`, `item_type_code`)
VALUES
(101, 'Intro to Relational Databases', 3600, 29.99, 3, '2026-03-22', 'sysadmin1', 2),
(102, 'Advanced SQL Workshop', 5400, 34.99, 2, '2026-03-22', 'sysadmin1', 2),
(103, 'Networking Fundamentals Lecture Series', 4200, 24.50, 4, '2026-03-22', 'sysadmin1', 2),
(104, 'Software Engineering Best Practices', 3900, 27.75, 2, '2026-03-22', 'sysadmin1', 2),
(105, 'Discrete Math Review', 3000, 19.99, 5, '2026-03-22', 'sysadmin1', 2),
(106, 'Computer Architecture Seminar', 4800, 31.25, 1, '2026-03-22', 'sysadmin1', 2),
(107, 'Research Methods for Students', 2700, 18.50, 6, '2026-03-22', 'sysadmin1', 2),
(108, 'Cybersecurity Basics', 3600, 26.00, 0, '2026-03-22', 'sysadmin1', 2),
(109, 'Version Control with Git', 2500, 17.95, 4, '2026-03-22', 'sysadmin1', 2),
(110, 'Data Structures Crash Review', 4100, 28.40, 3, '2026-03-22', 'sysadmin1', 2);

-- ==================================================
-- AUDIO (10)
-- ==================================================

INSERT INTO `audio`
(`audio_id`, `audio_name`, `audio_length_seconds`, `monetary_value`, `audios_in_stock`, `created_at`, `created_by`, `item_type_code`)
VALUES
(201, 'Learn SQL in 60 Minutes', 3600, 14.99, 5, '2026-03-22', 'sysadmin1', 3),
(202, 'Database Design Essentials', 2700, 12.50, 4, '2026-03-22', 'sysadmin1', 3),
(203, 'Academic Writing for Researchers', 3300, 9.99, 6, '2026-03-22', 'sysadmin1', 3),
(204, 'Public Speaking Fundamentals', 2400, 8.99, 7, '2026-03-22', 'sysadmin1', 3),
(205, 'Linear Algebra Audio Guide', 4000, 15.50, 2, '2026-03-22', 'sysadmin1', 3),
(206, 'Study Skills for Exams', 1800, 6.99, 9, '2026-03-22', 'sysadmin1', 3),
(207, 'Time Management Workshop', 2100, 7.99, 4, '2026-03-22', 'sysadmin1', 3),
(208, 'Research Ethics Overview', 2600, 11.25, 3, '2026-03-22', 'sysadmin1', 3),
(209, 'Intro to Machine Learning Audio', 5000, 16.95, 1, '2026-03-22', 'sysadmin1', 3),
(210, 'Campus Orientation Audio Pack', 1500, 4.99, 0, '2026-03-22', 'sysadmin1', 3);

-- ==================================================
-- RENTAL EQUIPMENT (10)
-- ==================================================

INSERT INTO `rental_equipment`
(`equipment_id`, `rental_name`, `monetary_value`, `equipment_in_stock`, `created_at`, `created_by`, `item_type_code`)
VALUES
(301, 'Dell Latitude Laptop', 999.99, 4, '2026-03-22', 'sysadmin1', 4),
(302, 'Canon DSLR Camera', 899.99, 2, '2026-03-22', 'sysadmin1', 4),
(303, 'Portable Projector', 420.00, 3, '2026-03-22', 'sysadmin1', 4),
(304, 'Audio Recorder Zoom H1n', 129.99, 5, '2026-03-22', 'sysadmin1', 4),
(305, 'Tripod Stand', 45.00, 8, '2026-03-22', 'sysadmin1', 4),
(306, 'Wireless Microphone Kit', 210.00, 3, '2026-03-22', 'sysadmin1', 4),
(307, 'MacBook Air', 999.99, 1, '2026-03-22', 'sysadmin1', 4),
(308, 'HD Webcam', 79.99, 6, '2026-03-22', 'sysadmin1', 4),
(309, 'USB-C Docking Station', 149.99, 0, '2026-03-22', 'sysadmin1', 4),
(310, 'Graphing Calculator', 119.95, 7, '2026-03-22', 'sysadmin1', 4);

-- ==================================================
-- BORROW TRANSACTIONS
-- ==================================================

INSERT INTO `borrow`
(`borrow_transaction_id`, `item_type_code`, `item_id`, `borrower_type`, `borrower_id`, `checkout_date`, `due_date`, `return_date`)
VALUES
(1, 1, 1, 1, 1001, '2026-03-01 10:00:00', '2026-03-15 10:00:00', '2026-03-14 16:30:00'),
(2, 1, 2, 1, 1002, '2026-03-03 11:15:00', '2026-03-17 11:15:00', '2026-03-18 09:00:00'),
(3, 1, 6, 1, 1004, '2026-03-05 09:20:00', '2026-03-19 09:20:00', NULL),
(4, 2, 101, 2, 2001, '2026-03-06 14:00:00', '2026-03-20 14:00:00', '2026-03-18 10:10:00'),
(5, 4, 301, 1, 1005, '2026-03-07 13:45:00', '2026-03-10 13:45:00', '2026-03-10 12:00:00'),
(6, 1, 8, 2, 2002, '2026-03-08 15:10:00', '2026-03-22 15:10:00', NULL),
(7, 3, 201, 1, 1003, '2026-03-09 16:30:00', '2026-03-16 16:30:00', '2026-03-16 09:00:00'),
(8, 1, 10, 1, 1001, '2026-03-10 10:25:00', '2026-03-24 10:25:00', NULL),
(9, 4, 302, 2, 2003, '2026-03-11 12:00:00', '2026-03-14 12:00:00', NULL),
(10, 2, 108, 1, 1004, '2026-03-13 09:30:00', '2026-03-20 09:30:00', NULL),
(11, 4, 309, 2, 2001, '2026-03-14 10:00:00', '2026-03-17 10:00:00', NULL);

-- ==================================================
-- FINES
-- ==================================================

INSERT INTO `fined_for`
(`fine_id`, `borrow_transaction_id`, `amount`, `fine_reason`, `date_assigned`, `is_paid`)
VALUES
(1, 2, 5, 'Late return', '2026-03-18 12:00:00', 1),
(2, 9, 25, 'Equipment returned late', '2026-03-15 09:00:00', 0),
(3, 11, 40, 'High-value equipment overdue', '2026-03-18 10:30:00', 0);

-- ==================================================
-- HOLDS
-- ==================================================

INSERT INTO `hold_item`
(`hold_id`, `item_id`, `user_type`, `user_id`, `request_date`, `hold_status`, `queue_position`)
VALUES
(1, 4, 1, 1003, '2026-03-10 09:00:00', 'active', 1),
(2, 6, 1, 1005, '2026-03-11 10:15:00', 'active', 1),
(3, 6, 2, 2001, '2026-03-11 10:45:00', 'active', 2),
(4, 6, 1, 1002, '2026-03-11 11:10:00', 'active', 3),
(5, 301, 1, 1001, '2026-03-12 14:00:00', 'fulfilled', 1),
(6, 10, 2, 2002, '2026-03-13 08:20:00', 'cancelled', 1),
(7, 108, 1, 1004, '2026-03-15 13:30:00', 'active', 1);

-- ==================================================
-- ROOM RESERVATIONS
-- ==================================================

INSERT INTO `reserve_room`
(`booking_id`, `room_number`, `reserve_user_type`, `reserved_by`, `start_datetime`, `end_datetime`, `booking_status`, `created_at`)
VALUES
(1, 'R101', 1, 1001, '2026-03-23 09:00:00', '2026-03-23 10:30:00', 'active', '2026-03-20 12:00:00'),
(2, 'R102', 1, 1004, '2026-03-23 13:00:00', '2026-03-23 15:00:00', 'active', '2026-03-20 12:05:00'),
(3, 'R201', 2, 2001, '2026-03-24 10:00:00', '2026-03-24 11:30:00', 'active', '2026-03-20 12:10:00'),
(4, 'R202', 2, 2003, '2026-03-24 14:00:00', '2026-03-24 16:00:00', 'completed', '2026-03-18 09:00:00'),
(5, 'R301', 1, 1002, '2026-03-25 16:00:00', '2026-03-25 18:00:00', 'cancelled', '2026-03-20 12:20:00'),
(6, 'R302', 2, 2002, '2026-03-26 08:00:00', '2026-03-26 12:00:00', 'active', '2026-03-21 10:00:00');

-- ==================================================
-- AUTO-INCREMENT RESET
-- ==================================================

ALTER TABLE `borrow` AUTO_INCREMENT = 12;
ALTER TABLE `fined_for` AUTO_INCREMENT = 4;
ALTER TABLE `hold_item` AUTO_INCREMENT = 8;
ALTER TABLE `reserve_room` AUTO_INCREMENT = 7;