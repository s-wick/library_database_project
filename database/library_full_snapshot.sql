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
-- Dumping data for table `assigned_genres`
--

LOCK TABLES `assigned_genres` WRITE;
/*!40000 ALTER TABLE `assigned_genres` DISABLE KEYS */;
INSERT INTO `assigned_genres` VALUES (2,1,'2026-03-26 17:03:46'),(2,3,'2026-03-26 17:03:46'),(11,4,'2026-03-26 17:06:59'),(12,5,'2026-03-26 17:07:48'),(13,3,'2026-03-26 17:08:23'),(41,1,'2026-03-26 05:18:30'),(41,2,'2026-03-26 05:18:30');
/*!40000 ALTER TABLE `assigned_genres` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
INSERT INTO `audio` VALUES (11,1800,_binary '\0'),(12,2100,_binary '\0'),(13,2400,_binary '\0'),(14,2700,_binary '\0'),(15,3000,_binary '\0'),(16,3300,_binary '\0'),(17,3600,_binary '\0'),(18,3900,_binary '\0'),(19,4200,_binary '\0'),(20,4500,_binary '\0');
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,'Author One','1st','Campus Press','2015-01-15'),(2,'Author Two','2nd','Northgate Publishing','2016-03-10'),(3,'Author Three','1st','Cityline Books','2017-05-22'),(4,'Author Four','3rd','Oak Tree House','2018-07-09'),(5,'Author Five','1st','Harbor Editions','2019-02-13'),(6,'Author Six','4th','Prairie Publishing','2020-10-01'),(7,'Author Seven','1st','Delta Press','2021-12-14'),(8,'Author Eight','2nd','Summit House','2022-06-18'),(9,'Author Nine','1st','Blue Leaf Media','2023-08-27'),(10,'Author Ten','5th','Lumen Works','2024-11-05'),(41,'Me & You','1st','A publication','2025-06-09');
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `book_room`
--

LOCK TABLES `book_room` WRITE;
/*!40000 ALTER TABLE `book_room` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_room` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
INSERT INTO `borrow` VALUES (1,1,'2026-02-01 10:15:00','2026-02-15 23:59:59','2026-02-14 16:30:00'),(1,2,'2026-03-26 04:05:50','2026-04-02 04:05:50',NULL),(3,2,'2026-02-03 09:10:00','2026-02-17 23:59:59','2026-02-20 11:05:00'),(8,1,'2026-02-10 14:00:00','2026-02-24 23:59:59','2026-02-24 12:20:00'),(12,2,'2026-02-15 13:40:00','2026-03-01 23:59:59','2026-03-04 10:45:00'),(22,1,'2026-02-25 08:25:00','2026-03-11 23:59:59',NULL),(25,2,'2026-03-01 15:35:00','2026-03-15 23:59:59',NULL),(33,1,'2026-03-05 11:10:00','2026-03-19 23:59:59','2026-03-18 17:00:00'),(36,2,'2026-03-08 10:00:00','2026-03-22 23:59:59','2026-03-27 09:20:00');
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (2,1,5,'2026-03-24 10:10:00'),(3,1,21,'2026-03-24 10:12:00'),(4,2,9,'2026-03-24 11:00:00'),(5,2,31,'2026-03-24 11:03:00'),(6,2,18,'2026-03-24 11:05:00');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Dumping data for table `fined_for`
--

LOCK TABLES `fined_for` WRITE;
/*!40000 ALTER TABLE `fined_for` DISABLE KEYS */;
INSERT INTO `fined_for` VALUES (3,2,'2026-02-03 09:10:00',6.50,6.50),(12,2,'2026-02-15 13:40:00',4.25,0.00),(36,2,'2026-03-08 10:00:00',9.00,3.00);
/*!40000 ALTER TABLE `fined_for` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `genre`
--

LOCK TABLES `genre` WRITE;
/*!40000 ALTER TABLE `genre` DISABLE KEYS */;
INSERT INTO `genre` VALUES (1,'Sci-Fi','2026-03-26 05:16:37',1),(2,'Dystopian','2026-03-26 05:16:37',1),(3,'Action','2026-03-26 17:03:46',1),(4,'Comedy','2026-03-26 17:06:59',1),(5,'Scary','2026-03-26 17:07:48',1);
/*!40000 ALTER TABLE `genre` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `hold_item`
--

LOCK TABLES `hold_item` WRITE;
/*!40000 ALTER TABLE `hold_item` DISABLE KEYS */;
INSERT INTO `hold_item` VALUES (14,1,'2026-03-14 12:05:00'),(34,1,'2026-03-20 08:55:00'),(7,2,'2026-03-12 09:15:00'),(29,2,'2026-03-16 18:40:00');
/*!40000 ALTER TABLE `hold_item` ENABLE KEYS */;
UNLOCK TABLES;

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
  `thumbnail_image` blob,
  `monetary_value` decimal(8,2) NOT NULL,
  `items_in_stock` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int unsigned NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_item_type` (`item_type_code`),
  KEY `fk_item_created_by` (`created_by`),
  CONSTRAINT `fk_item_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff_account` (`staff_id`),
  CONSTRAINT `fk_item_type` FOREIGN KEY (`item_type_code`) REFERENCES `item_type` (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (1,1,'Book Seed 01',NULL,19.99,5,'2026-03-26 03:53:06',1),(2,1,'Book Seed 02',NULL,21.50,4,'2026-03-26 03:53:06',1),(3,1,'Book Seed 03',NULL,24.00,5,'2026-03-26 03:53:06',1),(4,1,'Book Seed 04',NULL,17.75,3,'2026-03-26 03:53:06',1),(5,1,'Book Seed 05',NULL,29.99,7,'2026-03-26 03:53:06',1),(6,1,'Book Seed 06',NULL,15.25,8,'2026-03-26 03:53:06',1),(7,1,'Book Seed 07',NULL,32.40,2,'2026-03-26 03:53:06',1),(8,1,'Book Seed 08',NULL,18.80,6,'2026-03-26 03:53:06',1),(9,1,'Book Seed 09',NULL,26.35,5,'2026-03-26 03:53:06',1),(10,1,'Book Seed 10',NULL,22.10,4,'2026-03-26 03:53:06',1),(11,3,'Audio Seed 01',NULL,12.99,9,'2026-03-26 03:53:06',1),(12,3,'Audio Seed 02',NULL,11.49,7,'2026-03-26 03:53:06',1),(13,3,'Audio Seed 03',NULL,14.25,6,'2026-03-26 03:53:06',1),(14,3,'Audio Seed 04',NULL,16.00,5,'2026-03-26 03:53:06',1),(15,3,'Audio Seed 05',NULL,13.75,8,'2026-03-26 03:53:06',1),(16,3,'Audio Seed 06',NULL,15.10,6,'2026-03-26 03:53:06',1),(17,3,'Audio Seed 07',NULL,10.95,10,'2026-03-26 03:53:06',1),(18,3,'Audio Seed 08',NULL,17.35,4,'2026-03-26 03:53:06',1),(19,3,'Audio Seed 09',NULL,18.20,3,'2026-03-26 03:53:06',1),(20,3,'Audio Seed 10',NULL,19.99,2,'2026-03-26 03:53:06',1),(21,2,'Video Seed 01',NULL,23.99,4,'2026-03-26 03:53:06',1),(22,2,'Video Seed 02',NULL,21.25,5,'2026-03-26 03:53:06',1),(23,2,'Video Seed 03',NULL,25.00,3,'2026-03-26 03:53:06',1),(24,2,'Video Seed 04',NULL,27.50,2,'2026-03-26 03:53:06',1),(25,2,'Video Seed 05',NULL,19.80,6,'2026-03-26 03:53:06',1),(26,2,'Video Seed 06',NULL,24.40,4,'2026-03-26 03:53:06',1),(27,2,'Video Seed 07',NULL,29.10,3,'2026-03-26 03:53:06',1),(28,2,'Video Seed 08',NULL,31.60,2,'2026-03-26 03:53:06',1),(29,2,'Video Seed 09',NULL,26.75,5,'2026-03-26 03:53:06',1),(30,2,'Video Seed 10',NULL,22.30,6,'2026-03-26 03:53:06',1),(31,4,'Rental Seed 01',NULL,45.00,2,'2026-03-26 03:53:06',1),(32,4,'Rental Seed 02',NULL,60.00,1,'2026-03-26 03:53:06',1),(33,4,'Rental Seed 03',NULL,38.50,3,'2026-03-26 03:53:06',1),(34,4,'Rental Seed 04',NULL,72.25,1,'2026-03-26 03:53:06',1),(35,4,'Rental Seed 05',NULL,55.10,2,'2026-03-26 03:53:06',1),(36,4,'Rental Seed 06',NULL,80.00,1,'2026-03-26 03:53:06',1),(37,4,'Rental Seed 07',NULL,49.75,2,'2026-03-26 03:53:06',1),(38,4,'Rental Seed 08',NULL,67.40,1,'2026-03-26 03:53:06',1),(39,4,'Rental Seed 09',NULL,58.90,2,'2026-03-26 03:53:06',1),(40,4,'Rental Seed 10',NULL,73.60,1,'2026-03-26 03:53:06',1),(41,1,'Hungry Caterpillar but Minimaler',_binary '�PNG\r\n\Z\n\0\0\0\rIHDR\0\0\0\0\0\0\0\0\0�x��\0\0\0	pHYs\0\0�\0\0��o�d\0\0\0tEXtSoftware\0www.inkscape.org��<\Z\0\0 \0IDATx���y�e����sNwgcH� ��l3*[$!I\'����?�0n&�(���\Z�~�\r&��(�n���Ҥ��l\"\n\n� [�-Io�>�?���t��Su���./����ӝ~�󔹻\0\0@��\0\0���\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0ȡ��\0\0*c紽@ͥ����2M�i�\\{H��d;J����������σ����?��?!i��O�m�\nzP�ez@*ܯB��>��\'��\'PM���\0l��L��z����K��I������A��K�Kn��v��NI�6?u�=Ay\0�\0H![ܶ���i�O�i�����o�Y�[$[#O�W!Y��W�\n�?�\0\0)`��^,l��&S�\\{Fg���$uʭS^��+��\0`����6��A��I�\':S��%��$���7]�\'v�F�\0ԉ-m�Ino��-�%i|t���(�_��#�5_�w>�\n\0PC���U�}��9�^#�%8R��K�Fn�W���~��\'���\0T�-��&͜.���-iBt����S�.�#MW�����@@#�\0\0Ubߘ������~I/���`���%���\\h\0�B�l���d���%������%]!�W��gut �(\0@�L�^�H:*:ON�V���#M���\00z\0`l����!W��E�$���v��&K��������(\0�����L��M�H��L�E���أr?Oc�+`�(\0�0��h�N\'J:K���4�G$}E����3Vm��\0�\n[>�Y�q��i��?�LU��U�~��ve_t m(\0�s�̴d��2}F���yP���S���.<�Y\0`���`%:_Ҍ�,������;V�&:	�\0䞝���.�i��bt�T\"�;J���k�D�\0 ��6�/}���yc����z�g�/�$:\r��\\ڲ{�IӢ� �*y��;V��7\n\0r��5i��I��x3�1(�+����>���0@�P\0�v��Q�/�iJt�ҭ*�>���� @=P\0��LfZ:����&i|t�Z���4q��>�Rt��(\0hhv��}TL�G���,���U�|ފ?EGj�\0�[:��[���e~��䷶��}�Q�Za\0\r�.j���%;%:\Z�%*n��s�n�T\0\rŖ�}_�WFgA#�${��w����a��Y�WI7s�G�١�n�e�o�NT3\0ȼ-��?\"�D�Em��/i����S�:\n\02͖��$���ttt����kz����xt�\\\0d�-k{�|�JIEgA.ݮ$9���7:P\n\02i˫{.��Y�kIz��w�6:0Z</E�زY�(Q���#��Vز�7DF��L���N���$m��b�\\?�e�ڣ�\0�A@&��lY�%�����<�?)�}�-���Lf�a��`\r\0R�d�e3ϓ�#:�M������Г�(�p(\0H5[d�:��ؓYr���̥ �(\0H-�����?t��\'Dg��]�k:�vF���Tz�����H:>:P�K���xJ\0҈E�H����y�bq�G��C��c��X��ԡ\0 U�����������\0Ua:N��c�W��<\0�a2���I���,@U�����D�\0����X:�s������������X�T�%�2���9����}nt��p�l�;��1#�|H$��ۻ/��|�\0 �-��jyr��1�Y�:�W����z�����\0 ̖W�v�� ��T��}A� ��rE�p��J�q�G~���~f��&FA>Q\0Pwv�qE��#i��,@,{�J��c�\0D�\0���?t������QZ���C X������#�%�9��q{�wt]�A@�زهʓI㣳\0)ԫ�������A�\0ԅ]8}g�o����,@��+�Po����5\0����%��l�ޒ=:������N��ߣs\0�`o�%�N�N���#\0Ԕ-��RY�F�y`46*�a����� h\\�\0�flQ[���mq�Fk�\n��-�������u�s��F�\02�p%�F�@��\0jΚ-���d�(��*�����������_�\"�R���TQ�m�-U�\0��{d�OH:(:� �W�����#\0T�]0{?%ɭ��Fg\ZH���C|�?FA�`\0Uc2�\'K����1*��̢��qP\0P=KZO��5�1�5[Kf��G\0�\n;�.*��Q���,@[���@_���� �>f\0P��E����D٘��C�10���ҙH�;I�Z�ޠ\nv���=:��\0T��-n�@�4)��C ��@El��6�]�ȡ����W�!�]�\0�l��\n*���9��:�c8��_�oҌ��uXt �֮3�X ��#\0�ž6}���$��Y��O���;{�� {�@y������\"�΍�lb\0�fg3A�7�%�n�Y\0�!7��s�n��la\0�7a������ǟ\Z��\0FŖ��J�wK�9:�g٣\Z�������$�f\00:���!n�@��.jj9=:��\0��]8}g�Ct\0����^�w>��\0Fn�x���i��ZD�@v0������	��\"����=�����3�����\0Ff�M���H9�E�m:9:��\0l�->v����Kl�����eþ>���(H7f\0�m�O�(n�@6�������G�����r�pt\0��Q��m�/�����J�7:�Q9@[��F��|0:\0�2���0,bH���pIk�s\0(�\'�z�ʛ�c �����Έ�\0�Vd\0Cb\0[e���CE�GRKt\0e�7���EA�0��k�q���E\Z���\0�g��?�I��@�\\k҆����\0<_�o7�1�vӣ/xst�\0��6/:�*r�3���\0��-�}�,��$����\n��>����Hf\0����.n�@�I���0����M����%��@�mPq�>w��� Hf\0�wc��7�Q��d�ۢC =(\0x���\0�!���# =x\0I�-��RY�N��hd.���}wt�c\0ϰ�	��4:����Hf\0 [d�:�I{EgA���/U�T�?��Q�1��@s����O�||k�9m/ИAS�@�J-���;�mY�����ZI���A\rܣ��}]�yG�li�Q���΁��A�Ԥ=��9��jq[�֤�JoR⟓��Z\\ubj����E�@���\0H?���s]�I>P��}a砤��c��\'ϓ�Z^5�v���S 3\09gKڶ�\r>,i|t�������ے�se�@ĵQ���[���X�9:�0��fq��&�5j�93�����!�Wa�G%�Ӹ�c�C  �\\���W�����z��� ٣QP�ď���X����\"�s����s�����< O�F�@Lo����q(\0yVh�#�9:F�Ǿ�����J�Yt��x������C�3c�?��T(|$:����%�E��(�� �(\09e�������%��>oş�c�3���.ɾ\Z���:�����C  ���*��Ys�����C��I�?:Fe����!�@n9��\Zׇ�̫7F��wt>-�F��(��+6�!�ƴ�4�|��bt��J����}�v���͸Nn���`��T��Ͻ�� �/f\0�h��-��%�\n~z�o���L���j�>��\r��):��K���\\��z�F�)���&����`�1@Q\0r�.������90bOi�F���}J�S�10bG��֝�C��(\0y3P|���\';\\_�Ӻ��1Z~Z�#r;\':F�E� g(\0y�����c����{m\Z�I�E��H����(\09b˧4����!�/�靏G�(�Ͻ�	���#�:֖Oav0G(\0y�Lh����մ���\\:Wl�;�4~zt� O<a�/+\\��k7EǨ���j�d_�΁�b��\n@��Ý\rh҆����v�%=#a��\n@N���J: :F�������Z��+�dZ�#r�-�����\n@^�\n���\r}jh����&Y*�7:F��LaNP\0r�����w���GǨ6��r��ˢs`D+r�����%��#�,�NP3��#`�mߜ�}t� 7�����ئޱ������n��2:��E���\n@;|e�)�!��Ϙ}�#�<�\048[dI���t�v����5���Gbc��s�e�@���v�q��I�1�M���J�!j�v�uItl�i7M�����-\n@�Kttt��;:Aݸ�G�G��6X����Q\0\Z�Q��M=��sGt�z��wJZ���Nhp�f_�>N2^�zvqt�����3�����FEhd�fI\Z�ڬ����C�]q��$m���a�UK�@40\n@#s�����w>���|�5OH�\":���c�FFhh��_���p��Ϟ�\"�FFhP�lƮ��O�ݧu=�F�3i�5bO�tsb��&F�@mP\0\ZURx�$�������Г�Q|�e%��t+hp�5�!P�F��]��_!��5H=c-Q��\04.~hS����Uk�S���j��{�c`8�/\r�Ѐl��$�(:�u��s�ޖ���s`X{������\04\"7�٥�����!� �ܙQl@�FdzUt����ݿ�N�\Z�+�H���F⯊���\04��\\��s`f�1��w.w�� �L�2�*j0�Fs���i��+ߟ���$�v��E�@uQ\0\ZM�^úG�V�6:D�,蹁�\0)W�1@��\04���0�1��|.w�~��bli0����H\n�\0g(�~\Z�`@á\04����cZ_X\"�&��%٣�10$�4\n@#�����vF�H+�sYI�_D��0X�P(\0��gti������DG��c\Z�A��?��46�::D�\r�BRt�u\0\r��(x��v��I=OE�H;?m���]�Cb@�\04\n����1�?b��J3�4\n@���\\z����F�`?��^	��X� (\0\r���)��������Y�s��O�-�90�4\n@#��� �������2�����\0\Z�$�ú*:@�$��j�h���3��ڠ�{�&:D�L�|��Ǣc`H�9\r��q<�O��}�e��Y��k����\0\Z ����9S��2��\0\Z\0 �������_F�Ȭ�]%>�^��<\n@��,.�L7�ܮ�cdՖ�ݭ�90$ƞ��\0d��SΙ����i�:�̣\0d��ӎ�W�X�f��8\n@��1�^O�ػ::D�6���dt�u\0�FȲ��\0(�~�s�D��:��v@��S�1(�(\0e�� ׫�s`�����]Cpk�E�}$���e�n��41:��$��Z-%�k�Z��&MEt\n���UI�5�0���c՟�C4\n_�}����s`�cQFQ\0�ʌ��2~c�>�6:��b,�(\n@��/k�43:��\n@��S\0�k֖1	CȢ�/�*i���\rvFGh8��*:�4A�����=\n@��::���������O�y@��90d ��aK3��k�� �,aL� \n@���)�%�C�&UC,L-�iv�1�c`t(\0Y38n��1�1�U%5�VD�hX̓����ت�zFt� k��_z�n�W=�Q�ɫ�����d k�Y\0�V��ל��Bj�6)s(\0bN�Y�C�s`l�[{�:�;Ԗ��=y�P\0�d��M|�Ҫ_��[��5m��[U�����9n&Y��[z]�g^�1:D��k7I�!:��%�B�\n@j15]7|�2�X�)����f�!i��7���\0�e:���#CȊ�Cڨ]�Mt�ܘ��\ZIOG���ۢ#`d(\0YaL��X�Ϲ�?:D^l�Z�D��P��rVP\0���UZ1�_��^�feYA�\0[:�\0�x��V|���\nE����\"�`�~�!�m�,�Q��=�GV�\Z�\"w�E���BRb��\0\n@6�\00��;}��:��t]tŎ�N�m�\0��-����K�!��ڧ�kl���� �q3$�C)p��Ϋ��kG\rL82:�GH��E��֩���!rk����z8:�P�����Q\0���QjY��=:E^��e�΁�$�])GH1[>k���G��LLA��{�ZvȖ-̑R�4L��d�10�Į���{�_C2\n����Q\0Ҭ`L����Ӏu\0�f<�L3\n@J٢�&9��O/����\0��_k�W�N���\0�ծGJzAt���i��\"�v�c�[GH/��Ҍ�c/�4+�(sJQ\0R���\0CZ�y���-�u��u\0)f	cYJQ\0R�Ο���WD��Px��&�H;;Ԗ��8:���F��#`L��ߓ4���GG��Q\0�������O�H;ƴ2g&3Ul��;�ԻNRKtl�:����#�t1�i��e�-:�j@ű�|�5OD��1�6I����?�x��F�H�f�z�0e(\0i��TY���?��ޤ���	��(\0)b�ښ��Ӎ����:���c��qH	\n@��̒�St���ӌ�����mpft� M��O7�u<�O/�d�҄�&3����(0���H3��?3�!\r(\0iq��i�����a��?�X�v/Ҳ�WF��3(\0i�6\':����,`@���R��&3��5:������u\0Y���c�t�\0���������u]t�E:��!@H��x\\tl�ٯ�#`���`<H\n@�-����O�{}ފ?E���x{���%:�a:��\0�(\0і�N��Wtǯ�N�Qr�6:��c��\0�s����D�٤��Q\0����HL�%*4��d֔�W���FA�n��{P ����?�ZI{D���n��C`t���G$�\Z��p���g�&:F�Q\0BN�N�mp������Wb�Dbˏޑcd����r�{�v�o�s�^#�(\0Q��wI\Z��U���(���.I��c`X��RbT\n@w��RϺ��U�@2�O�앉�v�X���o�_����Ox��}<H��|���!�����#`�F�:qfCR|Ot�<�\0ԙ-��,���ئ�4����eݺ��$=�t�-jk��7�zKƿM|�?~����z\"ٕ�9�\r�=5����yC��D���0�<:���^f�9cc�Q\0�Ȗ�.�#�s`����g����Ւ��c`�Z킙S�C�	������������C�:���OJ�΁p-���\'�:�e3v��\r/2��2n8<��w�7��#/(\0��@Ҙ��b�Ec\r�~�\0#2F�Ms�C�9�k�;Fŧf�~�{{��F�@�ْ�?�Ć3���&nx�Ϲ�u5�@=����?3~\Z\05b�����Z����C�����c&H�xt�ϊ��͐���S�G�ht�Z�������i]���!P#7�H�#2Y��O���(\05dˏ�Q�3�s`�~�;�C�6�|o��΁2��-m�):F#�\0�R��LI;G���1E����g����)�E�[<k��F���������5���+%\rD��H�[�R�\0�V��YI�G���]��w>��\'�zL������䋢C4*\n@\rزه�tJt��]�\0��?�N�Q�kKg�\":D#�\0T��L*�#��#֫�>��ŦJb�gv%?\':D#�\0T���w�mVt���*�{��1P>�s�����6[������PE��m;ɿ��vyt\0ԙ� C\\R��K�A\ZMSt��2�����N�Q�,51��7����:W��f�\'����oyǪ?G�iD��J���)I~\'���1�o�y{t\nԟ-m����x��J�Z��S_�It�F�@�$����?��� ��D��T\0\0\ZwIDATH��r}�;����\n@زYo������*nfg��j)}_��ŒZ���y�L�y=k���\r�\0*d˦�P�t��Dg��]�����8���\'���#������ō(`*`�� /|��F���?�\\ߋ��C�d���5�������G\0���z�䯎���<�����i�O4a�FI����*\n\'���f\0�b��cKZ/�9��*���6G�@,?�ꍒ~�#�$}L\'����\0��-�Ҭ��oU�}F���yP/\\)a������1\Z��U*��O]�� �G,�OiVi�v�����@��T�E�d%����t���c��\n�V{�Ky�i�Z�]g�-i��,\r�\Z�\'�I=OE��5���?u��TH�kIH�]�	rM����y��#@��~pɥ�IJ�لҸO4���?��=�%��%�OEgi �\\�VG����M���`��V8����t�\\�K>And�%i�\\d�Q��r=(ӝ&��<�cS�ݡ5k����\Zf������U�6��Z�^љ�J���%�`��A��|ƾ*�$ɢ�4��${��w�m���G�{󀵺�(3;Z�>U�ă2���W%/^=���?2]\0l�샤�2�M�~�y�~����&:�ǖ�\\��<+���^��n����?� ��W���N��/+]Ҳv��|����#\0[�6Q�໔�x��D�AƘ�)��G���=(K^��W�V�+L�2�/)��d�K����r}B^�D�a�np���J��ڵ�3�Zff\0ly�^\Zԇd:E���<�\"{T�{�����I�>����4��W�з��P8�V��2e�b��!��y��s���f}n�\r7�f$R_\0�����|L��%5G�A�����gF�@zٲ�s��`t���_I2��jz��O�h��|����>�H��K��s�o�3��\0;��	���S�>�>�@���������T�x�X8RO���>��������\'��f}�4ْ�}J�W?fkRY\0lI�U����΂a����>*:ҏŀ#�Y��zGwO5O�w�o4�%RÌ�����n�D)��j+`;o�>���Z�~��U� :2\"�e�2�$ٜj��{�����S�5���qn��4٥�=���f�j���\0[���%�EgA�yH7\\Q�����E�H7�T5?���7���{��.����[��:\':˳�lق���>\"���&l��w}&:�Ö��;�j�ySUv��2��?)�m�w�-n��ú���� �3\0�|�d\r�[%���7�է�~��1:MZ*)tpN�?�8��j��7M�2�?)�q�7���yB�ƗO�-2HX�%�_�����j�~�ꇣC [|n׃��7:G���Tx�Ͻ扊Ot��}���\n�n��4��ٯ�;tZ�.�!�Λ�rYq���D\\9Rй��QV�Zt�t�OW㕾�S���P��}�$�S0�8䕇F\\����Κ�b�#i�z_y��V����\r���&�wE�H�5���W+=��aG�VRꑌ��v�B��ç����u-\0�t�+$����y]����2	3H�����>�R%\'�?|�+���퐸~60����yѺ\0[2��r������1��pϕ�1�q���BRM����Y�������oʔ}�~����C�$��;d����`]\n�-����x�L�+�#�_���D�@����Jr�rt�@wk`��fҞ>xƮ����{�25,�&�骍GQ��U��->v����ł�Ͻ*�~7:\ZĤ�.���1B�}�O�������oLKq��4L/i��e/k���j?��������l��v :\Z�Ϲ�_�U�\0.sܮWG�*9���;Yy��_�LSZ&|�֗�i�e�o���Z^�\'�T��ft4��MHz$:F�dgV��O��S����\\:��Щo��5jV\0ly�^r]�|���p~��]�):\Z�3���u�s�X��܃{�L���+e2}������5)\0&3�t���kq~`��8nIt4*_,��]���.�P��/�5�T,��Z��63\0�f�K�����jlS\nl��wo����g�������+���o��7����^�sW�\0��i;��K�>/�\r�5�ٴ�U\Z��d�FǨ)O�P��Ӧ� �����)Sv��i�?Pl�������E?���hl~��\'%o�}��#+\\����9�����JŅ�>iU�]0{?�T��<��^���>6�?O�}ä]\\�Z}�N�ϥ�j\'�3�tZߔ)�V�՝(%�T��9�m1�/V��^�̫7ʼ�i��rɿ]��f��_[M�V�U+\0��u/�������?\r����șq��\Znw@�noﾻ�C7qċ$��ʉ�O�����f�]��Uo���Hj�����0}���J�2����r}::Gu����4��J��ֵPsQ����ɪR\0l�I�N�ƹ�3ݨ�{�9���bI7GǨ�A�6���#;l��1�׉�߯�Sw�ƹ�3���4�*�F�d���=���U��O�|������__����8Qu\n@³ԙ������1�o>��:I?��Q9���#e��uf�W�k^q�%��m��AY��!�g��%e��V^�?�ȃ�����4���WP�i�0����s\0����u��$o�CnD��C��U�Zw�� V,���sT^\0Lo���ȭ�����wVv����������+=CE��M���*\r���C�`MFZ4*_��Q�>��,fk�9l�!�����=([e3\0I�5��\nu�\\تG�/����1F�UVh*���m�U�_Y(8�|D���X�_�T%P[��%6O�`t�Qp%�7�u���J��\0�WWt<0r�������w���c�R�#5w��`&U�=(�\0�򶉒�����ݡ����h$��}RRV>�rgYGM������e�w.���g\0�RşAF�$����Y�]�\'/�_R�w�4�_9�\r���?%�$��{l������y�ߵ2:0\Zޱb��ύαM^^p+R\0�\"��\0Ӂe��k���?(���OH�5:���/��^�M��Q\0\\�\0���RS���6�[�\"����^�\n���eH��5��z\n��{��s��sW��ĖO|$:ǐ����u�3���K��{l%`�\n��s�wt+:P���I�Yt��*hsY��Z�|�r���\08P����=:P-.w��N��/�Y������\\e�tPu�v(�X`�6K��w>�&?y�c*؛�2㮕���eIH	�)\0L��\\f\'y{�o��\0���o���s���ƕ7���\ZT\0��q}��w]\Z�%������s���,:�TR\0��Z\n��R�&2:P���:�cH���ƕy$�J��T��VR\0ʾ(�w����>�Rt�|��%�s$�stǍ/�H���0\n\02�	y��,�C���5�*I�,��� M��:��S$�\0��\0���Mޱ��A�����2;NR�n��M��\08�\0��U����w��e��+��.o�Z��󻮖�dI���J��P���L&�}/����\\�3|~���S\0i��/���B.n�WY�9�j����C)\0�3[��]��S\0i�]_�)�����r�23����\n�Xk\0\n���.��.^�l���3$-��5]e�\0X�0��E��{q���\0�K5i��@Z��5qr����w9�5\r4�=��j�?�{l���yTҽ��\\��&N~����s.+i]�	�~X���/��V=&��4�g���,�n|m�ǣ��Ś8������񅝃��ᝒ�����ϚT֑f���0�\\�u%�WV\0\\�Ut<\Z݅Z�}7`t|�m����[%�v�/V���9��)\0��+�R�����*:���u���=��d�Ϲ���{�(�j|��\n����c�`�W\0�Ԟ���<�X�{�q�*�s.+��\'K��\Z^��0�ƞd����0~��+9A^�?��h������cv6\Z�/�D�+�J��\Z]b�-�����Y�����Wz��@bW|4�A����������r�{{�\'$�*��3k�ݴ��C�ʕ�EU͂�W�qъ�/�S��Tzd��*��|~��A�F����K�6I��|�וsИ���)����s�o*~�R�G\0�,�VU΃,�_��y=WF��ۻ~,�1��W�vlهJ�T-F��U��W�\0�/U�)���;y�H��}Kt O���[�TI���	͏���RΡc\n���657�e�8QU\n���\\_�U�H��T��+�䑷w߭��钮���*�yKYG�]��$��:1��Z���j��:3\0���/K����V�Lgi]�|�5OD���O[��&N~�\\_�T��[?��#K�%1��Cߠ7�]���Wq��-��u�N��	�2�����ݿ�N����ޤ�_,i����z{OY�����u��kȥecn\\�^��Uo@���I�U=\'���VI�pn�@:���+T,M�t{�\')���c%���\Z�T�V�\0�ܕw�|q5ωTX���3}�J�����]�Gy�T�}�����.?�XΡc֮����+��6�s�޲�Ʝ�{���i;��������I�N�n>�	d�-k=^��%m?���xGWy��8s�����²��Pli��z���<iuhˢ�U����U������l��ݗ(I^.i�4�O�YY�c�S��Yֱ�}��7�@�|~ץ���S�0�%?C�zZ�c՟��\0(�/Xy��5�J��4������W�{͖W_j���a�eˍ�+��kjR\0$II�}�U峊��[%���=��&?�1���Ao���d��t�2�h%�l��Ib��܆$)̫��kV\0�c�}Jt�*�l*�`@��Z�t��w�\Z@�y{׭�eÑ�F������h[:sZ��\Zw�\r���D1�W�����7]��Z]��\0�w����&��5�*�R���+o��>lɌCd�$1��v�:�gT�vρC����1�����߮�H-/Q�G\0Ϛ��G%���u0Z�u��{Z����+oֺ�#e>_�c[��̏Ԓ���:��>*g�/ê+�g�/R�\0I�ų&�ɻ%P�a[�Z����f+_\0v����W\\(ө��_\nMUa�>w���/p�a����[��?Bw\r،	�[�p�/T� I�|ƾ*z$�^�bk��%�����E�.�<�H��O�ק���s����#^b��#ir%�Ɂ��fT{ß�ԭ\0H{�B�u�($�.�}��w]\Z@z�̴t��%}^Ҿ[��^�p��U�Ò��L��R��T��A=iI��sS�.X�5\0��+oVRx�$����^�ޯ�惸�����w_���En�!�IcU�mQ[S%�nY��w�����5O\n��z���:�\0����f�L^���.�V�I���5��\'v�F��Mv�14~�)�>�����{>[�9�~��Td�����u�7�P���!@�li�K$�Z�hL�$}Q���~ƪ��a\04�����gJ�K��R�ރ��S(����B��r���1c~��jX�$�ƴ�4�|���a!\Z��Ef�)i��;:��N\0۲���vkn�+d��W�h�ͺ��G��\0I�EmM�4�I�>�:�Ih\0+%��uM?򅝼�@���5�?���\\��n����OX���$�\0<˖��Q��$��%��$]�����o�\0��;��7��Ej���	�Nn�q���H)*\0�d���[��7$�%��l����>�s}t\0����f�]T�.o�����R�Ow�\r�EGyV�\n�����/�E�Y��J��\\�h��+}�e��@\0PK[f\Zh��L����|+:�?Ke�$[<m57�%��$U��ӌ�{���\\^�1��\0�δi;��Yn���?`��n�w�nK�8���,[>c_%���u����<5�\\ר��0�\'��\0R�G��h~���J\Z�g��%���}v�M��f8�/\0ϲ�m{�8�a��/i\\t�*�C�_����ߡ�O��/:\0��ƗOۭ��ϐt����y����\'I��nY���0#���,;�.*��C������H�N�N�t��_ut \0Ȕ�Sw��wX�ǧh����~I�@ӥ�m��_��R�+\0�e����6IE�y�\r�n�l����xG�Cѡ\0�Q�2u+��G���K�}�·�>�?�L���&+I^��^-�WK��_���LwI�K��e~�J��yǊ�|�\0\Z���ص�08��G��(�^R�K<(S��~5XL�J�G�*�0��م�wVay�@��iI�K� i{=�J������>I�$I�~����	ɟ��A�G�����*��%ݧ1�=~R�S!8\0��^6}�1��J��\nH�_�g��������3����)�=m��Rr��ݡ���<�|�n�������-\0\0\0`hy�{\0\0<\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@Q\0\0\0�!\n\0\0\09D\0\0 �(\0\0\0�\0\0��\0\0\0�C\0\0\0r�\0\0@��U��IU�f�\0\0\0\0IEND�B`�',1249.00,2,'2026-03-26 05:05:21',1);
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `item_type`
--

LOCK TABLES `item_type` WRITE;
/*!40000 ALTER TABLE `item_type` DISABLE KEYS */;
INSERT INTO `item_type` VALUES (1,'BOOK'),(2,'VIDEO'),(3,'AUDIO'),(4,'RENTAL_EQUIPMENT');
/*!40000 ALTER TABLE `item_type` ENABLE KEYS */;
UNLOCK TABLES;

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
  `item_id` int unsigned NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_equipment_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rental_equipment`
--

LOCK TABLES `rental_equipment` WRITE;
/*!40000 ALTER TABLE `rental_equipment` DISABLE KEYS */;
INSERT INTO `rental_equipment` VALUES (31),(32),(33),(34),(35),(36),(37),(38),(39),(40);
/*!40000 ALTER TABLE `rental_equipment` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_account`
--

LOCK TABLES `staff_account` WRITE;
/*!40000 ALTER TABLE `staff_account` DISABLE KEYS */;
INSERT INTO `staff_account` VALUES (1,'admin.staff@lib.com','admin123','Ada',NULL,'Librarian','555000000000001',1,'2026-03-26 07:47:31'),(2,'staff@lib.com','admin123','Sam',NULL,'Assistant','555000000000002',0,'2026-03-26 07:47:31'),(3,'guy-librarian@lib.com','admin123','guy','L','Librarian','+11234567890',0,'2026-03-26 09:42:16');
/*!40000 ALTER TABLE `staff_account` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (1,'faculty.user@lib.com','pass123','Fiona',NULL,'Faculty',1,'2026-03-26 07:47:31'),(2,'student.user@lib.com','pass123','Ulysses',NULL,'User',0,'2026-03-26 07:47:31');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-03-26 20:30:49
