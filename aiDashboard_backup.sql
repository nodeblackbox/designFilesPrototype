-- MySQL dump 10.13  Distrib 8.0.35, for Linux (x86_64)
--
-- Host: localhost    Database: aiDashboard
-- ------------------------------------------------------
-- Server version	8.0.35-0ubuntu0.22.04.1

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
-- Table structure for table `affiliateProgram`
--

DROP TABLE IF EXISTS `affiliateProgram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `affiliateProgram` (
  `affiliate_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `referral_link` varchar(512) NOT NULL,
  `earned_amount` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`affiliate_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `affiliateProgram_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `affiliateProgram`
--

LOCK TABLES `affiliateProgram` WRITE;
/*!40000 ALTER TABLE `affiliateProgram` DISABLE KEYS */;
/*!40000 ALTER TABLE `affiliateProgram` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aiGenQueue`
--

DROP TABLE IF EXISTS `aiGenQueue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aiGenQueue` (
  `queue_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `param_id` int DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') DEFAULT 'pending',
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`queue_id`),
  KEY `user_id` (`user_id`),
  KEY `param_id` (`param_id`),
  CONSTRAINT `aiGenQueue_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `aiGenQueue_ibfk_2` FOREIGN KEY (`param_id`) REFERENCES `imageGenParams` (`param_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aiGenQueue`
--

LOCK TABLES `aiGenQueue` WRITE;
/*!40000 ALTER TABLE `aiGenQueue` DISABLE KEYS */;
/*!40000 ALTER TABLE `aiGenQueue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aiModels`
--

DROP TABLE IF EXISTS `aiModels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aiModels` (
  `model_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `model_name` varchar(255) NOT NULL,
  `model_file_path` varchar(512) NOT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`model_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `aiModels_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aiModels`
--

LOCK TABLES `aiModels` WRITE;
/*!40000 ALTER TABLE `aiModels` DISABLE KEYS */;
/*!40000 ALTER TABLE `aiModels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apiTokens`
--

DROP TABLE IF EXISTS `apiTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apiTokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `token` varchar(512) NOT NULL,
  `scope` varchar(255) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expiration_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `apiTokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apiTokens`
--

LOCK TABLES `apiTokens` WRITE;
/*!40000 ALTER TABLE `apiTokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `apiTokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artworks`
--

DROP TABLE IF EXISTS `artworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artworks` (
  `artwork_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `image_url` varchar(512) NOT NULL,
  `description` text,
  `is_public` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`artwork_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `artworks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artworks`
--

LOCK TABLES `artworks` WRITE;
/*!40000 ALTER TABLE `artworks` DISABLE KEYS */;
/*!40000 ALTER TABLE `artworks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blogs`
--

DROP TABLE IF EXISTS `blogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blogs` (
  `blog_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image_url` varchar(512) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`blog_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `blogs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blogs`
--

LOCK TABLES `blogs` WRITE;
/*!40000 ALTER TABLE `blogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `blogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookmarks`
--

DROP TABLE IF EXISTS `bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmarks` (
  `bookmark_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `content_id` int DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bookmark_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `bookmarks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookmarks`
--

LOCK TABLES `bookmarks` WRITE;
/*!40000 ALTER TABLE `bookmarks` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookmarks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `changelog`
--

DROP TABLE IF EXISTS `changelog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `changelog` (
  `changelog_id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `changes` text,
  `release_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`changelog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `changelog`
--

LOCK TABLES `changelog` WRITE;
/*!40000 ALTER TABLE `changelog` DISABLE KEYS */;
/*!40000 ALTER TABLE `changelog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contactUs`
--

DROP TABLE IF EXISTS `contactUs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contactUs` (
  `contact_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `contact_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`contact_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contactUs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contactUs`
--

LOCK TABLES `contactUs` WRITE;
/*!40000 ALTER TABLE `contactUs` DISABLE KEYS */;
/*!40000 ALTER TABLE `contactUs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contentStorage`
--

DROP TABLE IF EXISTS `contentStorage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contentStorage` (
  `content_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `content_path` varchar(512) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`content_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contentStorage_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contentStorage`
--

LOCK TABLES `contentStorage` WRITE;
/*!40000 ALTER TABLE `contentStorage` DISABLE KEYS */;
/*!40000 ALTER TABLE `contentStorage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contentTags`
--

DROP TABLE IF EXISTS `contentTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contentTags` (
  `content_tag_id` int NOT NULL AUTO_INCREMENT,
  `tag_id` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `content_id` int DEFAULT NULL,
  PRIMARY KEY (`content_tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `contentTags_ibfk_1` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contentTags`
--

LOCK TABLES `contentTags` WRITE;
/*!40000 ALTER TABLE `contentTags` DISABLE KEYS */;
/*!40000 ALTER TABLE `contentTags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `course_name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `video_link` varchar(512) NOT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enhancementTools`
--

DROP TABLE IF EXISTS `enhancementTools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enhancementTools` (
  `tool_id` int NOT NULL AUTO_INCREMENT,
  `tool_name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enhancementTools`
--

LOCK TABLES `enhancementTools` WRITE;
/*!40000 ALTER TABLE `enhancementTools` DISABLE KEYS */;
/*!40000 ALTER TABLE `enhancementTools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `extensions`
--

DROP TABLE IF EXISTS `extensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extensions` (
  `extension_id` int NOT NULL AUTO_INCREMENT,
  `extension_name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(8,2) DEFAULT NULL,
  `monthly_price` decimal(8,2) DEFAULT NULL,
  `demo_image` varchar(512) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`extension_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `extensions`
--

LOCK TABLES `extensions` WRITE;
/*!40000 ALTER TABLE `extensions` DISABLE KEYS */;
/*!40000 ALTER TABLE `extensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `feedback_text` text NOT NULL,
  `feedback_category` varchar(100) DEFAULT NULL,
  `feedback_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`feedback_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `generatedImages`
--

DROP TABLE IF EXISTS `generatedImages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `generatedImages` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `image_url` varchar(512) NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `generatedImages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `generatedImages`
--

LOCK TABLES `generatedImages` WRITE;
/*!40000 ALTER TABLE `generatedImages` DISABLE KEYS */;
/*!40000 ALTER TABLE `generatedImages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imageEnhancements`
--

DROP TABLE IF EXISTS `imageEnhancements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imageEnhancements` (
  `enhancement_id` int NOT NULL AUTO_INCREMENT,
  `image_id` int DEFAULT NULL,
  `tool_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enhancement_id`),
  KEY `image_id` (`image_id`),
  KEY `tool_id` (`tool_id`),
  CONSTRAINT `imageEnhancements_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `generatedImages` (`image_id`),
  CONSTRAINT `imageEnhancements_ibfk_2` FOREIGN KEY (`tool_id`) REFERENCES `enhancementTools` (`tool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imageEnhancements`
--

LOCK TABLES `imageEnhancements` WRITE;
/*!40000 ALTER TABLE `imageEnhancements` DISABLE KEYS */;
/*!40000 ALTER TABLE `imageEnhancements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imageGenParams`
--

DROP TABLE IF EXISTS `imageGenParams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imageGenParams` (
  `param_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `prompt` text,
  `negative_prompt` text,
  `steps` int DEFAULT NULL,
  `seed` int DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `cfg_scale` decimal(5,2) DEFAULT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`param_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `imageGenParams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imageGenParams`
--

LOCK TABLES `imageGenParams` WRITE;
/*!40000 ALTER TABLE `imageGenParams` DISABLE KEYS */;
/*!40000 ALTER TABLE `imageGenParams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imageGenResults`
--

DROP TABLE IF EXISTS `imageGenResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imageGenResults` (
  `result_id` int NOT NULL AUTO_INCREMENT,
  `param_id` int DEFAULT NULL,
  `image_url` varchar(512) NOT NULL,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`),
  KEY `param_id` (`param_id`),
  CONSTRAINT `imageGenResults_ibfk_1` FOREIGN KEY (`param_id`) REFERENCES `imageGenParams` (`param_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imageGenResults`
--

LOCK TABLES `imageGenResults` WRITE;
/*!40000 ALTER TABLE `imageGenResults` DISABLE KEYS */;
/*!40000 ALTER TABLE `imageGenResults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imageWorkflows`
--

DROP TABLE IF EXISTS `imageWorkflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imageWorkflows` (
  `image_workflow_id` int NOT NULL AUTO_INCREMENT,
  `image_id` int DEFAULT NULL,
  `workflow_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_workflow_id`),
  KEY `image_id` (`image_id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `imageWorkflows_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `generatedImages` (`image_id`),
  CONSTRAINT `imageWorkflows_ibfk_2` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imageWorkflows`
--

LOCK TABLES `imageWorkflows` WRITE;
/*!40000 ALTER TABLE `imageWorkflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `imageWorkflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integrationPartners`
--

DROP TABLE IF EXISTS `integrationPartners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrationPartners` (
  `partner_id` int NOT NULL AUTO_INCREMENT,
  `partner_name` varchar(255) NOT NULL,
  `api_endpoint` varchar(512) DEFAULT NULL,
  `details` text,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integrationPartners`
--

LOCK TABLES `integrationPartners` WRITE;
/*!40000 ALTER TABLE `integrationPartners` DISABLE KEYS */;
/*!40000 ALTER TABLE `integrationPartners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rateLimits`
--

DROP TABLE IF EXISTS `rateLimits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rateLimits` (
  `rate_limit_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `endpoint` varchar(255) DEFAULT NULL,
  `requests` int DEFAULT '0',
  `max_requests` int DEFAULT '1000',
  `reset_duration` int DEFAULT '3600',
  `last_request` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rate_limit_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `rateLimits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rateLimits`
--

LOCK TABLES `rateLimits` WRITE;
/*!40000 ALTER TABLE `rateLimits` DISABLE KEYS */;
/*!40000 ALTER TABLE `rateLimits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ratings`
--

DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `content_id` int DEFAULT NULL,
  `rating_value` decimal(2,1) DEFAULT NULL,
  `rating_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rating_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `ratings_chk_1` CHECK ((`rating_value` between 0 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ratings`
--

LOCK TABLES `ratings` WRITE;
/*!40000 ALTER TABLE `ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptionPlans`
--

DROP TABLE IF EXISTS `subscriptionPlans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptionPlans` (
  `subscription_id` int NOT NULL AUTO_INCREMENT,
  `subscription_name` varchar(100) NOT NULL,
  `features` text,
  `price` decimal(8,2) DEFAULT NULL,
  `payment_frequency` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptionPlans`
--

LOCK TABLES `subscriptionPlans` WRITE;
/*!40000 ALTER TABLE `subscriptionPlans` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptionPlans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(50) NOT NULL,
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `tag_name` (`tag_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `themes` (
  `theme_id` int NOT NULL AUTO_INCREMENT,
  `theme_name` varchar(100) NOT NULL,
  `theme_css` text,
  PRIMARY KEY (`theme_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `themes`
--

LOCK TABLES `themes` WRITE;
/*!40000 ALTER TABLE `themes` DISABLE KEYS */;
/*!40000 ALTER TABLE `themes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `content_id` int DEFAULT NULL,
  `transaction_amount` decimal(10,2) DEFAULT NULL,
  `transaction_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userCourses`
--

DROP TABLE IF EXISTS `userCourses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userCourses` (
  `enrollment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `enrollment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`enrollment_id`),
  KEY `user_id` (`user_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `userCourses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userCourses_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userCourses`
--

LOCK TABLES `userCourses` WRITE;
/*!40000 ALTER TABLE `userCourses` DISABLE KEYS */;
/*!40000 ALTER TABLE `userCourses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userExtensions`
--

DROP TABLE IF EXISTS `userExtensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userExtensions` (
  `user_extension_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `extension_id` int DEFAULT NULL,
  `active_status` tinyint(1) DEFAULT '1',
  `last_toggled` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `purchase_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_extension_id`),
  KEY `user_id` (`user_id`),
  KEY `extension_id` (`extension_id`),
  CONSTRAINT `userExtensions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userExtensions_ibfk_2` FOREIGN KEY (`extension_id`) REFERENCES `extensions` (`extension_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userExtensions`
--

LOCK TABLES `userExtensions` WRITE;
/*!40000 ALTER TABLE `userExtensions` DISABLE KEYS */;
/*!40000 ALTER TABLE `userExtensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userGallery`
--

DROP TABLE IF EXISTS `userGallery`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userGallery` (
  `gallery_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `image_id` int DEFAULT NULL,
  `prompt` text,
  `image_url` varchar(512) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`gallery_id`),
  KEY `user_id` (`user_id`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `userGallery_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userGallery_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `generatedImages` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userGallery`
--

LOCK TABLES `userGallery` WRITE;
/*!40000 ALTER TABLE `userGallery` DISABLE KEYS */;
/*!40000 ALTER TABLE `userGallery` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userImageHistory`
--

DROP TABLE IF EXISTS `userImageHistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userImageHistory` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `result_id` int DEFAULT NULL,
  `viewed_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `user_id` (`user_id`),
  KEY `result_id` (`result_id`),
  CONSTRAINT `userImageHistory_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userImageHistory_ibfk_2` FOREIGN KEY (`result_id`) REFERENCES `imageGenResults` (`result_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userImageHistory`
--

LOCK TABLES `userImageHistory` WRITE;
/*!40000 ALTER TABLE `userImageHistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `userImageHistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userMetrics`
--

DROP TABLE IF EXISTS `userMetrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userMetrics` (
  `metric_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_duration` decimal(10,2) DEFAULT NULL,
  `feature_used` varchar(100) DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `last_used` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`metric_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `userMetrics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userMetrics`
--

LOCK TABLES `userMetrics` WRITE;
/*!40000 ALTER TABLE `userMetrics` DISABLE KEYS */;
/*!40000 ALTER TABLE `userMetrics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userNotifications`
--

DROP TABLE IF EXISTS `userNotifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userNotifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `notification_type` varchar(100) DEFAULT NULL,
  `content` text,
  `read_status` tinyint(1) DEFAULT '0',
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `userNotifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userNotifications`
--

LOCK TABLES `userNotifications` WRITE;
/*!40000 ALTER TABLE `userNotifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `userNotifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userRoles`
--

DROP TABLE IF EXISTS `userRoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userRoles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userRoles`
--

LOCK TABLES `userRoles` WRITE;
/*!40000 ALTER TABLE `userRoles` DISABLE KEYS */;
INSERT INTO `userRoles` VALUES (1,'admin'),(3,'affiliate'),(2,'user');
/*!40000 ALTER TABLE `userRoles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userSessions`
--

DROP TABLE IF EXISTS `userSessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userSessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `session_token` varchar(512) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` text,
  `session_start` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `userSessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userSessions`
--

LOCK TABLES `userSessions` WRITE;
/*!40000 ALTER TABLE `userSessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `userSessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userThemes`
--

DROP TABLE IF EXISTS `userThemes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userThemes` (
  `user_theme_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `theme_id` int DEFAULT NULL,
  PRIMARY KEY (`user_theme_id`),
  KEY `user_id` (`user_id`),
  KEY `theme_id` (`theme_id`),
  CONSTRAINT `userThemes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userThemes_ibfk_2` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`theme_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userThemes`
--

LOCK TABLES `userThemes` WRITE;
/*!40000 ALTER TABLE `userThemes` DISABLE KEYS */;
/*!40000 ALTER TABLE `userThemes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userWorkflows`
--

DROP TABLE IF EXISTS `userWorkflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userWorkflows` (
  `user_workflow_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `workflow_id` int DEFAULT NULL,
  `customization_details` text,
  `creation_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_workflow_id`),
  KEY `user_id` (`user_id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `userWorkflows_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `userWorkflows_ibfk_2` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userWorkflows`
--

LOCK TABLES `userWorkflows` WRITE;
/*!40000 ALTER TABLE `userWorkflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `userWorkflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(25) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(512) NOT NULL,
  `profile_picture` varchar(512) DEFAULT NULL,
  `bio` text,
  `subscription_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  KEY `subscription_id` (`subscription_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `userRoles` (`role_id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptionPlans` (`subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `workflow_id` int NOT NULL AUTO_INCREMENT,
  `workflow_name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`workflow_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflows`
--

LOCK TABLES `workflows` WRITE;
/*!40000 ALTER TABLE `workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflows` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-25  6:18:28
