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
-- Dumping data for table `exercise`
--

LOCK TABLES `exercise` WRITE;
/*!40000 ALTER TABLE `exercise` DISABLE KEYS */;
INSERT INTO `exercise` VALUES (1,3,'tensorflow','[]','{}','2025-06-08 04:13:25.014380'),(2,3,'tensorflow','[]','{}','2025-06-08 04:21:45.373531'),(3,3,'tensorflow','[]','{}','2025-06-08 04:26:12.376845'),(4,3,'tensorflow','[{\"type\": \"multiple_choice\", \"items\": [{\"id\": \"mc1\", \"options\": [\"A. tf.multiply()\", \"B. tf.matmul()\", \"C. tf.add()\", \"D. tf.concat()\"], \"question\": \"在 TensorFlow 中，以下哪个操作可以用于计算两个张量的矩阵乘法？\"}]}, {\"type\": \"fill_in_blank\", \"items\": [{\"id\": \"fb1\", \"question\": \"在 TensorFlow 中，用于创建常量张量的函数是 ______。\"}]}, {\"type\": \"short_answer\", \"items\": [{\"id\": \"sa1\", \"question\": \"简要说明 TensorFlow 中 Eager Execution 模式的作用。\"}]}, {\"type\": \"programming\", \"items\": [{\"id\": \"pg1\", \"question\": \"使用 TensorFlow 编写一个简单的程序，创建一个形状为 (3, 3) 的全 1 张量，并打印其值。\"}]}]','{\"fb1\": \"tf.constant()\", \"mc1\": \"B. tf.matmul()\", \"pg1\": \"import tensorflow as tf\\n\\n# 创建全 1 张量\\ntensor = tf.ones((3, 3))\\n\\n# 打印张量\\nprint(tensor)\", \"sa1\": \"Eager Execution 模式允许 TensorFlow 立即执行操作并返回具体值，而无需构建计算图。它简化了调试过程，提供了更直观的交互式编程体验。\"}','2025-06-08 04:29:54.868610'),(5,3,'tensorflow','[{\"type\": \"multiple_choice\", \"items\": [{\"id\": \"mc1\", \"options\": [\"A. tf.Variable()\", \"B. tf.placeholder()\", \"C. tf.constant()\", \"D. tf.Session()\"], \"question\": \"在 TensorFlow 中，以下哪个操作用于创建常量张量？\"}]}, {\"type\": \"fill_in_the_blank\", \"items\": [{\"id\": \"fill1\", \"question\": \"TensorFlow 中用于执行计算图的核心对象是______。\"}]}, {\"type\": \"short_answer\", \"items\": [{\"id\": \"sa1\", \"question\": \"简要说明 TensorFlow 的计算图（Computational Graph）是什么？\"}]}, {\"type\": \"programming\", \"items\": [{\"id\": \"prog1\", \"question\": \"使用 TensorFlow 编写代码，实现两个矩阵的乘法（假设矩阵维度为 2x3 和 3x2），并打印结果。\"}]}]','{\"mc1\": \"C\", \"sa1\": \"TensorFlow 的计算图是一个由节点（操作）和边（张量）组成的有向图，用于描述数据流和计算过程。节点表示数学操作，边表示操作之间传递的多维数组（张量）。\", \"fill1\": \"tf.Session()\", \"prog1\": \"import tensorflow as tf\\n\\n# 定义两个矩阵\\na = tf.constant([[1, 2, 3], [4, 5, 6]], dtype=tf.float32)\\nb = tf.constant([[7, 8], [9, 10], [11, 12]], dtype=tf.float32)\\n\\n# 矩阵乘法\\nresult = tf.matmul(a, b)\\n\\n# 执行计算\\nwith tf.Session() as sess:\\n    output = sess.run(result)\\n    print(output)\"}','2025-06-08 04:36:10.657410'),(6,3,'tensorflow','[{\"type\": \"multiple_choice\", \"items\": [{\"id\": \"mc1\", \"options\": [\"A. Microsoft\", \"B. Google\", \"C. Facebook\", \"D. Amazon\"], \"question\": \"TensorFlow 是由哪个公司开发的？\"}, {\"id\": \"mc2\", \"options\": [\"A. 游戏开发\", \"B. 机器学习与深度学习\", \"C. 数据库管理\", \"D. 网络通信\"], \"question\": \"TensorFlow 主要用于以下哪个领域？\"}, {\"id\": \"mc3\", \"options\": [\"A. 关闭的\", \"B. 可选的\", \"C. 默认开启的\", \"D. 已弃用的\"], \"question\": \"TensorFlow 2.x 默认的即时执行模式（Eager Execution）是：\"}, {\"id\": \"mc4\", \"options\": [\"A. NumPy 数组\", \"B. Tensor\", \"C. DataFrame\", \"D. List\"], \"question\": \"以下哪个是 TensorFlow 的核心数据结构？\"}, {\"id\": \"mc5\", \"options\": [\"A. 独立于 TensorFlow 的库\", \"B. TensorFlow 的高级 API\", \"C. 仅用于可视化\", \"D. 已被移除\"], \"question\": \"Keras 在 TensorFlow 2.x 中的作用是：\"}]}, {\"type\": \"fill_in_the_blank\", \"items\": [{\"id\": \"fb1\", \"question\": \"TensorFlow 的计算流程通过__________表示。\"}, {\"id\": \"fb2\", \"question\": \"TensorFlow 中用于训练模型的优化器通常通过__________模块提供。\"}, {\"id\": \"fb3\", \"question\": \"tf.data.Dataset 是用于高效__________的 API。\"}, {\"id\": \"fb4\", \"question\": \"TensorFlow Lite 是专为__________设备设计的轻量版本。\"}, {\"id\": \"fb5\", \"question\": \"tf.keras.layers.Dense 的全连接层中，必须指定的参数是__________。\"}]}, {\"type\": \"short_answer\", \"items\": [{\"id\": \"sa1\", \"question\": \"简述 TensorFlow 的计算图（Graph）和会话（Session）在 1.x 和 2.x 版本中的区别。\"}]}]','{\"fb1\": \"计算图（Graph）\", \"fb2\": \"tf.optimizers\", \"fb3\": \"数据输入与预处理\", \"fb4\": \"移动端或嵌入式\", \"fb5\": \"units（神经元数量）\", \"mc1\": \"B. Google\", \"mc2\": \"B. 机器学习与深度学习\", \"mc3\": \"C. 默认开启的\", \"mc4\": \"B. Tensor\", \"mc5\": \"B. TensorFlow 的高级 API\", \"sa1\": \"在 TensorFlow 1.x 中，计算图（Graph）是静态的，需要先定义所有操作再通过会话（Session）执行，且变量需手动初始化。而在 2.x 中，默认启用即时执行（Eager Execution），无需显式创建计算图或会话，代码可直接逐行运行，同时保留了图模式（通过 @tf.function 装饰器）以提升性能。\"}','2025-06-10 10:10:48.204171');
/*!40000 ALTER TABLE `exercise` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `homework`
--

DROP TABLE IF EXISTS `homework`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homework` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exercise_id` int NOT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `exercise_id` (`exercise_id`),
  CONSTRAINT `homework_ibfk_1` FOREIGN KEY (`exercise_id`) REFERENCES `exercise` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `homework`
--

LOCK TABLES `homework` WRITE;
/*!40000 ALTER TABLE `homework` DISABLE KEYS */;
INSERT INTO `homework` VALUES (1,5,'2025-06-08 06:34:35.348159'),(2,5,'2025-06-08 06:37:35.172235'),(3,6,'2025-06-10 10:13:06.001676');
/*!40000 ALTER TABLE `homework` ENABLE KEYS */;
UNLOCK TABLES;

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

