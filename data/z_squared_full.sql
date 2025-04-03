CREATE DATABASE  IF NOT EXISTS `z_squared` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `z_squared`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: z_squared
-- ------------------------------------------------------
-- Server version	8.3.0

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
-- Table structure for table `accounts`
--

DROP TABLE IF EXISTS `accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(127) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_as_cs NOT NULL,
  `username` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `DoB` date NOT NULL,
  `bio` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `profile_pic` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounts`
--

LOCK TABLES `accounts` WRITE;
/*!40000 ALTER TABLE `accounts` DISABLE KEYS */;
INSERT INTO `accounts` VALUES (1,'guest@guest_guest.guest','guest','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4','2024-08-15',NULL,NULL),(2,'coxma01@mycu.concord.edu','SmoCloud','9dacc229babf9a841d3f93465afc3e878d9841eb1018c0e07c0e42f231409e84','1996-06-01','Rootinest, tootinest coding cowboy in the wild, wild web.',NULL),(3,'willis.hunter1234@outlook.com','BigWill','98dca068e0fc9a73586fce8cb9674e9442e54b3bca27f4d761dc5891b9fbe274','1998-01-05',NULL,NULL),(4,'ashton011522@gmail.com','Neptunes','fa68cf71f5f4fc41b46e1ff7afc8f68bb32711c8d30bff9c7a3bac7e34a89934','1999-07-13',NULL,NULL);
/*!40000 ALTER TABLE `accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comments_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `video_id` int NOT NULL,
  `comment` varchar(1024) NOT NULL,
  PRIMARY KEY (`comments_id`),
  KEY `id_user_idx` (`user_id`),
  KEY `id_videos_idx` (`video_id`),
  CONSTRAINT `id_user` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `id_videos` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,1,4,'Cool.'),(2,1,5,'Slice n Dice.'),(4,1,4,'whhwahduwhfuh'),(5,1,4,'whhwahduwhfuh'),(6,1,4,'hmmfmfmfkhm'),(7,1,4,'hmmfmfmfkhm'),(8,3,4,'Woah what a cool video '),(9,3,5,'Wow fruit ninja ');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dislikes`
--

DROP TABLE IF EXISTS `dislikes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dislikes` (
  `user_id` int NOT NULL,
  `disliked_videos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_as_cs NOT NULL,
  KEY `dislike_id` (`user_id`),
  CONSTRAINT `dislike_id` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dislikes`
--

LOCK TABLES `dislikes` WRITE;
/*!40000 ALTER TABLE `dislikes` DISABLE KEYS */;
INSERT INTO `dislikes` VALUES (1,'6'),(3,'5'),(2,'6'),(2,'5');
/*!40000 ALTER TABLE `dislikes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `user_id` int NOT NULL,
  `liked_videos` int NOT NULL,
  KEY `like_id` (`user_id`),
  KEY `liked_idx` (`liked_videos`),
  CONSTRAINT `like_id` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `liked` FOREIGN KEY (`liked_videos`) REFERENCES `videos` (`video_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (1,5),(1,4),(3,4),(2,4);
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `video_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(256) NOT NULL,
  `description` varchar(1024) DEFAULT NULL,
  `released` datetime NOT NULL,
  `length` time NOT NULL DEFAULT '00:00:00',
  `views` int DEFAULT '0',
  `likes` int DEFAULT '0',
  `thumbnail` varchar(512) CHARACTER SET armscii8 COLLATE armscii8_general_ci NOT NULL,
  `t_mimetype` varchar(20) NOT NULL,
  `url` varchar(512) NOT NULL,
  `v_mimetype` varchar(20) NOT NULL,
  PRIMARY KEY (`video_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=armscii8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES (4,1,'cool',NULL,'2024-11-19 00:00:00','00:00:00',0,3,'1d41c6c4ca4a515cd1fc40a1d8b6ae15b963db489e827cfb466ed86e114713f3','image/jpeg','dc14e0921f695e5bad4b1917dd64d4b03b2fcc78f49ef6d4031ec3eaa1d34033','video/mp4'),(5,1,'Fruit Ninja Clone Demo',NULL,'2024-11-19 00:00:00','00:03:45',0,1,'a99b3539c148762bc57d7ca96d7180fd6dd382b21c5534f8cf5d96134c2f9ffa','image/jpeg','ee60d177b87da780aed5eceb21119e33f53c9458dcf35e68308db7e38ad80e94','video/mp4'),(6,1,'PHP local server',NULL,'2024-11-19 00:00:00','00:03:40',0,0,'abe058d223bb4fa06b40869fadb57039175891df36d7b807faf240c500b5f9d9','image/png','4aa527b04b3847897996b2a521d41eeec848870cfc3d595bd9641cb992913c72','video/mp4');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-10 14:42:37
