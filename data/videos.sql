-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 20, 2024 at 05:48 AM
-- Server version: 8.0.39
-- PHP Version: 8.2.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `z_squared`
--

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `video_id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` text,
  `description` text,
  `released` date DEFAULT NULL,
  `length` time NOT NULL DEFAULT '00:00:00',
  `views` int DEFAULT '0',
  `likes` int DEFAULT '0',
  `thumbnail` text CHARACTER SET armscii8 COLLATE armscii8_general_ci NOT NULL,
  `url` text
) ENGINE=InnoDB DEFAULT CHARSET=armscii8;

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`video_id`, `user_id`, `title`, `description`, `released`, `length`, `views`, `likes`, `thumbnail`, `url`) VALUES
(4, 1, 'cool', NULL, '2024-11-19', '00:00:00', 0, 0, 'imgs/basicLogo.jpeg', 'videos/cool.mp4'),
(5, 1, 'Fruit Ninja Clone Demo', NULL, '2024-11-19', '00:03:45', 0, 0, 'imgs/Fruit Ninja Demo Thumb.jpeg', 'videos/Fruit Ninja Clone Demo.mp4'),
(6, 1, 'PHP local server', NULL, '2024-11-19', '00:03:40', 0, 0, 'imgs/PHP code thumbnail.png', 'videos/PHP local server.mp4');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`video_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `video_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
