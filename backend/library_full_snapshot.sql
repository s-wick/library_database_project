CREATE DATABASE  IF NOT EXISTS `librarydatabase` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `librarydatabase`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: librarydatabase
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
  CONSTRAINT `audio_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
INSERT INTO `audio` VALUES (201,'Learn SQL in 60 Minutes',NULL,3600,NULL,14.99,5,'2026-03-22','sysadmin1',3),(202,'Database Design Essentials',NULL,2700,NULL,12.50,4,'2026-03-22','sysadmin1',3),(203,'Academic Writing for Researchers',NULL,3300,NULL,9.99,6,'2026-03-22','sysadmin1',3),(204,'Public Speaking Fundamentals',NULL,2400,NULL,8.99,7,'2026-03-22','sysadmin1',3),(205,'Linear Algebra Audio Guide',NULL,4000,NULL,15.50,2,'2026-03-22','sysadmin1',3),(206,'Study Skills for Exams',NULL,1800,NULL,6.99,9,'2026-03-22','sysadmin1',3),(207,'Time Management Workshop',NULL,2100,NULL,7.99,4,'2026-03-22','sysadmin1',3),(208,'Research Ethics Overview',NULL,2600,NULL,11.25,3,'2026-03-22','sysadmin1',3),(209,'Intro to Machine Learning Audio',NULL,5000,NULL,16.95,1,'2026-03-22','sysadmin1',3),(210,'Campus Orientation Audio Pack',NULL,1500,NULL,4.99,0,'2026-03-22','sysadmin1',3);
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
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,'Database Systems Concepts','Abraham Silberschatz','7th','McGraw-Hill','2019-01-15',NULL,89.99,6,NULL,'2026-03-22','sysadmin1',1),(2,'Operating System Concepts','Abraham Silberschatz','10th','Wiley','2018-03-05',NULL,94.50,4,NULL,'2026-03-22','sysadmin1',1),(3,'Computer Networks','Andrew S. Tanenbaum','5th','Pearson','2016-10-10',NULL,84.25,5,NULL,'2026-03-22','sysadmin1',1),(4,'Clean Code','Robert C. Martin','1st','Prentice Hall','2008-08-11',NULL,49.99,7,NULL,'2026-03-22','sysadmin1',1),(5,'Design Patterns','Erich Gamma','1st','Addison-Wesley','1994-10-21',NULL,54.95,3,NULL,'2026-03-22','sysadmin1',1),(6,'Introduction to Algorithms','Thomas H. Cormen','4th','MIT Press','2022-04-05',NULL,99.95,5,NULL,'2026-03-22','sysadmin1',1),(7,'Artificial Intelligence: A Modern Approach','Stuart Russell','4th','Pearson','2020-04-28',NULL,109.99,2,NULL,'2026-03-22','sysadmin1',1),(8,'Python Crash Course','Eric Matthes','3rd','No Starch Press','2023-01-10',NULL,39.95,8,NULL,'2026-03-22','sysadmin1',1),(9,'The Pragmatic Programmer','Andrew Hunt','2nd','Addison-Wesley','2019-09-13',NULL,47.99,6,NULL,'2026-03-22','sysadmin1',1),(10,'SQL for Data Analysis','Cathy Tanimura','1st','OReilly Media','2021-12-21',NULL,44.99,0,'https://example.com/sql-for-data-analysis','2026-03-22','sysadmin1',1);
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
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`borrower_type`) REFERENCES `user_type` (`user_code`)
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
  CONSTRAINT `faculty_user_ibfk_1` FOREIGN KEY (`user_type_code`) REFERENCES `user_type` (`user_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty_user`
--

LOCK TABLES `faculty_user` WRITE;
/*!40000 ALTER TABLE `faculty_user` DISABLE KEYS */;
INSERT INTO `faculty_user` VALUES (2001,'daniel.anderson@uni.edu','pass123','2026-03-22 20:05:57','Daniel',NULL,'Anderson',2,0,2),(2002,'mia.thomas@uni.edu','pass123','2026-03-22 20:05:57','Mia',NULL,'Thomas',1,0,2),(2003,'william.jackson@uni.edu','pass123','2026-03-22 20:05:57','William','R.','Jackson',0,0,2);
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
  CONSTRAINT `hold_item_ibfk_1` FOREIGN KEY (`user_type`) REFERENCES `user_type` (`user_code`)
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
  CONSTRAINT `image_ibfk_1` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
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
INSERT INTO `librarian` VALUES (3001,'maria.garcia@library.com','admin123','2026-03-22 20:05:57','555-210-3001'),(3002,'henry.martin@library.com','admin123','2026-03-22 20:05:57','555-210-3002');
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
INSERT INTO `meeting_room` VALUES ('R101',2,0,1),('R102',4,1,1),('R201',8,1,1),('R202',12,1,0),('R301',20,1,1),('R302',30,0,1);
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
  CONSTRAINT `reserve_room_ibfk_2` FOREIGN KEY (`reserve_user_type`) REFERENCES `user_type` (`user_code`)
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
-- Dumping data for table `student_user`
--

LOCK TABLES `student_user` WRITE;
/*!40000 ALTER TABLE `student_user` DISABLE KEYS */;
INSERT INTO `student_user` VALUES (1001,'emma.johnson@uni.edu','pass123','2026-03-22 20:05:57','Emma',NULL,'Johnson',2,0,1),(1002,'liam.smith@uni.edu','pass123','2026-03-22 20:05:57','Liam',NULL,'Smith',1,1,1),(1003,'olivia.brown@uni.edu','pass123','2026-03-22 20:05:57','Olivia','Grace','Brown',0,0,1),(1004,'noah.davis@uni.edu','pass123','2026-03-22 20:05:57','Noah',NULL,'Davis',3,0,1),(1005,'ava.miller@uni.edu','pass123','2026-03-22 20:05:57','Ava',NULL,'Miller',1,0,1);
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
INSERT INTO `system_administrator` VALUES (4001,'sysadmin1@library.com','admin123','2026-03-22 20:05:57','555-900-4001'),(4002,'sysadmin2@library.com','admin123','2026-03-22 20:05:57','555-900-4002');
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
INSERT INTO `video` VALUES (101,'Intro to Relational Databases',NULL,3600,NULL,29.99,3,'2026-03-22','sysadmin1',2),(102,'Advanced SQL Workshop',NULL,5400,NULL,34.99,2,'2026-03-22','sysadmin1',2),(103,'Networking Fundamentals Lecture Series',NULL,4200,NULL,24.50,4,'2026-03-22','sysadmin1',2),(104,'Software Engineering Best Practices',NULL,3900,NULL,27.75,2,'2026-03-22','sysadmin1',2),(105,'Discrete Math Review',NULL,3000,NULL,19.99,5,'2026-03-22','sysadmin1',2),(106,'Computer Architecture Seminar',NULL,4800,NULL,31.25,1,'2026-03-22','sysadmin1',2),(107,'Research Methods for Students',NULL,2700,NULL,18.50,6,'2026-03-22','sysadmin1',2),(108,'Cybersecurity Basics',NULL,3600,NULL,26.00,0,'2026-03-22','sysadmin1',2),(109,'Version Control with Git',NULL,2500,NULL,17.95,4,'2026-03-22','sysadmin1',2),(110,'Data Structures Crash Review',NULL,4100,NULL,28.40,3,'2026-03-22','sysadmin1',2);
/*!40000 ALTER TABLE `video` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'librarydatabase'
--

--
-- Dumping routines for database 'librarydatabase'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-22 15:12:43
