-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: librarydatabase
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
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
  `book_id` int unsigned NOT NULL,
  `genre_id` int unsigned NOT NULL,
  `assigned_at` datetime NOT NULL,
  PRIMARY KEY (`book_id`,`genre_id`),
  KEY `genre_id` (`genre_id`),
  CONSTRAINT `assigned_genres_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`book_id`),
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
  CONSTRAINT `audio_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `borrow`
--

DROP TABLE IF EXISTS `borrow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`borrower_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `cart_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `item_type_code` tinyint unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `added_to_cart` datetime NOT NULL,
  PRIMARY KEY (`cart_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faculty_user`
--

DROP TABLE IF EXISTS `faculty_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `faculty_user_ibfk_1` FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fined_for`
--

DROP TABLE IF EXISTS `fined_for`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fined_for` (
  `fine_id` int unsigned NOT NULL AUTO_INCREMENT,
  `borrow_transaction_id` int unsigned DEFAULT NULL,
  `amount` int unsigned DEFAULT NULL,
  `fine_reason` varchar(256) DEFAULT NULL,
  `date_assigned` datetime DEFAULT NULL,
  `is_paid` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`fine_id`),
  KEY `borrow_transaction_id` (`borrow_transaction_id`),
  CONSTRAINT `fined_for_ibfk_1` FOREIGN KEY (`borrow_transaction_id`) REFERENCES `borrow` (`borrow_transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `genre`
--

DROP TABLE IF EXISTS `genre`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genre` (
  `genre_id` int unsigned NOT NULL AUTO_INCREMENT,
  `genre_text` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL,
  `created_by` int unsigned NOT NULL,
  PRIMARY KEY (`genre_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `genre_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `librarian` (`librarian_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hold_item`
--

DROP TABLE IF EXISTS `hold_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `hold_item_ibfk_1` FOREIGN KEY (`user_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `image`
--

DROP TABLE IF EXISTS `image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `image` (
  `image_id` int unsigned NOT NULL,
  `image_name` varchar(512) NOT NULL,
  `thumbnail_image` blob,
  `image_file` blob,
  `monetary_value` decimal(5,2) DEFAULT NULL,
  `images_in_stock` tinyint unsigned DEFAULT NULL,
  `created_at` date DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `item_type_code` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`image_id`),
  KEY `item_type_code` (`item_type_code`),
  CONSTRAINT `image_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`Item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item_type`
--

DROP TABLE IF EXISTS `item_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_type` (
  `item_code` tinyint unsigned NOT NULL,
  `item_type` varchar(32) NOT NULL,
  PRIMARY KEY (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `librarian`
--

DROP TABLE IF EXISTS `librarian`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meeting_room`
--

DROP TABLE IF EXISTS `meeting_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_room` (
  `room_number` varchar(50) NOT NULL,
  `capacity` int unsigned DEFAULT NULL,
  `has_projector` tinyint(1) DEFAULT NULL,
  `has_whiteboard` tinyint(1) DEFAULT NULL,
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
  CONSTRAINT `rental_equipment_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reserve_room`
--

DROP TABLE IF EXISTS `reserve_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `reserve_room_ibfk_1` FOREIGN KEY (`room_number`) REFERENCES `meeting_room` (`room_number`),
  CONSTRAINT `reserve_room_ibfk_2` FOREIGN KEY (`reserve_user_type`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_user`
--

DROP TABLE IF EXISTS `student_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `student_user_ibfk_1` FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_administrator`
--

DROP TABLE IF EXISTS `system_administrator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_type`
--

DROP TABLE IF EXISTS `user_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_type` (
  `user_code` tinyint unsigned NOT NULL,
  `user_type` varchar(16) NOT NULL,
  PRIMARY KEY (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `video`
--

DROP TABLE IF EXISTS `video`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `video_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
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

-- Dump completed on 2026-03-25 22:10:01
