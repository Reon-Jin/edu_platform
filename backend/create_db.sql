CREATE DATABASE  IF NOT EXISTS `appdb` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `appdb`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: appdb
-- ------------------------------------------------------
-- Server version	9.2.0

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
-- Table structure for table `exercise`
--

DROP TABLE IF EXISTS `exercise`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exercise` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `prompt` json NOT NULL,
  `answers` json NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `exercise_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homework`
--

DROP TABLE IF EXISTS `homework`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homework` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercise_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `exercise_id` (`exercise_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `homework_ibfk_1` FOREIGN KEY (`exercise_id`) REFERENCES `exercise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `homework_class_fk` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES (3,'admin'),(1,'student'),(2,'teacher');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submission`
--

DROP TABLE IF EXISTS `submission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `homework_id` int NOT NULL,
  `student_id` int NOT NULL,
  `answers` json NOT NULL,
  `score` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT 'grading',
  `feedback` json DEFAULT NULL,
  `submitted_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `homework_id` (`homework_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `submission_ibfk_1` FOREIGN KEY (`homework_id`) REFERENCES `homework` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `submission_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submission`
--

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(128) NOT NULL,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `courseware`;
-- 存放教师生成并保存的备课课件
CREATE TABLE `courseware` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `teacher_id` INT NOT NULL COMMENT '关联 user.id，且该用户 role 必须是 teacher',
  `topic` VARCHAR(255) NOT NULL COMMENT '课件主题',
  `markdown` LONGTEXT NOT NULL COMMENT '备课内容（Markdown 格式）',
  `pdf` LONGBLOB NULL COMMENT '可选：PDF 二进制，如需存库可保存',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '生成/保存时间',
  PRIMARY KEY (`id`),
  KEY `idx_teacher` (`teacher_id`),
  CONSTRAINT `fk_courseware_teacher`
    FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `chat_history`;
CREATE TABLE `chat_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `question` TEXT NOT NULL,
  `answer` LONGTEXT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_ch_student` (`student_id`),
  CONSTRAINT `fk_chat_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `chat_session`;
CREATE TABLE `chat_session` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL DEFAULT 'New Chat',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_cs_student` (`student_id`),
  CONSTRAINT `fk_session_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `session_id` INT NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_cm_session` (`session_id`),
  CONSTRAINT `fk_message_session` FOREIGN KEY (`session_id`) REFERENCES `chat_session` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `practice`;
CREATE TABLE `practice` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `questions` JSON NOT NULL,
  `answers` JSON NOT NULL,
  `student_answers` JSON,
  `feedback` JSON,
  `score` INT DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'not_submitted',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_practice_student` (`student_id`),
  CONSTRAINT `fk_practice_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `student_analysis`;
CREATE TABLE `student_analysis` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `student_id` INT NOT NULL,
  `teacher_id` INT DEFAULT NULL,
  `content` LONGTEXT NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_sa_student` (`student_id`),
  KEY `idx_sa_teacher` (`teacher_id`),
  CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sa_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------
-- Table structure for table `class`
--   - A class belongs to exactly one teacher
--   - A teacher can have multiple classes
-- ------------------------------------------------------
-- 1. 删除旧的 class 表（如果存在）
DROP TABLE IF EXISTS `class`;

-- 2. 重建 class 表，新增 subject 字段并限定可选学科，增加创建时间字段
CREATE TABLE `class` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '班级唯一 ID',
  `name` VARCHAR(100) NOT NULL COMMENT '班级名称',
  `subject` ENUM('语文','数学','英语','物理','化学','地理','生物','历史','政治')
    NOT NULL COMMENT '学科（只能从枚举中选择）',
  `teacher_id` INT NOT NULL COMMENT '关联 user.id（且 role 应为 teacher）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_class_teacher` (`teacher_id`),
  CONSTRAINT `fk_class_teacher`
    FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='班级表：教师端管理自己创建的班级';

-- 3. 学生-班级关联表，保持不变，用于记录学生加入的班级
DROP TABLE IF EXISTS `class_student`;
CREATE TABLE `class_student` (
  `class_id` INT NOT NULL COMMENT '班级 ID',
  `student_id` INT NOT NULL COMMENT '学生 user.id',
  PRIMARY KEY (`class_id`, `student_id`),
  KEY `idx_cs_student` (`student_id`),
  CONSTRAINT `fk_cs_class`
    FOREIGN KEY (`class_id`) REFERENCES `class` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cs_student`
    FOREIGN KEY (`student_id`) REFERENCES `user` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci
  COMMENT='学生-班级关联表，学生端“我的班级”读取此表';

-- 文档表：存储教师上传的资料
DROP TABLE IF EXISTS `document`;
CREATE TABLE `document` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `filepath` VARCHAR(500) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `is_public` TINYINT(1) NOT NULL DEFAULT 0,
  `uploaded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_doc_owner` (`owner_id`),
  CONSTRAINT `fk_doc_owner` FOREIGN KEY (`owner_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 文档向量表：存储切分后块的 embedding
DROP TABLE IF EXISTS `document_vector`;
CREATE TABLE `document_vector` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `doc_id` INT NOT NULL,
  `chunk_index` INT NOT NULL,
  `vector_blob` LONGBLOB NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vec_doc` (`doc_id`),
  CONSTRAINT `fk_vec_doc` FOREIGN KEY (`doc_id`) REFERENCES `document` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'testuser','pass123',1),(2,'stu1','123',1),(3,'tea1','123',2),(4,'tea2','123',2),(5,'mng1','123',3);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-10 21:49:18
