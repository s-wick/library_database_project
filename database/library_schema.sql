-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: librarydatabase
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
  `end_time` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_number`,`user_id`,`start_time`,`end_time`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `book_room_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
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
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_borrow_limit_before_insert` BEFORE INSERT ON `borrow` FOR EACH ROW BEGIN
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_fined_for_cap_before_insert` BEFORE INSERT ON `fined_for` FOR EACH ROW BEGIN
  DECLARE item_value DECIMAL(8,2) DEFAULT 0;

  SELECT COALESCE(i.monetary_value, 0)
    INTO item_value
    FROM item i
   WHERE i.item_id = NEW.item_id
   LIMIT 1;

  SET NEW.amount = LEAST(GREATEST(COALESCE(NEW.amount, 0), 0), item_value);
  SET NEW.amount_paid = LEAST(GREATEST(COALESCE(NEW.amount_paid, 0), 0), NEW.amount);
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
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_fined_for_delete_holds_after_insert` AFTER INSERT ON `fined_for` FOR EACH ROW BEGIN
  IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
    INSERT INTO user_notification (
      user_id,
      item_id,
      checkout_date,
      notification_type,
      message,
      notify_on
    )
    SELECT
      h.user_id,
      h.item_id,
      NULL,
      'HOLD_REMOVED_FINE',
      CONCAT(
        'Your hold for "',
        i.title,
        '" was removed because your account has unpaid fines.'
      ),
      CURRENT_DATE
    FROM hold_item h
    INNER JOIN item i
      ON i.item_id = h.item_id
    WHERE h.user_id = NEW.user_id;

    DELETE FROM hold_item
     WHERE user_id = NEW.user_id;
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
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_fined_for_cap_before_update` BEFORE UPDATE ON `fined_for` FOR EACH ROW BEGIN
  DECLARE item_value DECIMAL(8,2) DEFAULT 0;

  SELECT COALESCE(i.monetary_value, 0)
    INTO item_value
    FROM item i
   WHERE i.item_id = NEW.item_id
   LIMIT 1;

  SET NEW.amount = LEAST(GREATEST(COALESCE(NEW.amount, 0), 0), item_value);
  SET NEW.amount_paid = LEAST(GREATEST(COALESCE(NEW.amount_paid, 0), 0), NEW.amount);
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
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_fined_for_delete_holds_after_update` AFTER UPDATE ON `fined_for` FOR EACH ROW BEGIN
  IF COALESCE(NEW.amount, 0) > COALESCE(NEW.amount_paid, 0) THEN
    INSERT INTO user_notification (
      user_id,
      item_id,
      checkout_date,
      notification_type,
      message,
      notify_on
    )
    SELECT
      h.user_id,
      h.item_id,
      NULL,
      'HOLD_REMOVED_FINE',
      CONCAT(
        'Your hold for "',
        i.title,
        '" was removed because your account has unpaid fines.'
      ),
      CURRENT_DATE
    FROM hold_item h
    INNER JOIN item i
      ON i.item_id = h.item_id
    WHERE h.user_id = NEW.user_id;

    DELETE FROM hold_item
     WHERE user_id = NEW.user_id;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `request_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`,`user_id`,`request_date`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `hold_item_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`),
  CONSTRAINT `hold_item_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`)
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_item_auto_checkout_holds_before_update` BEFORE UPDATE ON `item` FOR EACH ROW BEGIN
  DECLARE v_done TINYINT(1) DEFAULT 0;
  DECLARE v_stock_to_allocate INT DEFAULT 0;
  DECLARE v_hold_user_id INT UNSIGNED DEFAULT NULL;
  DECLARE v_hold_request_date DATETIME DEFAULT NULL;
  DECLARE v_is_faculty TINYINT(1) DEFAULT 0;
  DECLARE v_borrow_limit INT DEFAULT 3;
  DECLARE v_active_count INT DEFAULT 0;
  DECLARE v_has_unpaid_fine INT DEFAULT 0;
  DECLARE v_checkout_ts DATETIME DEFAULT NULL;
  DECLARE v_insert_failed TINYINT(1) DEFAULT 0;

  DECLARE hold_cursor CURSOR FOR
    SELECT h.user_id, h.request_date
    FROM hold_item h
    WHERE h.item_id = NEW.item_id
    ORDER BY h.request_date ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;
  DECLARE CONTINUE HANDLER FOR SQLSTATE '45000' SET v_insert_failed = 1;

  IF NEW.inventory > OLD.inventory THEN
    SET v_stock_to_allocate = NEW.inventory - OLD.inventory;

    OPEN hold_cursor;

    hold_loop: LOOP
      IF v_stock_to_allocate <= 0 THEN
        LEAVE hold_loop;
      END IF;

      FETCH hold_cursor INTO v_hold_user_id, v_hold_request_date;

      IF v_done = 1 THEN
        LEAVE hold_loop;
      END IF;

      SELECT COUNT(*)
        INTO v_has_unpaid_fine
        FROM fined_for f
       WHERE f.user_id = v_hold_user_id
         AND COALESCE(f.amount, 0) > COALESCE(f.amount_paid, 0);

      IF v_has_unpaid_fine > 0 THEN
        INSERT INTO user_notification (
          user_id,
          item_id,
          checkout_date,
          notification_type,
          message,
          notify_on
        )
        VALUES (
          v_hold_user_id,
          NEW.item_id,
          NULL,
          'HOLD_REMOVED_FINE',
          CONCAT(
            'Your hold for "',
            NEW.title,
            '" was removed because your account has unpaid fines.'
          ),
          CURRENT_DATE
        );

        DELETE FROM hold_item
         WHERE item_id = NEW.item_id
           AND user_id = v_hold_user_id
           AND request_date = v_hold_request_date;

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
      SET v_insert_failed = 0;

      INSERT INTO borrow (item_id, user_id, checkout_date, due_date)
      VALUES (
        NEW.item_id,
        v_hold_user_id,
        v_checkout_ts,
        DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY)
      );

      IF v_insert_failed = 1 THEN
        ITERATE hold_loop;
      END IF;

      INSERT INTO user_notification (
        user_id,
        item_id,
        checkout_date,
        notification_type,
        message,
        notify_on
      )
      VALUES (
        v_hold_user_id,
        NEW.item_id,
        v_checkout_ts,
        'HOLD_ASSIGNED',
        CONCAT(
          'Your hold for "',
          NEW.title,
          '" has been checked out to your account. It is due on ',
          DATE_FORMAT(
            DATE_ADD(v_checkout_ts, INTERVAL IF(v_is_faculty = 1, 14, 7) DAY),
            '%Y-%m-%d'
          ),
          '.'
        ),
        CURRENT_DATE
      );

      DELETE FROM hold_item
       WHERE item_id = NEW.item_id
         AND user_id = v_hold_user_id
         AND request_date = v_hold_request_date;

      SET NEW.inventory = NEW.inventory - 1;
      SET v_stock_to_allocate = v_stock_to_allocate - 1;
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
-- Table structure for table `item_type`
--

DROP TABLE IF EXISTS `item_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_type` (
  `item_code` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `item_type` varchar(20) NOT NULL,
  PRIMARY KEY (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meeting_room`
--

DROP TABLE IF EXISTS `meeting_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_room` (
  `room_number` varchar(10) NOT NULL,
  `capacity` smallint unsigned DEFAULT NULL,
  `has_projector` tinyint(1) DEFAULT '0',
  `has_whiteboard` tinyint(1) DEFAULT '0',
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_notification`
--

DROP TABLE IF EXISTS `user_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification` (
  `notification_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `checkout_date` datetime DEFAULT NULL,
  `notification_type` varchar(30) NOT NULL,
  `message` varchar(255) NOT NULL,
  `notify_on` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  UNIQUE KEY `uq_user_notification_due_soon` (`user_id`,`item_id`,`checkout_date`,`notification_type`,`notify_on`),
  KEY `idx_user_notification_user_id` (`user_id`),
  KEY `idx_user_notification_item_id` (`item_id`),
  KEY `idx_user_notification_notify_on` (`notify_on`),
  CONSTRAINT `fk_user_notification_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user_account` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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

-- Dump completed on 2026-04-11 14:46:41
