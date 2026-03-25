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
-- Dumping data for table `audio`
--

LOCK TABLES `audio` WRITE;
/*!40000 ALTER TABLE `audio` DISABLE KEYS */;
INSERT INTO `audio` VALUES (201,'Learn SQL in 60 Minutes',NULL,3600,NULL,14.99,5,'2026-03-22','sysadmin1',3),(202,'Database Design Essentials',NULL,2700,NULL,12.50,4,'2026-03-22','sysadmin1',3),(203,'Academic Writing for Researchers',NULL,3300,NULL,9.99,6,'2026-03-22','sysadmin1',3),(204,'Public Speaking Fundamentals',NULL,2400,NULL,8.99,7,'2026-03-22','sysadmin1',3),(205,'Linear Algebra Audio Guide',NULL,4000,NULL,15.50,2,'2026-03-22','sysadmin1',3),(206,'Study Skills for Exams',NULL,1800,NULL,6.99,9,'2026-03-22','sysadmin1',3),(207,'Time Management Workshop',NULL,2100,NULL,7.99,4,'2026-03-22','sysadmin1',3),(208,'Research Ethics Overview',NULL,2600,NULL,11.25,3,'2026-03-22','sysadmin1',3),(209,'Intro to Machine Learning Audio',NULL,5000,NULL,16.95,1,'2026-03-22','sysadmin1',3),(210,'Campus Orientation Audio Pack',NULL,1500,NULL,4.99,0,'2026-03-22','sysadmin1',3);
/*!40000 ALTER TABLE `audio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,'Database Systems Concepts','Abraham Silberschatz','7th','McGraw-Hill','2019-01-15',NULL,89.99,6,NULL,'2026-03-22','sysadmin1',1),(2,'Operating System Concepts','Abraham Silberschatz','10th','Wiley','2018-03-05',NULL,94.50,4,NULL,'2026-03-22','sysadmin1',1),(3,'Computer Networks','Andrew S. Tanenbaum','5th','Pearson','2016-10-10',NULL,84.25,5,NULL,'2026-03-22','sysadmin1',1),(4,'Clean Code','Robert C. Martin','1st','Prentice Hall','2008-08-11',NULL,49.99,7,NULL,'2026-03-22','sysadmin1',1),(5,'Design Patterns','Erich Gamma','1st','Addison-Wesley','1994-10-21',NULL,54.95,3,NULL,'2026-03-22','sysadmin1',1),(6,'Introduction to Algorithms','Thomas H. Cormen','4th','MIT Press','2022-04-05',NULL,99.95,5,NULL,'2026-03-22','sysadmin1',1),(7,'Artificial Intelligence: A Modern Approach','Stuart Russell','4th','Pearson','2020-04-28',NULL,109.99,2,NULL,'2026-03-22','sysadmin1',1),(8,'Python Crash Course','Eric Matthes','3rd','No Starch Press','2023-01-10',NULL,39.95,8,NULL,'2026-03-22','sysadmin1',1),(9,'The Pragmatic Programmer','Andrew Hunt','2nd','Addison-Wesley','2019-09-13',NULL,47.99,6,NULL,'2026-03-22','sysadmin1',1),(10,'SQL for Data Analysis','Cathy Tanimura','1st','OReilly Media','2021-12-21',NULL,44.99,0,'https://example.com/sql-for-data-analysis','2026-03-22','sysadmin1',1);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
INSERT INTO `borrow` VALUES (1,1,1,1,1001,'2026-03-01 10:00:00','2026-03-15 10:00:00','2026-03-14 16:30:00'),(2,1,2,1,1002,'2026-03-03 11:15:00','2026-03-17 11:15:00','2026-03-18 09:00:00'),(3,1,6,1,1004,'2026-03-05 09:20:00','2026-03-19 09:20:00',NULL),(4,2,101,2,2001,'2026-03-06 14:00:00','2026-03-20 14:00:00','2026-03-18 10:10:00'),(5,4,301,1,1005,'2026-03-07 13:45:00','2026-03-10 13:45:00','2026-03-10 12:00:00'),(6,1,8,2,2002,'2026-03-08 15:10:00','2026-03-22 15:10:00',NULL),(7,3,201,1,1003,'2026-03-09 16:30:00','2026-03-16 16:30:00','2026-03-16 09:00:00'),(8,1,10,1,1001,'2026-03-10 10:25:00','2026-03-24 10:25:00',NULL),(9,4,302,2,2003,'2026-03-11 12:00:00','2026-03-14 12:00:00',NULL),(10,2,108,1,1004,'2026-03-13 09:30:00','2026-03-20 09:30:00',NULL),(11,4,309,2,2001,'2026-03-14 10:00:00','2026-03-17 10:00:00',NULL),(12,1,2,1,1001,'2026-03-25 12:30:26','2026-04-01 12:30:26',NULL),(13,1,3,1,1001,'2026-03-25 12:30:26','2026-04-01 12:30:26',NULL),(14,1,4,1,1001,'2026-03-25 12:30:26','2026-04-01 12:30:26',NULL);
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (4,1001,3,202,'2026-03-25 12:30:33'),(5,1001,3,203,'2026-03-25 12:30:34');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `faculty_user`
--

LOCK TABLES `faculty_user` WRITE;
/*!40000 ALTER TABLE `faculty_user` DISABLE KEYS */;
INSERT INTO `faculty_user` VALUES (2001,'daniel.anderson@uni.edu','pass123','2026-03-23 00:34:41','Daniel',NULL,'Anderson',2,0,2),(2002,'mia.thomas@uni.edu','pass123','2026-03-23 00:34:41','Mia',NULL,'Thomas',1,0,2),(2003,'william.jackson@uni.edu','pass123','2026-03-23 00:34:41','William','R.','Jackson',0,0,2);
/*!40000 ALTER TABLE `faculty_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `fined_for`
--

LOCK TABLES `fined_for` WRITE;
/*!40000 ALTER TABLE `fined_for` DISABLE KEYS */;
INSERT INTO `fined_for` VALUES (1,2,5,'Late return','2026-03-18 12:00:00',1),(2,9,25,'Equipment returned late','2026-03-15 09:00:00',0),(3,11,40,'High-value equipment overdue','2026-03-18 10:30:00',0);
/*!40000 ALTER TABLE `fined_for` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `hold_item`
--

LOCK TABLES `hold_item` WRITE;
/*!40000 ALTER TABLE `hold_item` DISABLE KEYS */;
INSERT INTO `hold_item` VALUES (1,4,1,1003,'2026-03-10 09:00:00','active',1),(2,6,1,1005,'2026-03-11 10:15:00','active',1),(3,6,2,2001,'2026-03-11 10:45:00','active',2),(4,6,1,1002,'2026-03-11 11:10:00','active',3),(5,301,1,1001,'2026-03-12 14:00:00','fulfilled',1),(6,10,2,2002,'2026-03-13 08:20:00','cancelled',1),(7,108,1,1004,'2026-03-15 13:30:00','active',1);
/*!40000 ALTER TABLE `hold_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `image`
--

LOCK TABLES `image` WRITE;
/*!40000 ALTER TABLE `image` DISABLE KEYS */;
/*!40000 ALTER TABLE `image` ENABLE KEYS */;
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
-- Dumping data for table `librarian`
--