LOCK TABLES `submission` WRITE;
/*!40000 ALTER TABLE `submission` DISABLE KEYS */;
INSERT INTO `submission` VALUES (1,1,2,'{\"mc1\": \"C. tf.constant()\", \"sa1\": \"计算图是一个有向图结构，节点代表操作，边代表张量的数据流。\", \"fill1\": \"tf.Session()\", \"prog1\": \"import tensorflow as tf\\n\\na = tf.constant([[1,2],[3,4]])\\nb = tf.constant([[5,6],[7,8]])\\nresult = tf.matmul(a,b)\\nprint(result)\"}',3,'completed','{\"results\": {\"mc1\": \"correct\", \"sa1\": \"correct\", \"fill1\": \"correct\", \"prog1\": \"wrong\"}, \"explanations\": {\"mc1\": \"题目要求找出用于创建常量张量的操作。标准答案为 C. tf.constant()，学生答案选择了相同的选项。tf.constant() 是 TensorFlow 中专门用于创建常量张量的函数，因此答案正确。\", \"sa1\": \"题目要求简要说明计算图的概念。学生答案描述了计算图为\'有向图结构，节点代表操作，边代表张量的数据流\'，这与标准答案的核心要点一致（节点表示操作，边表示张量数据流）。尽管学生答案较简洁，但覆盖了关键要素，因此判为正确。\", \"fill1\": \"题目要求填写执行计算图的核心对象。标准答案为 \'tf.Session()\'，学生答案完全匹配。tf.Session() 是 TensorFlow 中用于运行计算图的核心对象，因此答案正确。\", \"prog1\": \"题目要求实现两个矩阵的乘法（维度为 2x3 和 3x2），并打印结果。学生代码存在两个主要错误：(1) 矩阵维度错误：题目指定 2x3 和 3x2，但学生使用了 2x2 和 2x2 矩阵；(2) 缺少 Session 执行：直接打印 result（Tensor 对象）而非运行计算，导致输出为张量描述而非实际数值。标准答案正确使用 Session 运行并打印结果，因此判为错误。\"}}','2025-06-08 06:59:59.910076'),(2,3,2,'{\"mc1\": \"A\", \"mc2\": \"C\", \"mc3\": \"B\", \"mc4\": \"D\", \"mc5\": \"B\", \"fill1\": \"不会\", \"fill2\": \"不会\", \"fill3\": \"不会\", \"fill4\": \"不会\", \"fill5\": \"不会\", \"short1\": \"不会\"}',1,'completed','{\"results\": {\"fb1\": \"wrong\", \"fb2\": \"wrong\", \"fb3\": \"wrong\", \"fb4\": \"wrong\", \"fb5\": \"wrong\", \"mc1\": \"wrong\", \"mc2\": \"wrong\", \"mc3\": \"wrong\", \"mc4\": \"wrong\", \"mc5\": \"correct\", \"sa1\": \"wrong\"}, \"explanations\": {\"fb1\": \"学生未提供答案。正确答案是 \'计算图（Graph）\'，因为 TensorFlow 的计算流程通过计算图（Graph）表示，它定义了操作之间的依赖关系和数据流。\", \"fb2\": \"学生未提供答案。正确答案是 \'tf.optimizers\'，因为 TensorFlow 中用于训练模型的优化器（如 Adam、SGD）通常通过 tf.optimizers 模块提供，用于更新模型参数以最小化损失函数。\", \"fb3\": \"学生未提供答案。正确答案是 \'数据输入与预处理\'，因为 tf.data.Dataset 是 TensorFlow 中用于高效数据输入与预处理的 API，支持批处理、转换和流水线操作。\", \"fb4\": \"学生未提供答案。正确答案是 \'移动端或嵌入式\'，因为 TensorFlow Lite 是 TensorFlow 的轻量版本，专为移动端或嵌入式设备设计，以在资源受限的环境中运行模型。\", \"fb5\": \"学生未提供答案。正确答案是 \'units（神经元数量）\'，因为在 tf.keras.layers.Dense 全连接层中，必须指定的参数是 units（神经元数量），它定义了该层的输出维度。\", \"mc1\": \"学生选择了 A. Microsoft，但正确答案是 B. Google，因为 TensorFlow 是由 Google 公司开发的。\", \"mc2\": \"学生选择了 C. 数据库管理，但正确答案是 B. 机器学习与深度学习，因为 TensorFlow 是一个开源机器学习框架，主要用于机器学习和深度学习任务。\", \"mc3\": \"学生选择了 B. 可选的，但正确答案是 C. 默认开启的，因为在 TensorFlow 2.x 版本中，即时执行模式（Eager Execution）是默认启用的，无需额外配置即可逐行执行代码。\", \"mc4\": \"学生选择了 D. List，但正确答案是 B. Tensor，因为 Tensor 是 TensorFlow 的核心数据结构，用于表示多维数组和计算图中的数据流。\", \"mc5\": \"学生选择了 B. TensorFlow 的高级 API，这是正确的，因为在 TensorFlow 2.x 中，Keras 被集成作为高级 API，用于简化模型构建和训练过程。\", \"sa1\": \"学生未提供答案。正确答案是：在 TensorFlow 1.x 中，计算图（Graph）是静态的，需要先定义所有操作再通过会话（Session）执行，且变量需手动初始化。而在 2.x 中，默认启用即时执行（Eager Execution），无需显式创建计算图或会话，代码可直接逐行运行，同时保留了图模式（通过 @tf.function 装饰器）以提升性能。\"}}','2025-06-10 10:22:36.766415');
/*!40000 ALTER TABLE `submission` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'testuser','pass123',1),(2,'stu1','123',1),(3,'tea1','123',2),(4,'tea2','123',2);
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
