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
-- Dumping data for table `assigned_genres`
--

LOCK TABLES `assigned_genres` WRITE;
/*!40000 ALTER TABLE `assigned_genres` DISABLE KEYS */;
/*!40000 ALTER TABLE `assigned_genres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `book_room`
--

LOCK TABLES `book_room` WRITE;
/*!40000 ALTER TABLE `book_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;
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
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fined_for`
--

LOCK TABLES `fined_for` WRITE;
/*!40000 ALTER TABLE `fined_for` DISABLE KEYS */;
/*!40000 ALTER TABLE `fined_for` ENABLE KEYS */;
UNLOCK TABLES;
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
-- Dumping data for table `genre`
--

LOCK TABLES `genre` WRITE;
/*!40000 ALTER TABLE `genre` DISABLE KEYS */;
/*!40000 ALTER TABLE `genre` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `hold_item`
--

LOCK TABLES `hold_item` WRITE;
/*!40000 ALTER TABLE `hold_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `hold_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;
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
-- Dumping data for table `item_type`
--

LOCK TABLES `item_type` WRITE;
/*!40000 ALTER TABLE `item_type` DISABLE KEYS */;
/*!40000 ALTER TABLE `item_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `meeting_room`
--

LOCK TABLES `meeting_room` WRITE;
/*!40000 ALTER TABLE `meeting_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `rental_equipment`
--

LOCK TABLES `rental_equipment` WRITE;
/*!40000 ALTER TABLE `rental_equipment` DISABLE KEYS */;
/*!40000 ALTER TABLE `rental_equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `staff_account`
--

LOCK TABLES `staff_account` WRITE;
/*!40000 ALTER TABLE `staff_account` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_notification`
--

LOCK TABLES `user_notification` WRITE;
/*!40000 ALTER TABLE `user_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `video`
--

LOCK TABLES `video` WRITE;
/*!40000 ALTER TABLE `video` DISABLE KEYS */;
/*!40000 ALTER TABLE `video` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 14:46:41
