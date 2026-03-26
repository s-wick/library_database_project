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
INSERT INTO `audio` VALUES (11,1800,_binary '\0'),(12,2100,_binary '\0'),(13,2400,_binary '\0'),(14,2700,_binary '\0'),(15,3000,_binary '\0'),(16,3300,_binary '\0'),(17,3600,_binary '\0'),(18,3900,_binary '\0'),(19,4200,_binary '\0'),(20,4500,_binary '\0');
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,'Author One','1st','Campus Press','2015-01-15'),(2,'Author Two','2nd','Northgate Publishing','2016-03-10'),(3,'Author Three','1st','Cityline Books','2017-05-22'),(4,'Author Four','3rd','Oak Tree House','2018-07-09'),(5,'Author Five','1st','Harbor Editions','2019-02-13'),(6,'Author Six','4th','Prairie Publishing','2020-10-01'),(7,'Author Seven','1st','Delta Press','2021-12-14'),(8,'Author Eight','2nd','Summit House','2022-06-18'),(9,'Author Nine','1st','Blue Leaf Media','2023-08-27'),(10,'Author Ten','5th','Lumen Works','2024-11-05');
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
INSERT INTO `item` VALUES (1,1,'Book Seed 01',NULL,19.99,6,'2026-03-26 03:53:06',1),(2,1,'Book Seed 02',NULL,21.50,4,'2026-03-26 03:53:06',1),(3,1,'Book Seed 03',NULL,24.00,5,'2026-03-26 03:53:06',1),(4,1,'Book Seed 04',NULL,17.75,3,'2026-03-26 03:53:06',1),(5,1,'Book Seed 05',NULL,29.99,7,'2026-03-26 03:53:06',1),(6,1,'Book Seed 06',NULL,15.25,8,'2026-03-26 03:53:06',1),(7,1,'Book Seed 07',NULL,32.40,2,'2026-03-26 03:53:06',1),(8,1,'Book Seed 08',NULL,18.80,6,'2026-03-26 03:53:06',1),(9,1,'Book Seed 09',NULL,26.35,5,'2026-03-26 03:53:06',1),(10,1,'Book Seed 10',NULL,22.10,4,'2026-03-26 03:53:06',1),(11,3,'Audio Seed 01',NULL,12.99,9,'2026-03-26 03:53:06',1),(12,3,'Audio Seed 02',NULL,11.49,7,'2026-03-26 03:53:06',1),(13,3,'Audio Seed 03',NULL,14.25,6,'2026-03-26 03:53:06',1),(14,3,'Audio Seed 04',NULL,16.00,5,'2026-03-26 03:53:06',1),(15,3,'Audio Seed 05',NULL,13.75,8,'2026-03-26 03:53:06',1),(16,3,'Audio Seed 06',NULL,15.10,6,'2026-03-26 03:53:06',1),(17,3,'Audio Seed 07',NULL,10.95,10,'2026-03-26 03:53:06',1),(18,3,'Audio Seed 08',NULL,17.35,4,'2026-03-26 03:53:06',1),(19,3,'Audio Seed 09',NULL,18.20,3,'2026-03-26 03:53:06',1),(20,3,'Audio Seed 10',NULL,19.99,2,'2026-03-26 03:53:06',1),(21,2,'Video Seed 01',NULL,23.99,4,'2026-03-26 03:53:06',1),(22,2,'Video Seed 02',NULL,21.25,5,'2026-03-26 03:53:06',1),(23,2,'Video Seed 03',NULL,25.00,3,'2026-03-26 03:53:06',1),(24,2,'Video Seed 04',NULL,27.50,2,'2026-03-26 03:53:06',1),(25,2,'Video Seed 05',NULL,19.80,6,'2026-03-26 03:53:06',1),(26,2,'Video Seed 06',NULL,24.40,4,'2026-03-26 03:53:06',1),(27,2,'Video Seed 07',NULL,29.10,3,'2026-03-26 03:53:06',1),(28,2,'Video Seed 08',NULL,31.60,2,'2026-03-26 03:53:06',1),(29,2,'Video Seed 09',NULL,26.75,5,'2026-03-26 03:53:06',1),(30,2,'Video Seed 10',NULL,22.30,6,'2026-03-26 03:53:06',1),(31,4,'Rental Seed 01',NULL,45.00,2,'2026-03-26 03:53:06',1),(32,4,'Rental Seed 02',NULL,60.00,1,'2026-03-26 03:53:06',1),(33,4,'Rental Seed 03',NULL,38.50,3,'2026-03-26 03:53:06',1),(34,4,'Rental Seed 04',NULL,72.25,1,'2026-03-26 03:53:06',1),(35,4,'Rental Seed 05',NULL,55.10,2,'2026-03-26 03:53:06',1),(36,4,'Rental Seed 06',NULL,80.00,1,'2026-03-26 03:53:06',1),(37,4,'Rental Seed 07',NULL,49.75,2,'2026-03-26 03:53:06',1),(38,4,'Rental Seed 08',NULL,67.40,1,'2026-03-26 03:53:06',1),(39,4,'Rental Seed 09',NULL,58.90,2,'2026-03-26 03:53:06',1),(40,4,'Rental Seed 10',NULL,73.60,1,'2026-03-26 03:53:06',1);
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `item_type`
--

LOCK TABLES `item_type` WRITE;
/*!40000 ALTER TABLE `item_type` DISABLE KEYS */;
INSERT INTO `item_type` VALUES (1,'BOOK'),(2,'VIDEO'),(3,'AUDIO'),(4,'RENTAL_EQUIPMENT');
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
INSERT INTO `rental_equipment` VALUES (31),(32),(33),(34),(35),(36),(37),(38),(39),(40);
/*!40000 ALTER TABLE `rental_equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `staff_account`
--

LOCK TABLES `staff_account` WRITE;
/*!40000 ALTER TABLE `staff_account` DISABLE KEYS */;
INSERT INTO `staff_account` VALUES (1,'admin.staff@lib.com','admin123','Ada',NULL,'Librarian','555000000000001',1,'2026-03-26 07:47:31'),(2,'staff@lib.com','admin123','Sam',NULL,'Assistant','555000000000002',0,'2026-03-26 07:47:31');
/*!40000 ALTER TABLE `staff_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'faculty.user@lib.com','pass123','Fiona',NULL,'Faculty',1,'2026-03-26 07:47:31'),(2,'student.user@lib.com','pass123','Ulysses',NULL,'User',0,'2026-03-26 07:47:31');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `video`
--

LOCK TABLES `video` WRITE;
/*!40000 ALTER TABLE `video` DISABLE KEYS */;
INSERT INTO `video` VALUES (21,3600,_binary '\0'),(22,4200,_binary '\0'),(23,4800,_binary '\0'),(24,5400,_binary '\0'),(25,6000,_binary '\0'),(26,6600,_binary '\0'),(27,7200,_binary '\0'),(28,7800,_binary '\0'),(29,8400,_binary '\0'),(30,9000,_binary '\0');
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

-- Dump completed on 2026-03-26  3:55:11