LOCK TABLES `librarian` WRITE;
/*!40000 ALTER TABLE `librarian` DISABLE KEYS */;
INSERT INTO `librarian` VALUES (3001,'maria.garcia@library.com','admin123','2026-03-23 00:34:41','Maria','Beth','Garcia','555-210-3001'),(3002,'henry.martin@library.com','admin123','2026-03-23 00:34:41','Henry','John','Martin','555-210-3002');
/*!40000 ALTER TABLE `librarian` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `meeting_room`
--

LOCK TABLES `meeting_room` WRITE;
/*!40000 ALTER TABLE `meeting_room` DISABLE KEYS */;
INSERT INTO `meeting_room` VALUES ('R101',2,0,1),('R102',4,1,1),('R201',8,1,1),('R202',12,1,0),('R301',20,1,1),('R302',30,0,1);
/*!40000 ALTER TABLE `meeting_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `rental_equipment`
--

LOCK TABLES `rental_equipment` WRITE;
/*!40000 ALTER TABLE `rental_equipment` DISABLE KEYS */;
INSERT INTO `rental_equipment` VALUES (301,'Dell Latitude Laptop',NULL,999.99,4,'2026-03-22','sysadmin1',4),(302,'Canon DSLR Camera',NULL,899.99,2,'2026-03-22','sysadmin1',4),(303,'Portable Projector',NULL,420.00,3,'2026-03-22','sysadmin1',4),(304,'Audio Recorder Zoom H1n',NULL,129.99,5,'2026-03-22','sysadmin1',4),(305,'Tripod Stand',NULL,45.00,8,'2026-03-22','sysadmin1',4),(306,'Wireless Microphone Kit',NULL,210.00,3,'2026-03-22','sysadmin1',4),(307,'MacBook Air',NULL,999.99,1,'2026-03-22','sysadmin1',4),(308,'HD Webcam',NULL,79.99,6,'2026-03-22','sysadmin1',4),(309,'USB-C Docking Station',NULL,149.99,0,'2026-03-22','sysadmin1',4),(310,'Graphing Calculator',NULL,119.95,7,'2026-03-22','sysadmin1',4);
/*!40000 ALTER TABLE `rental_equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reserve_room`
--

LOCK TABLES `reserve_room` WRITE;
/*!40000 ALTER TABLE `reserve_room` DISABLE KEYS */;
INSERT INTO `reserve_room` VALUES (1,'R101',1,1001,'2026-03-23 09:00:00','2026-03-23 10:30:00','active','2026-03-20 12:00:00'),(2,'R102',1,1004,'2026-03-23 13:00:00','2026-03-23 15:00:00','active','2026-03-20 12:05:00'),(3,'R201',2,2001,'2026-03-24 10:00:00','2026-03-24 11:30:00','active','2026-03-20 12:10:00'),(4,'R202',2,2003,'2026-03-24 14:00:00','2026-03-24 16:00:00','completed','2026-03-18 09:00:00'),(5,'R301',1,1002,'2026-03-25 16:00:00','2026-03-25 18:00:00','cancelled','2026-03-20 12:20:00'),(6,'R302',2,2002,'2026-03-26 08:00:00','2026-03-26 12:00:00','active','2026-03-21 10:00:00');
/*!40000 ALTER TABLE `reserve_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `student_user`
--

LOCK TABLES `student_user` WRITE;
/*!40000 ALTER TABLE `student_user` DISABLE KEYS */;
INSERT INTO `student_user` VALUES (1001,'emma.johnson@uni.edu','pass123','2026-03-23 00:34:41','Emma',NULL,'Johnson',2,0,1),(1002,'liam.smith@uni.edu','pass123','2026-03-23 00:34:41','Liam',NULL,'Smith',1,1,1),(1003,'olivia.brown@uni.edu','pass123','2026-03-23 00:34:41','Olivia','Grace','Brown',0,0,1),(1004,'noah.davis@uni.edu','pass123','2026-03-23 00:34:41','Noah',NULL,'Davis',3,0,1),(1005,'ava.miller@uni.edu','pass123','2026-03-23 00:34:41','Ava',NULL,'Miller',1,0,1);
/*!40000 ALTER TABLE `student_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `system_administrator`
--

LOCK TABLES `system_administrator` WRITE;
/*!40000 ALTER TABLE `system_administrator` DISABLE KEYS */;
INSERT INTO `system_administrator` VALUES (4001,'sysadmin1@library.com','admin123','2026-03-23 00:34:41','System','Admin','Admin1','555-900-4001'),(4002,'sysadmin2@library.com','admin123','2026-03-23 00:34:41','System','Admin','Admin2','555-900-4002');
/*!40000 ALTER TABLE `system_administrator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_type`
--

LOCK TABLES `user_type` WRITE;
/*!40000 ALTER TABLE `user_type` DISABLE KEYS */;
INSERT INTO `user_type` VALUES (1,'STUDENT'),(2,'FACULTY');
/*!40000 ALTER TABLE `user_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `video`
--

LOCK TABLES `video` WRITE;
/*!40000 ALTER TABLE `video` DISABLE KEYS */;
INSERT INTO `video` VALUES (101,'Intro to Relational Databases',NULL,3600,NULL,29.99,3,'2026-03-22','sysadmin1',2),(102,'Advanced SQL Workshop',NULL,5400,NULL,34.99,2,'2026-03-22','sysadmin1',2),(103,'Networking Fundamentals Lecture Series',NULL,4200,NULL,24.50,4,'2026-03-22','sysadmin1',2),(104,'Software Engineering Best Practices',NULL,3900,NULL,27.75,2,'2026-03-22','sysadmin1',2),(105,'Discrete Math Review',NULL,3000,NULL,19.99,5,'2026-03-22','sysadmin1',2),(106,'Computer Architecture Seminar',NULL,4800,NULL,31.25,1,'2026-03-22','sysadmin1',2),(107,'Research Methods for Students',NULL,2700,NULL,18.50,6,'2026-03-22','sysadmin1',2),(108,'Cybersecurity Basics',NULL,3600,NULL,26.00,0,'2026-03-22','sysadmin1',2),(109,'Version Control with Git',NULL,2500,NULL,17.95,4,'2026-03-22','sysadmin1',2),(110,'Data Structures Crash Review',NULL,4100,NULL,28.40,3,'2026-03-22','sysadmin1',2);
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

-- Dump completed on 2026-03-25 12:47:23
