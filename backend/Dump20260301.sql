CREATE DATABASE  IF NOT EXISTS `librarydatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `librarydatabase`;
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
  CONSTRAINT `audio_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`Item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`Item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`Item_code`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`borrower_type`) REFERENCES `user_type` (`User_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `faculty_user_ibfk_1` FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`User_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty_user`
--

LOCK TABLES `faculty_user` WRITE;
/*!40000 ALTER TABLE `faculty_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `faculty_user` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fined_for`
--

LOCK TABLES `fined_for` WRITE;
/*!40000 ALTER TABLE `fined_for` DISABLE KEYS */;
/*!40000 ALTER TABLE `fined_for` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `hold_item_ibfk_1` FOREIGN KEY (`user_type`) REFERENCES `user_type` (`User_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hold_item`
--

LOCK TABLES `hold_item` WRITE;
/*!40000 ALTER TABLE `hold_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `hold_item` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `image`
--

LOCK TABLES `image` WRITE;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
/*!40000 ALTER TABLE `image` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `item_type`
--

LOCK TABLES `item_type` WRITE;
/*!40000 ALTER TABLE `item_type` DISABLE KEYS */;
INSERT INTO `item_type` VALUES (1,'BOOK'),(2,'VIDEO'),(3,'AUDIO'),(4,'RENTAL_EQUIPMENT'),(5,'IMAGE');
/*!40000 ALTER TABLE `item_type` ENABLE KEYS */;
UNLOCK TABLES;

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
  `phone_number` char(15) DEFAULT NULL,
  PRIMARY KEY (`librarian_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `librarian`
--

LOCK TABLES `librarian` WRITE;
/*!40000 ALTER TABLE `librarian` DISABLE KEYS */;
/*!40000 ALTER TABLE `librarian` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `meeting_room`
--

LOCK TABLES `meeting_room` WRITE;
/*!40000 ALTER TABLE `meeting_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_room` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `rental_equipment`
--

LOCK TABLES `rental_equipment` WRITE;
/*!40000 ALTER TABLE `rental_equipment` DISABLE KEYS */;
/*!40000 ALTER TABLE `rental_equipment` ENABLE KEYS */;
UNLOCK TABLES;

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
  CONSTRAINT `reserve_room_ibfk_2` FOREIGN KEY (`reserve_user_type`) REFERENCES `user_type` (`User_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserve_room`
--

LOCK TABLES `reserve_room` WRITE;
/*!40000 ALTER TABLE `reserve_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `reserve_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_user`
--

DROP TABLE IF EXISTS `student_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_user` (
  `student_id` char(15) NOT NULL,
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
  CONSTRAINT `student_user_ibfk_1` FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`User_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_user`
--

LOCK TABLES `student_user` WRITE;
/*!40000 ALTER TABLE `student_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_user` ENABLE KEYS */;
UNLOCK TABLES;

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
  `phone_number` char(15) DEFAULT NULL,
  PRIMARY KEY (`administrator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_administrator`
--

LOCK TABLES `system_administrator` WRITE;
/*!40000 ALTER TABLE `system_administrator` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_administrator` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `user_type`
--

LOCK TABLES `user_type` WRITE;
/*!40000 ALTER TABLE `user_type` DISABLE KEYS */;
INSERT INTO `user_type` VALUES (1,'STUDENT'),(2,'FACULTY');
/*!40000 ALTER TABLE `user_type` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-03-01 22:34:32
