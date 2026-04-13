-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: librarydatabase
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `assigned_genres`
--

DROP TABLE IF EXISTS `assigned_genres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assigned_genres` (
  `item_id` int unsigned NOT NULL,
  `genre_id` int unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`,`genre_id`),
  KEY `genre_id` (`genre_id`),
  CONSTRAINT `assigned_genres_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `assigned_genres_ibfk_2` FOREIGN KEY (`genre_id`) REFERENCES `genre` (`genre_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audio`
--

DROP TABLE IF EXISTS `audio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audio` (
  `item_id` int unsigned NOT NULL,
  `audio_length_seconds` int unsigned DEFAULT NULL,
  `audio_file` blob NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_audio_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `item_id` int unsigned NOT NULL,
  `author` varchar(50) NOT NULL,
  `edition` varchar(25) DEFAULT NULL,
  `publication` varchar(50) NOT NULL,
  `publication_date` date NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_book_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book_room`
--

DROP TABLE IF EXISTS `book_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_room` (
  `room_number` varchar(10) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `start_time` datetime NOT NULL,
  `duration_hours` tinyint unsigned NOT NULL,
  `booked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_number`,`user_id`,`start_time`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `book_room_ibfk_1` FOREIGN KEY (`room_number`) REFERENCES `meeting_room` (`room_number`) ON DELETE CASCADE,
  CONSTRAINT `book_room_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `borrow`
--

DROP TABLE IF EXISTS `borrow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow` (
  `item_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `checkout_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` datetime NOT NULL,
  `return_date` datetime DEFAULT NULL,
  PRIMARY KEY (`item_id`,`user_id`,`checkout_date`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `borrow_cap` BEFORE INSERT ON `borrow` FOR EACH ROW BEGIN
  DECLARE v_is_faculty   TINYINT(1) DEFAULT 0;
  DECLARE v_active_count INT        DEFAULT 0;
  DECLARE v_limit        INT        DEFAULT 3;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_limit = IF(v_is_faculty = 1, 6, 3);

  SELECT COUNT(*)
    INTO v_active_count
    FROM borrow
   WHERE user_id = NEW.user_id
     AND return_date IS NULL;

  IF v_active_count >= v_limit THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Borrow limit reached: you have too many active borrows.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `borrow_due_date` BEFORE INSERT ON `borrow` FOR EACH ROW BEGIN
  DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
  DECLARE v_borrow_days INT DEFAULT 7;

  SELECT COALESCE(is_faculty, 0)
    INTO v_is_faculty
    FROM user_account
   WHERE user_id = NEW.user_id
   LIMIT 1;

  SET v_borrow_days = IF(v_is_faculty = 1, 14, 7);

  IF NEW.checkout_date IS NULL THEN
    SET NEW.checkout_date = NOW();
  END IF;

  IF NEW.due_date IS NULL THEN
    SET NEW.due_date = DATE_ADD(NEW.checkout_date, INTERVAL v_borrow_days DAY);
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `auto_checkout_holds` AFTER UPDATE ON `borrow` FOR EACH ROW BEGIN
	DECLARE v_done TINYINT(1) DEFAULT 0;
	DECLARE v_hold_user_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_hold_request_datetime DATETIME DEFAULT NULL;
	DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
	DECLARE v_borrow_limit INT DEFAULT 3;
	DECLARE v_active_count INT DEFAULT 0;
	DECLARE v_has_unpaid_fine INT DEFAULT 0;
	DECLARE v_checkout_ts DATETIME DEFAULT NULL;
	DECLARE v_removed_hold_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_checked_out_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_fine_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_fulfilled_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_item_title VARCHAR(100) DEFAULT NULL;

	DECLARE hold_cursor CURSOR FOR
		SELECT h.user_id, h.request_datetime
		FROM hold_item h
		WHERE h.item_id = NEW.item_id
			AND h.close_datetime IS NULL
		ORDER BY h.request_datetime ASC;

	DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

	IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
		SELECT title
			INTO v_item_title
			FROM item
		 WHERE item_id = NEW.item_id
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_removed_hold_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT notification_type_id
			INTO v_checked_out_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Checked out item'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_fine_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_fulfilled_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Fulfilled'
		 LIMIT 1;

		OPEN hold_cursor;

		hold_loop: LOOP
			FETCH hold_cursor INTO v_hold_user_id, v_hold_request_datetime;

			IF v_done = 1 THEN
				LEAVE hold_loop;
			END IF;

			SELECT COUNT(*)
				INTO v_has_unpaid_fine
				FROM fined_for f
			 WHERE f.user_id = v_hold_user_id
				 AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

			IF v_has_unpaid_fine > 0 THEN
				IF v_removed_hold_type_id IS NOT NULL THEN
					INSERT INTO user_notification (
						user_id,
						item_id,
						notification_type,
						message
					)
					VALUES (
						v_hold_user_id,
						NEW.item_id,
						v_removed_hold_type_id,
						CONCAT(
							'Your hold for "',
							COALESCE(v_item_title, NEW.item_id),
							'" was removed because your account has unpaid fines.'
						)
					);
				END IF;

				UPDATE hold_item
					 SET close_datetime = NOW(),
							 close_reason_id = v_close_reason_fine_id
				 WHERE item_id = NEW.item_id
					 AND user_id = v_hold_user_id
					 AND request_datetime = v_hold_request_datetime
					 AND close_datetime IS NULL;

				ITERATE hold_loop;
			END IF;

			SELECT COALESCE(ua.is_faculty, 0)
				INTO v_is_faculty
				FROM user_account ua
			 WHERE ua.user_id = v_hold_user_id
			 LIMIT 1;

			SET v_borrow_limit = IF(v_is_faculty = 1, 6, 3);

			SELECT COUNT(*)
				INTO v_active_count
				FROM borrow b
			 WHERE b.user_id = v_hold_user_id
				 AND b.return_date IS NULL;

			IF v_active_count >= v_borrow_limit THEN
				ITERATE hold_loop;
			END IF;

			SET v_checkout_ts = NOW();
			INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
			VALUES (
				NEW.item_id,
				v_hold_user_id,
				v_checkout_ts,
				DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY)
			);

			IF v_checked_out_type_id IS NOT NULL THEN
				INSERT INTO user_notification (
					user_id,
					item_id,
					notification_type,
					message
				)
				VALUES (
					v_hold_user_id,
					NEW.item_id,
					v_checked_out_type_id,
					CONCAT(
						'Your hold for "',
						COALESCE(v_item_title, NEW.item_id),
						'" has been checked out to your account. It is due on ',
						DATE_FORMAT(
							DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY),
							'%Y-%m-%d'
						),
						'.'
					)
				);
			END IF;

			UPDATE hold_item
				 SET close_datetime = NOW(),
						 close_reason_id = v_close_reason_fulfilled_id
			 WHERE item_id = NEW.item_id
				 AND user_id = v_hold_user_id
				 AND request_datetime = v_hold_request_datetime
				 AND close_datetime IS NULL;

			LEAVE hold_loop;
		END LOOP;

		CLOSE hold_cursor;
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `cart_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `added_to_cart` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fined_for`
--

DROP TABLE IF EXISTS `fined_for`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fined_for` (
  `item_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `checkout_date` datetime NOT NULL,
  `amount` decimal(8,2) DEFAULT NULL,
  `amount_paid` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`item_id`,`user_id`,`checkout_date`),
  CONSTRAINT `fined_for_ibfk_1` FOREIGN KEY (`item_id`, `user_id`, `checkout_date`) REFERENCES `borrow` (`item_id`, `user_id`, `checkout_date`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `fines_delete_holds_insert` AFTER INSERT ON `fined_for` FOR EACH ROW BEGIN
	DECLARE v_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;

	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
		SELECT notification_type_id
			INTO v_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		IF v_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your account has unpaid fines.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL;
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL;
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `fines_delete_holds_update` AFTER UPDATE ON `fined_for` FOR EACH ROW BEGIN
	DECLARE v_notification_type_id INT UNSIGNED DEFAULT NULL;
	DECLARE v_close_reason_id INT UNSIGNED DEFAULT NULL;

	IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0)
		 AND NOT (COALESCE(OLD.amount, 0) > COALESCE(OLD.amount_paid, 0)) THEN
		SELECT notification_type_id
			INTO v_notification_type_id
			FROM user_notification_type
		 WHERE notification_type_text = 'Removed hold'
		 LIMIT 1;

		SELECT reason_id
			INTO v_close_reason_id
			FROM hold_item_closing_reasons
		 WHERE reason_text = 'Canceled by fine'
		 LIMIT 1;

		IF v_notification_type_id IS NOT NULL THEN
			INSERT INTO user_notification (
				user_id,
				item_id,
				notification_type,
				message
			)
			SELECT
				h.user_id,
				h.item_id,
				v_notification_type_id,
				CONCAT(
					'Your hold for "',
					i.title,
					'" was removed because your account has unpaid fines.'
				)
			FROM hold_item h
			INNER JOIN item i
				ON i.item_id = h.item_id
			WHERE h.user_id = NEW.user_id
				AND h.close_datetime IS NULL;
		END IF;

		UPDATE hold_item
			 SET close_datetime = NOW(),
					 close_reason_id = v_close_reason_id
		 WHERE user_id = NEW.user_id
			 AND close_datetime IS NULL;
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `genre`
--

DROP TABLE IF EXISTS `genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genre` (
  `genre_id` int unsigned NOT NULL AUTO_INCREMENT,
  `genre_text` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned NOT NULL,
  PRIMARY KEY (`genre_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `genre_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `staff_account` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hold_item`
--

DROP TABLE IF EXISTS `hold_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hold_item` (
  `item_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `request_datetime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `close_datetime` datetime DEFAULT NULL,
  `close_reason_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`item_id`,`user_id`,`request_datetime`),
  KEY `user_id` (`user_id`),
  KEY `close_reason_id` (`close_reason_id`),
  CONSTRAINT `hold_item_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `hold_item_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`),
  CONSTRAINT `hold_item_ibfk_3` FOREIGN KEY (`close_reason_id`) REFERENCES `hold_item_closing_reasons` (`reason_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hold_item_closing_reasons`
--

DROP TABLE IF EXISTS `hold_item_closing_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hold_item_closing_reasons` (
  `reason_id` int unsigned NOT NULL AUTO_INCREMENT,
  `reason_text` varchar(30) NOT NULL,
  PRIMARY KEY (`reason_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `item_type_code` tinyint unsigned NOT NULL,
  `title` varchar(100) NOT NULL,
  `thumbnail_image` longblob,
  `monetary_value` decimal(8,2) NOT NULL,
  `inventory` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_item_type` (`item_type_code`),
  KEY `fk_item_created_by` (`created_by`),
  CONSTRAINT `fk_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff_account` (`staff_id`),
  CONSTRAINT `fk_item_type` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item_type`
--

DROP TABLE IF EXISTS `item_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_type` (
  `item_code` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `item_type` varchar(20) NOT NULL,
  PRIMARY KEY (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meeting_room`
--

DROP TABLE IF EXISTS `meeting_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_room` (
  `room_number` varchar(10) NOT NULL,
  `capacity` smallint unsigned NOT NULL,
  `has_projector` tinyint(1) NOT NULL,
  `has_whiteboard` tinyint(1) NOT NULL,
  `has_tv` tinyint(1) NOT NULL,
  PRIMARY KEY (`room_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rental_equipment`
--

DROP TABLE IF EXISTS `rental_equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rental_equipment` (
  `item_id` int unsigned NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_equipment_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_generated`
--

DROP TABLE IF EXISTS `report_generated`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_generated` (
  `staff_id` int unsigned NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `report_type` int unsigned NOT NULL,
  PRIMARY KEY (`staff_id`,`generated_at`),
  KEY `report_type` (`report_type`),
  CONSTRAINT `report_generated_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff_account` (`staff_id`),
  CONSTRAINT `report_generated_ibfk_2` FOREIGN KEY (`report_type`) REFERENCES `report_types` (`report_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `fine_accrual_and_cap_revenue_report` AFTER INSERT ON `report_generated` FOR EACH ROW BEGIN
	DECLARE v_report_type VARCHAR(30) DEFAULT '';
	DECLARE v_daily_rate DECIMAL(8,2) DEFAULT 5.00;

	SELECT rt.report_type
		INTO v_report_type
		FROM report_types rt
	 WHERE rt.report_type_id = NEW.report_type
	 LIMIT 1;

	IF v_report_type = 'revenue' THEN
		INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
		SELECT b.item_id,
					 b.user_id,
					 b.checkout_date,
					 LEAST(
						 ROUND(
							 GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0)
							 * v_daily_rate,
							 2
						 ),
						 COALESCE(i.monetary_value, 0)
					 ) AS amount,
					 0
		FROM borrow b
		INNER JOIN item i ON i.item_id = b.item_id
		WHERE TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())) > 0
		ON DUPLICATE KEY UPDATE
			amount = VALUES(amount),
			amount_paid = LEAST(COALESCE(amount_paid, 0), VALUES(amount));
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `report_types`
--

DROP TABLE IF EXISTS `report_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_types` (
  `report_type_id` int unsigned NOT NULL,
  `report_type` varchar(30) NOT NULL,
  PRIMARY KEY (`report_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_account`
--

DROP TABLE IF EXISTS `staff_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_account` (
  `staff_id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone_number` char(15) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_retired` datetime DEFAULT NULL,
  PRIMARY KEY (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `is_faculty` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `fine_accrual_and_cap_user_login` AFTER UPDATE ON `user_account` FOR EACH ROW BEGIN
	DECLARE v_daily_rate DECIMAL(8,2) DEFAULT 5.00;

	IF NEW.last_login <> OLD.last_login THEN
		INSERT INTO fined_for (item_id, user_id, checkout_date, amount, amount_paid)
		SELECT b.item_id,
					 b.user_id,
					 b.checkout_date,
					 LEAST(
						 ROUND(
							 GREATEST(TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())), 0)
							 * v_daily_rate,
							 2
						 ),
						 COALESCE(i.monetary_value, 0)
					 ) AS amount,
					 0
		FROM borrow b
		INNER JOIN item i ON i.item_id = b.item_id
		WHERE b.user_id = NEW.user_id
			AND TIMESTAMPDIFF(DAY, b.due_date, COALESCE(b.return_date, NOW())) > 0
		ON DUPLICATE KEY UPDATE
			amount = VALUES(amount),
			amount_paid = LEAST(COALESCE(amount_paid, 0), VALUES(amount));
	END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `user_notification`
--

DROP TABLE IF EXISTS `user_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification` (
  `notification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `notification_type` int unsigned NOT NULL,
  `message` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledged_at` datetime DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `fk_user_notification_item` (`item_id`),
  KEY `fk_user_notification_user` (`user_id`),
  KEY `fk_notification_type` (`notification_type`),
  CONSTRAINT `fk_notification_type` FOREIGN KEY (`notification_type`) REFERENCES `user_notification_type` (`notification_type_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_notification_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_notification_type`
--

DROP TABLE IF EXISTS `user_notification_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification_type` (
  `notification_type_id` int unsigned NOT NULL AUTO_INCREMENT,
  `notification_type_text` varchar(30) NOT NULL,
  PRIMARY KEY (`notification_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video`
--

DROP TABLE IF EXISTS `video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `video` (
  `item_id` int unsigned NOT NULL,
  `video_length_seconds` int unsigned DEFAULT NULL,
  `video_file` blob NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_video_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-13 15:55:44
