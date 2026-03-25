DROP DATABASE IF EXISTS `librarydatabase`;
CREATE DATABASE `librarydatabase`;
USE `librarydatabase`;

-- ==================================================
-- LOOKUP TABLES
-- ==================================================

CREATE TABLE `item_type` (
  `item_code` tinyint unsigned NOT NULL,
  `item_type` varchar(32) NOT NULL,
  PRIMARY KEY (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `user_type` (
  `user_code` tinyint unsigned NOT NULL,
  `user_type` varchar(16) NOT NULL,
  PRIMARY KEY (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `item_type` (`item_code`, `item_type`) VALUES
(1, 'BOOK'),
(2, 'VIDEO'),
(3, 'AUDIO'),
(4, 'RENTAL_EQUIPMENT');

INSERT INTO `user_type` (`user_code`, `user_type`) VALUES
(1, 'STUDENT'),
(2, 'FACULTY');

-- ==================================================
-- USER TABLES
-- ==================================================

CREATE TABLE `student_user` (
  `student_id` int unsigned NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `borrowed_items` int unsigned DEFAULT '0',
  `fines` int unsigned DEFAULT '0',
  `user_type_code` tinyint unsigned DEFAULT '1',
  PRIMARY KEY (`student_id`),
  KEY `user_type_code` (`user_type_code`),
  CONSTRAINT `student_user_ibfk_1`
    FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `faculty_user` (
  `faculty_id` int unsigned NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `borrowed_items` int unsigned DEFAULT '0',
  `fines` int unsigned DEFAULT '0',
  `user_type_code` tinyint unsigned DEFAULT '2',
  PRIMARY KEY (`faculty_id`),
  KEY `user_type_code` (`user_type_code`),
  CONSTRAINT `faculty_user_ibfk_1`
    FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `librarian` (
  `librarian_id` int unsigned NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `phone_number` char(15) DEFAULT NULL,
  PRIMARY KEY (`librarian_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `system_administrator` (
  `administrator_id` int unsigned NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(50) DEFAULT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `phone_number` char(15) DEFAULT NULL,
  PRIMARY KEY (`administrator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================================================
-- RESOURCE TABLES
-- ==================================================

CREATE TABLE `book` (
  `book_id` int unsigned NOT NULL,
  `title` varchar(512) NOT NULL,
  `author` varchar(64) NOT NULL,
  `edition` varchar(32) DEFAULT NULL,
  `publication` varchar(64) DEFAULT NULL,
  `publication_date` date DEFAULT NULL,
  `thumbnail_image` blob,
  `monetary_value` decimal(5,2) DEFAULT NULL,
  `books_in_stock` tinyint unsigned DEFAULT NULL,
  `online_pdf_url` varchar(2048) DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`book_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `book_ibfk_1`
    FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audio` (
  `audio_id` int unsigned NOT NULL,
  `audio_name` varchar(512) NOT NULL,
  `thumbnail_image` blob,
  `audio_length_seconds` int unsigned DEFAULT NULL,
  `audio_file` blob,
  `monetary_value` decimal(5,2) DEFAULT NULL,
  `audios_in_stock` tinyint unsigned DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`audio_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `audio_ibfk_1`
    FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `video` (
  `video_id` int unsigned NOT NULL,
  `video_name` varchar(512) NOT NULL,
  `thumbnail_image` blob,
  `video_length_seconds` int unsigned DEFAULT NULL,
  `video_file` blob,
  `monetary_value` decimal(5,2) DEFAULT NULL,
  `videos_in_stock` tinyint unsigned DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`video_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `video_ibfk_1`
    FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rental_equipment` (
  `equipment_id` int unsigned NOT NULL,
  `rental_name` varchar(512) NOT NULL,
  `thumbnail_image` blob,
  `monetary_value` decimal(5,2) DEFAULT NULL,
  `equipment_in_stock` tinyint unsigned DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`equipment_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `rental_equipment_ibfk_1`
    FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `meeting_room` (
  `room_number` varchar(50) NOT NULL,
  `capacity` int unsigned DEFAULT NULL,
  `has_projector` tinyint(1) DEFAULT NULL,
  `has_whiteboard` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================================================
-- TRANSACTION TABLES
-- ==================================================

CREATE TABLE `borrow` (
  `borrow_transaction_id` int unsigned NOT NULL AUTO_INCREMENT,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  `item_id` int unsigned DEFAULT NULL,
  `borrower_type` tinyint unsigned DEFAULT NULL,
  `borrower_id` int unsigned DEFAULT NULL,
  `checkout_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `return_date` datetime DEFAULT NULL,
  PRIMARY KEY (`borrow_transaction_id`),
  KEY `item_type_code` (`item_type_code`),
  KEY `borrower_type` (`borrower_type`),
  CONSTRAINT `borrow_ibfk_1`
    FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`),
  CONSTRAINT `borrow_ibfk_2`
    FOREIGN KEY (`borrower_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `fined_for` (
  `fine_id` int unsigned NOT NULL AUTO_INCREMENT,
  `borrow_transaction_id` int unsigned DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `fine_reason` varchar(256) DEFAULT NULL,
  `date_assigned` datetime DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`fine_id`),
  KEY `borrow_transaction_id` (`borrow_transaction_id`),
  CONSTRAINT `fined_for_ibfk_1`
    FOREIGN KEY (`borrow_transaction_id`) REFERENCES `borrow` (`borrow_transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `hold_item` (
  `hold_id` int unsigned NOT NULL AUTO_INCREMENT,
  `item_id` int unsigned DEFAULT NULL,
  `user_type` tinyint unsigned DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `request_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `hold_status` enum('active','fulfilled','cancelled') DEFAULT NULL,
  `queue_position` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`hold_id`),
  KEY `user_type` (`user_type`),
  CONSTRAINT `hold_item_ibfk_1`
    FOREIGN KEY (`user_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reserve_room` (
  `booking_id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_number` varchar(50) DEFAULT NULL,
  `reserve_user_type` tinyint unsigned DEFAULT NULL,
  `reserved_by` int unsigned DEFAULT NULL,
  `start_datetime` datetime DEFAULT NULL,
  `end_datetime` datetime DEFAULT NULL,
  `booking_status` enum('active','cancelled','completed') DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  KEY `room_number` (`room_number`),
  KEY `reserve_user_type` (`reserve_user_type`),
  CONSTRAINT `reserve_room_ibfk_1`
    FOREIGN KEY (`room_number`) REFERENCES `meeting_room` (`room_number`),
  CONSTRAINT `reserve_room_ibfk_2`
    FOREIGN KEY (`reserve_user_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==================================================
-- OVERDUE FINE CAP TRIGGERS
-- ==================================================

DELIMITER $$

-- CREATE TRIGGER `trg_fined_for_cap_item_value_before_insert` BEFORE INSERT ON `fined_for` FOR EACH ROW
CREATE TRIGGER `trg_fined_for_cap_item_value_before_insert`
BEFORE INSERT ON `fined_for`
FOR EACH ROW
BEGIN
  DECLARE max_item_value DECIMAL(10,2) DEFAULT NULL;

  SELECT COALESCE(book.monetary_value, video.monetary_value, audio.monetary_value, rental.monetary_value)
    INTO max_item_value
  FROM borrow b
  LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
  LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
  LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
  LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
  WHERE b.borrow_transaction_id = NEW.borrow_transaction_id
  LIMIT 1;

  IF max_item_value IS NOT NULL AND NEW.amount IS NOT NULL AND NEW.amount > max_item_value THEN
    SET NEW.amount = max_item_value;
  END IF;
END$$

-- CREATE TRIGGER `trg_fined_for_cap_item_value_before_update` BEFORE UPDATE ON `fined_for` FOR EACH ROW
CREATE TRIGGER `trg_fined_for_cap_item_value_before_update`
BEFORE UPDATE ON `fined_for`
FOR EACH ROW
BEGIN
  DECLARE max_item_value DECIMAL(10,2) DEFAULT NULL;

  SELECT COALESCE(book.monetary_value, video.monetary_value, audio.monetary_value, rental.monetary_value)
    INTO max_item_value
  FROM borrow b
  LEFT JOIN book ON b.item_type_code = 1 AND b.item_id = book.book_id
  LEFT JOIN video ON b.item_type_code = 2 AND b.item_id = video.video_id
  LEFT JOIN audio ON b.item_type_code = 3 AND b.item_id = audio.audio_id
  LEFT JOIN rental_equipment rental ON b.item_type_code = 4 AND b.item_id = rental.equipment_id
  WHERE b.borrow_transaction_id = NEW.borrow_transaction_id
  LIMIT 1;

  IF max_item_value IS NOT NULL AND NEW.amount IS NOT NULL AND NEW.amount > max_item_value THEN
    SET NEW.amount = max_item_value;
  END IF;
END$$

DELIMITER ;