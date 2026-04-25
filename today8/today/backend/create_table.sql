-- Run this in your MySQL database to create the table
CREATE DATABASE IF NOT EXISTS sports_fest;
USE sports_fest;

CREATE TABLE IF NOT EXISTS `bgmi_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `squadName` varchar(255) NOT NULL,
  `leaderName` varchar(255) NOT NULL,
  `contactNumber` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `collegeName` varchar(255) NOT NULL,
  `teamMembers` text,
  `amount` int(11) NOT NULL DEFAULT 1000,
  `payment_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Marathon Registrations table
CREATE TABLE IF NOT EXISTS `marathon_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `college_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `category` ENUM('mb40', 'ma40', 'wb40', 'wa40') NOT NULL,
  `tshirt_size` varchar(10),
  `dob` DATE,
  `emergency_contact` varchar(255),
  `address` TEXT NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sports/Athletics Registrations table
CREATE TABLE IF NOT EXISTS `sports_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `college_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `gender` ENUM('male', 'female', 'other') NOT NULL,
  `sport` varchar(50) NOT NULL,
  `player_names` JSON,
  `emergency_contact` varchar(255),
  `address` TEXT NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contacts table for general inquiries/contact form
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20),
  `subject` varchar(255),
  `message` TEXT NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



