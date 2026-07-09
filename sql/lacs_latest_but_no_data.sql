-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 09, 2026 at 08:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lacs`
--

-- --------------------------------------------------------

--
-- Table structure for table `action_types`
--

CREATE TABLE `action_types` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `action_types`
--

INSERT INTO `action_types` (`id`, `name`) VALUES
(1, 'For discussion only'),
(2, 'For approval'),
(3, 'For adoption'),
(4, 'For endorsement'),
(5, 'For amendment');

-- --------------------------------------------------------

--
-- Table structure for table `agendas`
--

CREATE TABLE `agendas` (
  `agenda_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `agenda_title` varchar(150) DEFAULT NULL,
  `agenda_description` varchar(150) DEFAULT NULL,
  `status` enum('Draft','Published','Archived') DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agenda_items`
--

CREATE TABLE `agenda_items` (
  `agenda_item_id` int(11) NOT NULL,
  `agenda_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `item_title` varchar(255) NOT NULL,
  `item_purpose` varchar(255) DEFAULT NULL,
  `item_description` text DEFAULT NULL,
  `item_recommendation` text DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `deadline` datetime DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `status` enum('Pending','Approved','Revision Needed','Completed','Deferred') DEFAULT 'Pending',
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  `action_type_id` int(11) DEFAULT NULL,
  `revision_remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `agenda_item_documents`
--

CREATE TABLE `agenda_item_documents` (
  `document_id` int(11) NOT NULL,
  `agenda_item_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `permission_state` varchar(20) DEFAULT 'Public view',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) DEFAULT 'General',
  `publish_date` date DEFAULT NULL,
  `published` tinyint(1) DEFAULT 1,
  `image_url` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `status` enum('Pending','Restored','Failed') DEFAULT 'Pending',
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`log_id`, `user_id`, `action`, `status`, `entity_type`, `entity_id`, `description`, `ip_address`, `created_at`) VALUES
(1, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-14 00:49:33'),
(2, 1, 'Delete Session', 'Pending', NULL, NULL, 'Deleted session ID: 15', '::1', '2026-01-14 00:52:48'),
(3, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-14 00:53:11'),
(4, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-14 01:15:35'),
(5, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-14 01:20:29'),
(6, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 04:06:58'),
(7, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 04:08:59'),
(8, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 04:10:14'),
(9, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 04:56:01'),
(10, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 05:01:44'),
(11, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 05:09:46'),
(12, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-15 14:27:57'),
(13, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 07:44:49'),
(14, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 07:46:00'),
(15, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 07:49:54'),
(16, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 07:58:58'),
(17, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 07:59:24'),
(18, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 08:03:02'),
(19, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 08:03:20'),
(20, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 08:03:26'),
(21, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-16 10:03:07'),
(22, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 10:10:58'),
(23, 4, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-16 11:23:16'),
(24, 4, 'Create Session', 'Pending', NULL, NULL, 'Created session: sample', '::1', '2026-01-16 11:24:03'),
(25, 4, 'Create Session', 'Pending', NULL, NULL, 'Created session: test', '::1', '2026-01-16 11:32:54'),
(26, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 11:42:10'),
(27, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 11:42:24'),
(28, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 11:42:36'),
(29, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 11:43:02'),
(30, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 12:05:31'),
(31, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 12:06:15'),
(32, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 12:06:56'),
(33, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 12:09:12'),
(34, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 13:10:11'),
(35, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 13:11:10'),
(36, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:01:00'),
(37, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:01:47'),
(38, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:09:55'),
(39, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:11:43'),
(40, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:42:51'),
(41, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:43:12'),
(42, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:43:30'),
(43, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:44:23'),
(44, 4, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:46:56'),
(45, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:47:25'),
(46, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:52:04'),
(47, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 14:55:19'),
(48, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 15:34:30'),
(49, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: sample agenda', '::1', '2026-01-16 15:38:40'),
(50, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 15:39:38'),
(51, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 15:40:08'),
(52, 2, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 15:40:25'),
(53, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 15:44:23'),
(54, 3, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 16:17:32'),
(55, 1, 'Login', 'Pending', NULL, NULL, 'User logged in successfully', '::1', '2026-01-16 16:18:53'),
(56, 1, 'Create Session', 'Pending', NULL, NULL, 'Created session: mamamo', '::1', '2026-01-16 16:37:46'),
(57, 1, 'Update Session', 'Pending', 'Session', 25, 'Updated session ID: 25', '::1', '2026-01-16 16:49:06'),
(58, 1, 'Update Assignments', 'Pending', 'Session', 25, 'Updated staff assignments (1 staff members assigned)', '::1', '2026-01-16 16:58:53'),
(59, 1, 'Create Session', 'Pending', 'Session', 26, 'Created session: test', '::1', '2026-01-19 07:00:55'),
(60, 1, 'Create Session', 'Pending', 'Session', 27, 'Created session: test', '::1', '2026-01-19 07:00:55'),
(61, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: test', '::1', '2026-01-19 07:05:08'),
(62, 1, 'Create Session', 'Pending', 'Session', 28, 'Created session: test', '::1', '2026-01-19 07:23:31'),
(63, 1, 'Create Session', 'Pending', 'Session', 29, 'Created session: test', '::1', '2026-01-19 07:23:31'),
(64, 1, 'Create Session', 'Pending', 'Session', 30, 'Created session: test', '::1', '2026-01-19 07:25:35'),
(65, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: test', '::1', '2026-01-19 07:31:13'),
(66, 1, 'Create Session', 'Pending', 'Session', 31, 'Created session: 13th Sangguinang Panglungsod ng Valenzuela, 14th Regular Session', '::1', '2026-01-19 07:59:49'),
(67, 1, 'Create Session', 'Pending', 'Session', 32, 'Created session: 13th Sangguinang Panglungsod ng Valenzuela, 14th Regular Session', '::1', '2026-01-19 07:59:49'),
(68, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: Discussion of the 45th Founding Anniversary', '::1', '2026-01-19 08:02:54'),
(69, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: Discussion of Waterworks Rehabilitation', '::1', '2026-01-19 08:03:16'),
(70, 1, 'Create Session', 'Pending', 'Session', 33, 'Created session: DEBUG TEST SESSION 2026-01-19 09:09:50', '::1', '2026-01-19 08:10:50'),
(71, 1, 'Create Session', 'Pending', 'Session', 34, 'Created session: DEBUG TEST SESSION 2026-01-19 09:10:33', '::1', '2026-01-19 08:11:33'),
(72, 1, 'Create Session', 'Pending', 'Session', 35, 'Created session: DEBUG TEST SESSION 2026-01-19 09:12:53', '::1', '2026-01-19 08:13:53'),
(73, 1, 'Create Session', 'Pending', 'Session', 36, 'Created session: test', '::1', '2026-01-19 08:14:31'),
(74, 1, 'Create Session', 'Pending', 'Session', 37, 'Created session: 13th Sangguinang Panglungsod ng Valenzuela, 5th Regular Session', '::1', '2026-01-19 09:08:28'),
(75, 1, 'Add Agenda Item', 'Pending', NULL, NULL, 'Added item \'test\' to agenda ID: 18', '::1', '2026-01-19 10:55:45'),
(76, 1, 'Create Session', 'Pending', 'Session', 46, 'Created session: mamamo', '::1', '2026-01-21 06:31:56'),
(77, 1, 'Create Agenda', 'Pending', NULL, NULL, 'Created agenda: mamamo', '::1', '2026-01-21 06:35:28'),
(78, 1, 'Soft Delete Session', 'Pending', 'Session', 31, 'Moved session ID 31 to Inactive status', '::1', '2026-01-21 10:26:12'),
(79, 1, 'Soft Delete Session', 'Pending', 'Session', 37, 'Moved session ID 37 to Inactive status', '::1', '2026-01-21 10:26:22'),
(80, 1, 'Soft Delete Session', 'Pending', 'Session', 47, 'Moved session ID 47 to Inactive status', '::1', '2026-01-21 11:10:22'),
(81, 1, 'Soft Delete Session', 'Pending', 'Session', 46, 'Moved session ID 46 to Inactive status', '::1', '2026-02-10 10:37:34'),
(82, 1, 'Soft Delete Session', 'Pending', 'Session', 44, 'Moved session ID 44 to Inactive status', '::1', '2026-02-10 10:38:10'),
(83, 1, 'Soft Delete Session', 'Pending', 'Session', 46, 'Moved session ID 46 to Inactive status', '::1', '2026-02-10 10:38:16'),
(84, 1, 'Soft Delete Session', 'Pending', 'Session', 42, 'Moved session ID 42 to Inactive status', '::1', '2026-02-10 10:38:27'),
(85, 1, 'Create Session', 'Pending', 'Session', 49, 'Created session: test', '::1', '2026-02-10 10:39:39'),
(86, 1, 'Soft Delete Session', 'Pending', 'Session', 49, 'Moved session \'test\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(87, 1, 'Soft Delete Session', 'Pending', 'Session', 47, 'Moved session \'FIX TEST 24H\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(88, 1, 'Soft Delete Session', 'Pending', 'Session', 42, 'Moved session \'TEST: 23h Away (Start in 23 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(89, 1, 'Soft Delete Session', 'Pending', 'Session', 44, 'Moved session \'TEST: 26h Away (Start in 26 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(90, 1, 'Soft Delete Session', 'Pending', 'Session', 38, 'Moved session \'TEST: 23h Away (Start in 23 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(91, 1, 'Soft Delete Session', 'Pending', 'Session', 40, 'Moved session \'TEST: 26h Away (Start in 26 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(92, 1, 'Soft Delete Session', 'Pending', 'Session', 46, 'Moved session \'mamamo\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(93, 1, 'Soft Delete Session', 'Pending', 'Session', 43, 'Moved session \'TEST: 45m Away (Start in 0.75 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(94, 1, 'Soft Delete Session', 'Pending', 'Session', 45, 'Moved session \'TEST: 2h Away (Start in 2 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(95, 1, 'Soft Delete Session', 'Pending', 'Session', 41, 'Moved session \'TEST: 2h Away (Start in 2 h)\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(96, 1, 'Soft Delete Session', 'Pending', 'Session', 37, 'Moved session \'13th Sangguinang Panglungsod ng Valenzuela, 5th Regular Session\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(97, 1, 'Soft Delete Session', 'Pending', 'Session', 31, 'Moved session \'13th Sangguinang Panglungsod ng Valenzuela, 14th Regular Session\' to Inactive status', '::1', '2026-02-12 18:53:27'),
(98, 1, 'Permanent Delete Session', 'Pending', 'Session', 49, 'Permanently deleted session: test', '::1', '2026-02-12 18:53:55'),
(99, 1, 'Permanent Delete Session', 'Pending', 'Session', 47, 'Permanently deleted session: FIX TEST 24H', '::1', '2026-02-12 18:53:55'),
(100, 1, 'Permanent Delete Session', 'Pending', 'Session', 42, 'Permanently deleted session: TEST: 23h Away (Start in 23 h)', '::1', '2026-02-12 18:53:55'),
(101, 1, 'Permanent Delete Session', 'Pending', 'Session', 44, 'Permanently deleted session: TEST: 26h Away (Start in 26 h)', '::1', '2026-02-12 18:53:55'),
(102, 1, 'Permanent Delete Session', 'Pending', 'Session', 38, 'Permanently deleted session: TEST: 23h Away (Start in 23 h)', '::1', '2026-02-12 18:53:55'),
(103, 1, 'Permanent Delete Session', 'Pending', 'Session', 40, 'Permanently deleted session: TEST: 26h Away (Start in 26 h)', '::1', '2026-02-12 18:53:55'),
(104, 1, 'Permanent Delete Session', 'Pending', 'Session', 46, 'Permanently deleted session: mamamo', '::1', '2026-02-12 18:53:55'),
(105, 1, 'Permanent Delete Session', 'Pending', 'Session', 43, 'Permanently deleted session: TEST: 45m Away (Start in 0.75 h)', '::1', '2026-02-12 18:53:55'),
(106, 1, 'Permanent Delete Session', 'Pending', 'Session', 45, 'Permanently deleted session: TEST: 2h Away (Start in 2 h)', '::1', '2026-02-12 18:53:55'),
(107, 1, 'Permanent Delete Session', 'Pending', 'Session', 41, 'Permanently deleted session: TEST: 2h Away (Start in 2 h)', '::1', '2026-02-12 18:53:56'),
(108, 1, 'Permanent Delete Session', 'Pending', 'Session', 37, 'Permanently deleted session: 13th Sangguinang Panglungsod ng Valenzuela, 5th Regular Session', '::1', '2026-02-12 18:53:56'),
(109, 1, 'Permanent Delete Session', 'Pending', 'Session', 31, 'Permanently deleted session: 13th Sangguinang Panglungsod ng Valenzuela, 14th Regular Session', '::1', '2026-02-12 18:53:56'),
(110, 10, 'Create Session', 'Pending', 'Session', 50, 'Created session: test', '::1', '2026-02-15 16:08:48'),
(111, 10, 'Update Assignments', 'Pending', 'Session', 50, 'User added: Regular User, Jaymar Rabino, Reinhard Ganal, Demo User', '::1', '2026-02-15 16:08:48'),
(112, 1, 'Create Session', 'Pending', 'Session', 51, 'Created session: test 2', '::1', '2026-02-15 16:15:14'),
(113, 1, 'Create Agenda', 'Pending', 'Session', 50, 'Created agenda: test agenda', '::1', '2026-02-15 18:15:58'),
(114, 1, 'Add Agenda Item', 'Pending', 'Session', 50, 'Added item \'test agenda item\' to agenda ID: 20', '::1', '2026-02-15 18:50:32'),
(115, 10, 'Create Agenda', 'Pending', 'Session', 50, 'Created agenda: test agenda 2', '::1', '2026-02-16 14:47:52'),
(116, 10, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 15:23:57'),
(117, 11, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 16:38:51'),
(118, 11, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 16:39:05'),
(119, 11, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 16:49:01'),
(120, 11, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 16:49:48'),
(121, 11, 'Update Agenda Item', 'Pending', 'Session', 50, 'Updated item: test agenda item', '::1', '2026-02-16 17:01:39'),
(122, 1, 'Soft Delete Session', 'Pending', 'Session', 51, 'Moved session \'test 2\' to Inactive status', '::1', '2026-02-22 06:37:13'),
(123, 1, 'Soft Delete Session', 'Pending', 'Session', 50, 'Moved session \'test\' to Inactive status', '::1', '2026-02-22 06:37:13'),
(124, 1, 'Permanent Delete Session', 'Pending', 'Session', 51, 'Permanently deleted session: test 2', '::1', '2026-02-22 06:37:18'),
(125, 1, 'Permanent Delete Session', 'Pending', 'Session', 50, 'Permanently deleted session: test', '::1', '2026-02-22 06:37:18'),
(126, 1, 'Create Session', 'Pending', 'Session', 52, 'Created session: test 1 session', '::1', '2026-02-22 06:38:44'),
(127, 1, 'Save Minutes', 'Pending', 'Session', 52, 'Minutes saved as Draft', '::1', '2026-02-22 08:22:32'),
(128, 1, 'Delete Minutes', 'Pending', 'Session', 52, 'Removed meeting minutes', '::1', '2026-02-22 08:22:38'),
(129, 1, 'Upload Documents', 'Pending', 'Session', 52, 'Uploaded 1 document(s)', '::1', '2026-02-22 09:15:41'),
(130, 1, 'Delete Document', 'Pending', 'Session', 52, 'Deleted document: ', '::1', '2026-02-22 09:16:15'),
(131, 1, 'Create Session', 'Pending', 'Session', 53, 'Created session: test 2 session', '::1', '2026-02-22 13:23:10'),
(132, 1, 'Update Assignments', 'Pending', 'Session', 53, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '::1', '2026-02-22 13:23:10'),
(133, 1, 'Create Agenda', 'Pending', 'Session', 52, 'Auto-created agenda: test', '::1', '2026-02-22 16:18:25'),
(134, 1, 'Create Agenda', 'Pending', 'Session', 52, 'Created agenda: test', '::1', '2026-02-22 16:18:25'),
(135, 1, 'Delete Agenda', 'Pending', 'Session', 52, 'Deleted agenda ID: 22', '::1', '2026-02-22 16:18:32'),
(136, 1, 'Delete Agenda', 'Pending', 'Session', 52, 'Deleted agenda ID: 23', '::1', '2026-02-22 16:18:35'),
(137, 1, 'Create Agenda', 'Pending', 'Session', 52, 'Auto-created agenda: test', '::1', '2026-02-22 16:18:54'),
(138, 1, 'Create Agenda', 'Pending', 'Session', 52, 'Created agenda: test', '::1', '2026-02-22 16:18:54'),
(139, 1, 'Delete Agenda', 'Pending', 'Session', 52, 'Deleted agenda ID: 24', '::1', '2026-02-22 16:21:20'),
(140, 1, 'Delete Agenda', 'Pending', 'Session', 52, 'Deleted agenda ID: 25', '::1', '2026-02-22 16:21:24'),
(141, 1, 'Update Assignments', 'Pending', 'Session', 52, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '::1', '2026-02-22 16:34:17'),
(142, 1, 'Create Agenda', 'Pending', 'Session', 52, 'Auto-created agenda: test agenda 1', '::1', '2026-02-22 16:35:24'),
(143, 1, 'Add Agenda Item', 'Pending', 'Session', 52, 'Added item \'test agenda item 1\' to test agenda 1', '::1', '2026-02-22 16:56:33'),
(144, 1, 'Add Agenda Item', 'Pending', 'Session', 52, 'Added item \'test agenda item 2\' to test agenda 1', '::1', '2026-02-22 16:56:33'),
(145, 11, 'Update Agenda Item', 'Pending', 'Session', 52, 'Updated item: test agenda item 1', '::1', '2026-02-22 18:29:10'),
(146, 11, 'Update Agenda Item', 'Pending', 'Session', 52, 'Updated item: test agenda item 1', '::1', '2026-02-22 18:30:29'),
(147, 11, 'Upload Document', 'Pending', 'Session', 52, 'Uploaded \'SAMPLE-Capstone_template-12345.pdf\' for agenda item \'test agenda item 1\'', '::1', '2026-02-22 19:14:25'),
(148, 11, 'Upload Document', 'Pending', 'Session', 52, 'Uploaded \'SAMPLE-Capstone_template-12345.pdf\' for agenda item \'test agenda item 1\'', '::1', '2026-02-22 19:20:08'),
(149, 11, 'Upload Document', 'Pending', 'Session', 52, 'Uploaded \'salido,shane_z(cv).pdf\' for agenda item \'test agenda item 1\'', '::1', '2026-02-22 19:20:28'),
(150, 11, 'Upload Document', 'Pending', 'Session', 52, 'Uploaded \'SAMPLE-Capstone_template-12345.pdf\' for agenda item \'test agenda item 1\'', '::1', '2026-02-22 19:31:50'),
(151, 1, 'Update Status', 'Pending', 'Session', 52, 'Changed status of \'test agenda item 1\' to Approved', '::1', '2026-02-22 19:50:29'),
(152, 1, 'Update Agenda Item', 'Pending', 'Session', 52, 'Updated item: test agenda item 2', '::1', '2026-02-22 20:31:35'),
(153, 11, 'Update Agenda Item', 'Pending', 'Session', 52, 'Updated item: test agenda item 2', '::1', '2026-02-22 20:32:59'),
(154, 11, 'Upload Document', 'Pending', 'Session', 52, 'Uploaded \'salido,shane_z(cv).pdf\' for agenda item \'test agenda item 2\'', '::1', '2026-02-22 20:33:13'),
(155, 1, 'Update Status', 'Pending', 'Session', 52, 'Changed status of \'test agenda item 2\' to Revision Needed', '::1', '2026-02-22 20:33:37'),
(156, 11, 'Update Agenda Item', 'Pending', 'Session', 52, 'Updated item: test agenda item 2', '::1', '2026-02-22 20:44:29'),
(157, 1, 'Update Status', 'Pending', 'Session', 52, 'Changed status of \'test agenda item 2\' to Revision Needed', '::1', '2026-02-22 20:47:27'),
(158, 1, 'Update Status', 'Pending', 'Session', 52, 'Changed status of \'test agenda item 2\' to Completed', '::1', '2026-02-22 20:47:59'),
(159, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 10:27:30'),
(160, 1, 'Create Session', 'Pending', 'Session', 54, 'Created session: test emergency', '::1', '2026-02-23 10:37:29'),
(161, 1, 'Update Assignments', 'Pending', 'Session', 54, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '::1', '2026-02-23 10:37:29'),
(162, 1, 'Update Assignments', 'Pending', 'Session', 52, 'User removed: Jaymar Rabino', '::1', '2026-02-23 13:10:07'),
(163, 1, 'Record Attendance', 'Pending', 'Session', 52, 'Recorded attendance for 12 participants', '::1', '2026-02-23 13:10:14'),
(164, 1, 'Clear Attendance', 'Pending', 'Session', 52, 'Cleared all attendance records', '::1', '2026-02-23 13:10:20'),
(165, 1, 'Record Attendance', 'Pending', 'Session', 52, 'Recorded attendance for 12 participants', '::1', '2026-02-23 13:11:58'),
(166, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 15:38:50'),
(167, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 15:53:13'),
(168, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 15:53:24'),
(169, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 15:53:58'),
(170, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 15:54:04'),
(171, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:03:51'),
(172, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:03:57'),
(173, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:04:05'),
(174, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:04:18'),
(175, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:05:47'),
(176, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:05:56'),
(177, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:06:13'),
(178, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:06:41'),
(179, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:06:48'),
(180, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:09:27'),
(181, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:09:30'),
(182, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:09:40'),
(183, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '::1', '2026-02-23 16:09:51'),
(184, 1, 'Restore Session', 'Pending', 'Session', 53, 'Restored session ID 53 from Inactive status', '::1', '2026-02-23 16:10:01'),
(185, 1, 'Create Session', 'Pending', 'Session', 55, 'Created session: tes', '::1', '2026-02-23 16:21:40'),
(186, 1, 'Update Assignments', 'Pending', 'Session', 55, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '::1', '2026-02-23 16:21:40'),
(187, 1, 'Permanent Delete Session', 'Pending', 'Session', 55, 'Permanently deleted session: tes', '::1', '2026-02-23 16:21:57'),
(188, 1, 'Update Session', 'Pending', 'Session', 52, 'Updated status for session ID 52 to Scheduled', '::1', '2026-02-23 17:44:48'),
(189, 1, 'Update Session', 'Pending', 'Session', 53, 'Updated status for session ID 53 to Scheduled', '::1', '2026-02-23 17:59:24'),
(190, 1, 'Create Session', 'Pending', 'Session', 56, 'Created session: test', '112.203.37.14', '2026-02-24 07:36:43'),
(191, 1, 'Create Session', 'Pending', 'Session', 57, 'Created session: test', '112.203.37.14', '2026-02-24 07:36:43'),
(192, 1, 'Update Assignments', 'Pending', 'Session', 56, 'User added: Reinhard Ganal', '112.203.37.14', '2026-02-24 07:36:43'),
(193, 1, 'Update Assignments', 'Pending', 'Session', 57, 'User added: Reinhard Ganal', '112.203.37.14', '2026-02-24 07:36:43'),
(194, 1, 'Create Session', 'Pending', 'Session', 58, 'Created session: test (Week 1)', '112.203.37.14', '2026-02-24 07:42:58'),
(195, 1, 'Update Assignments', 'Pending', 'Session', 58, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '112.203.37.14', '2026-02-24 07:42:58'),
(196, 1, 'Create Session', 'Pending', 'Session', 59, 'Created session: test (Week 2)', '112.203.37.14', '2026-02-24 07:42:58'),
(197, 1, 'Update Assignments', 'Pending', 'Session', 59, 'User added: Regular User, Shane Salido, Jaymar Rabino, Reinhard Ganal, Demo User', '112.203.37.14', '2026-02-24 07:42:59'),
(198, 1, 'Permanent Delete Session', 'Pending', 'Session', 54, 'Permanently deleted session: test emergency', '112.203.37.14', '2026-02-24 08:05:54'),
(199, 1, 'Permanent Delete Session', 'Pending', 'Session', 59, 'Permanently deleted session: test (Week 2)', '112.203.37.14', '2026-02-24 08:05:59'),
(200, 1, 'Soft Delete Session', 'Pending', 'Session', 53, 'Moved session ID 53 to Inactive status', '112.203.37.14', '2026-02-24 08:06:10'),
(201, 1, 'Permanent Delete Session', 'Pending', 'Session', 53, 'Permanently deleted session: test 2 session', '112.203.37.14', '2026-02-24 08:06:13'),
(202, 1, 'Soft Delete Session', 'Pending', 'Session', 56, 'Moved session ID 56 to Inactive status', '112.203.37.14', '2026-02-24 08:06:15'),
(203, 1, 'Soft Delete Session', 'Pending', 'Session', 58, 'Moved session ID 58 to Inactive status', '112.203.37.14', '2026-02-24 08:06:17'),
(204, 1, 'Permanent Delete Session', 'Pending', 'Session', 58, 'Permanently deleted session: test (Week 1)', '112.203.37.14', '2026-02-24 08:06:20'),
(205, 1, 'Permanent Delete Session', 'Pending', 'Session', 52, 'Permanently deleted session: test 1 session', '112.203.37.14', '2026-02-24 08:06:22'),
(206, 1, 'Soft Delete Session', 'Pending', 'Session', 57, 'Moved session ID 57 to Inactive status', '112.203.37.14', '2026-02-24 08:06:27'),
(207, 1, 'Permanent Delete Session', 'Pending', 'Session', 57, 'Permanently deleted session: test', '112.203.37.14', '2026-02-24 08:06:30'),
(208, 1, 'Permanent Delete Session', 'Pending', 'Session', 56, 'Permanently deleted session: test', '112.203.37.14', '2026-02-24 08:06:33'),
(209, 1, 'Create Session', 'Pending', 'Session', 60, 'Created session: 43rd Special Session on Founding Anniversary of Valenzuela City, 34th Sangguniang Panlungsod ng Valenzuela', '112.203.37.14', '2026-02-24 10:37:08'),
(210, 1, 'Update Assignments', 'Pending', 'Session', 60, 'User added: Reinhard Ganal', '112.203.37.14', '2026-02-24 10:37:08'),
(211, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '112.203.37.14', '2026-02-24 10:38:38'),
(212, 1, 'Create Agenda', 'Pending', 'Session', 60, 'Auto-created agenda: Budget', '112.203.37.14', '2026-02-24 10:41:06'),
(213, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '136.158.40.216', '2026-02-24 14:47:17'),
(214, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '136.158.40.216', '2026-02-24 14:48:51'),
(215, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '112.203.37.14', '2026-02-24 15:00:33'),
(216, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '112.203.37.14', '2026-02-24 15:07:43'),
(217, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '136.158.40.216', '2026-02-24 15:24:01'),
(218, 1, 'Create Agenda', 'Pending', 'Session', 60, 'Created agenda: Budget', '112.203.37.14', '2026-02-24 15:26:50'),
(219, 1, 'Add Agenda Item', 'Pending', 'Session', 60, 'Added item \'tes\' to agenda ID: 27', '112.203.37.14', '2026-02-24 15:27:01'),
(220, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '112.203.37.14', '2026-02-24 15:28:52'),
(221, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '112.203.37.14', '2026-02-24 15:29:13'),
(222, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '112.203.37.14', '2026-02-24 15:29:23'),
(223, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '112.203.37.14', '2026-02-24 15:29:31'),
(224, 1, 'Upload Document', 'Pending', 'Session', 60, 'Uploaded \'flowchart and iaac.pdf\' for agenda item \'tes\'', '112.203.37.14', '2026-02-24 15:29:48'),
(225, 1, 'Record Attendance', 'Pending', 'Session', 60, 'Recorded attendance for 9 participants', '::1', '2026-02-24 15:45:32'),
(226, 1, 'Upload Documents', 'Pending', 'Session', 60, 'Uploaded 1 document(s)', '::1', '2026-02-24 15:46:39'),
(227, 1, 'Delete Document', 'Pending', 'Session', 60, 'Deleted document: ', '::1', '2026-02-24 15:47:20'),
(228, 1, 'Clear Attendance', 'Pending', 'Session', 60, 'Cleared all attendance records', '::1', '2026-02-24 16:00:42'),
(229, 1, 'Record Attendance', 'Pending', 'Session', 60, 'Recorded attendance for 9 participants', '136.158.40.216', '2026-02-24 16:44:31'),
(230, 1, 'Record Attendance', 'Pending', 'Session', 60, 'Recorded attendance for 9 participants', '136.158.40.216', '2026-02-24 16:44:38'),
(231, 1, 'Permanent Delete Session', 'Pending', 'Session', 60, 'Permanently deleted session: 43rd Special Session on Founding Anniversary of Valenzuela City, 34th Sangguniang Panlungsod ng Valenzuela', '136.158.40.216', '2026-02-24 19:03:05'),
(232, 1, 'Create Session', 'Pending', 'Session', 61, 'Created session: Regular Session No. 13', '136.158.40.216', '2026-02-25 03:46:44'),
(233, 1, 'Create Session', 'Pending', 'Session', 62, 'Created session: Regular Session No. 11', '136.158.40.216', '2026-02-25 03:52:01'),
(234, 1, 'Create Agenda', 'Pending', 'Session', 62, 'Created agenda: Approval of Supplemental Budget No. 1 (FY 2026)', '136.158.40.216', '2026-02-25 03:52:44'),
(235, 1, 'Update Assignments', 'Pending', 'Session', 62, 'User added: SP Member Mervin, Shane Salido, Reinhard Ganal', '136.158.40.216', '2026-02-25 03:53:04'),
(236, 1, 'Add Agenda Item', 'Pending', 'Session', 62, 'Added item \'Allocation for Barangay Health Center Upgrades\' to agenda ID: 29', '136.158.40.216', '2026-02-25 03:53:42'),
(237, 1, 'Create Session', 'Pending', 'Session', 63, 'Created session: 2nd Sangguinang Panglungsod ng Valenzuela 14th Regular Session on Founding Anniversary', '110.54.149.174', '2026-02-25 07:19:32'),
(238, 1, 'Update Assignments', 'Pending', 'Session', 63, 'User added: Shane Salido', '110.54.149.174', '2026-02-25 07:19:32'),
(239, 1, 'Create Agenda', 'Pending', 'Session', 63, 'Created agenda: Approval of Supplemental Budget No. 1 (FY 2026)', '110.54.149.174', '2026-02-25 07:22:08'),
(240, 1, 'Add Agenda Item', 'Pending', 'Session', 63, 'Added item \'ORDINANCE No. 55\' to Approval of Supplemental Budget No. 1 (FY 2026)', '110.54.149.174', '2026-02-25 07:22:08'),
(241, 1, 'Upload Document', 'Pending', 'Session', 63, 'Uploaded \'CHAPTER 2.pdf\' for agenda item \'ORDINANCE No. 55\'', '110.54.149.174', '2026-02-25 07:22:39'),
(242, 1, 'Permanent Delete Session', 'Pending', 'Session', 61, 'Permanently deleted session: Regular Session No. 13', '112.203.37.14', '2026-02-25 11:40:29'),
(243, 1, 'Permanent Delete Session', 'Pending', 'Session', 63, 'Permanently deleted session: 2nd Sangguinang Panglungsod ng Valenzuela 14th Regular Session on Founding Anniversary', '112.203.37.14', '2026-02-25 11:40:35'),
(244, 1, 'Permanent Delete Session', 'Pending', 'Session', 62, 'Permanently deleted session: Regular Session No. 11', '112.203.37.14', '2026-02-25 11:40:40'),
(245, 1, 'Create Session', 'Pending', 'Session', 64, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 1st Emergency Session – CY 2026', '112.203.37.14', '2026-02-25 13:22:10'),
(246, 1, 'Update Assignments', 'Pending', 'Session', 64, 'User added: HON. EXEQUIEL D. SERRANO, HON. CRISTINA MARIE FELICIANO-TAN, HON. EXEQUIEL D. SERRANO, HON. CHRISTOFFER JOSEPH M. PINEDA', '112.203.37.14', '2026-02-25 13:22:10'),
(247, 1, 'Update Session', 'Pending', 'Session', 64, 'Updated status for session ID 64 to Scheduled', '112.203.37.14', '2026-02-25 13:23:28'),
(248, 1, 'Create Session', 'Pending', 'Session', 65, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 1st Regular Session – CY 2026', '112.203.37.14', '2026-02-25 13:26:59'),
(249, 1, 'Create Session', 'Pending', 'Session', 66, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 1st Regular Session – CY 2026', '112.203.37.14', '2026-02-25 13:26:59'),
(250, 1, 'Update Assignments', 'Pending', 'Session', 65, 'User added: HON. LOUIE P. NOLASCO, HON. RICHARD C. ENRIQUEZ, HON. EXEQUIEL D. SERRANO, HON. CRISTINA MARIE FELICIANO-TAN, HON. EXEQUIEL D. SERRANO, HON. MARIO B. SAN ANDRES', '112.203.37.14', '2026-02-25 13:26:59'),
(251, 1, 'Update Assignments', 'Pending', 'Session', 66, 'User added: HON. LOUIE P. NOLASCO, HON. RICHARD C. ENRIQUEZ, HON. EXEQUIEL D. SERRANO, HON. CRISTINA MARIE FELICIANO-TAN, HON. EXEQUIEL D. SERRANO, HON. MARIO B. SAN ANDRES', '112.203.37.14', '2026-02-25 13:26:59'),
(252, 1, 'Permanent Delete Session', 'Pending', 'Session', 65, 'Permanently deleted session: 13th Sangguniang Panlungsod of Valenzuela City 1st Regular Session – CY 2026', '112.203.37.14', '2026-02-25 13:27:21'),
(253, 1, 'Create Session', 'Pending', 'Session', 67, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 2nd Emergency Session – CY 2026', '112.203.37.14', '2026-02-25 13:31:30'),
(254, 1, 'Update Assignments', 'Pending', 'Session', 67, 'User added: HON. LOUIE P. NOLASCO, HON. CRISTINA MARIE FELICIANO-TAN, HON. KISHA COLEEN R. ANCHETA, HON. CHRISTOFFER JOSEPH M. PINEDA, HON. MARIO B. SAN ANDRES', '112.203.37.14', '2026-02-25 13:31:30'),
(255, 1, 'Create Session', 'Pending', 'Session', 68, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 2nd Regular Session – CY 2026', '112.203.37.14', '2026-02-25 13:33:28'),
(256, 1, 'Update Assignments', 'Pending', 'Session', 68, 'User added: HON. CHIQUI MARIE N. CARREON, HON. LOUIE P. NOLASCO, HON. RICHARD C. ENRIQUEZ, HON. EXEQUIEL D. SERRANO, HON. WALTER MAGNUM D. DELA CRUZ, HON. CRISTINA MARIE FELICIANO-TAN, HON. ROSELLE SABINO-SY, HON. KISHA COLEEN R. ANCHETA, HON. EXEQUIEL D. SERRANO, HON. CHRISTOFFER JOSEPH M. PINEDA, HON. MARIO B. SAN ANDRES, HON. JAIRUS JEOFRI P. ESPLANA', '112.203.37.14', '2026-02-25 13:33:28'),
(257, 1, 'Create Session', 'Pending', 'Session', 69, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 2nd Emergency Session – CY 2026', '112.203.37.14', '2026-02-25 13:38:04'),
(258, 1, 'Update Assignments', 'Pending', 'Session', 69, 'User added: HON. CHIQUI MARIE N. CARREON, HON. LOUIE P. NOLASCO, HON. RICHARD C. ENRIQUEZ, HON. EXEQUIEL D. SERRANO, HON. WALTER MAGNUM D. DELA CRUZ, HON. CRISTINA MARIE FELICIANO-TAN, HON. ROSELLE SABINO-SY, HON. KISHA COLEEN R. ANCHETA, HON. EXEQUIEL D. SERRANO, HON. CHRISTOFFER JOSEPH M. PINEDA, HON. MARIO B. SAN ANDRES, HON. JAIRUS JEOFRI P. ESPLANA', '112.203.37.14', '2026-02-25 13:38:04'),
(259, 1, 'Create Session', 'Pending', 'Session', 70, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 1st Special Session – CY 2026', '112.203.37.14', '2026-02-25 13:39:46'),
(260, 1, 'Update Assignments', 'Pending', 'Session', 70, 'User added: HON. CHIQUI MARIE N. CARREON, HON. LOUIE P. NOLASCO, HON. RICHARD C. ENRIQUEZ, HON. EXEQUIEL D. SERRANO, HON. WALTER MAGNUM D. DELA CRUZ, HON. CRISTINA MARIE FELICIANO-TAN, HON. ROSELLE SABINO-SY, HON. KISHA COLEEN R. ANCHETA, HON. EXEQUIEL D. SERRANO, HON. CHRISTOFFER JOSEPH M. PINEDA, HON. MARIO B. SAN ANDRES, HON. JAIRUS JEOFRI P. ESPLANA', '112.203.37.14', '2026-02-25 13:39:46'),
(261, 1, 'Create Session', 'Pending', 'Session', 71, 'Created session: 13th Sangguniang Panlungsod of Valenzuela City 3rd Regular Session – CY 2026', '112.203.37.14', '2026-02-25 13:42:06'),
(262, 1, 'Update Assignments', 'Pending', 'Session', 71, 'User added: HON. EXEQUIEL D. SERRANO, HON. EXEQUIEL D. SERRANO, HON. JAIRUS JEOFRI P. ESPLANA', '112.203.37.14', '2026-02-25 13:42:07'),
(263, 1, 'Update Session', 'Pending', 'Session', 69, 'Updated status for session ID 69 to Scheduled', '112.203.37.14', '2026-02-25 13:43:04'),
(264, 1, 'Create Agenda', 'Pending', 'Session', 64, 'Created agenda: DRAFTING OF O-1326-2026', '112.203.37.14', '2026-02-25 14:48:18'),
(265, 1, 'Add Agenda Item', 'Pending', 'Session', 64, 'Added item \'O-1326-2026\' to DRAFTING OF O-1326-2026', '112.203.37.14', '2026-02-25 14:48:18'),
(266, 1, 'Create Agenda', 'Pending', 'Session', 64, 'Created agenda: DRAFTING OF O-1326-2026', '112.203.37.14', '2026-02-25 14:48:18'),
(267, 1, 'Add Agenda Item', 'Pending', 'Session', 64, 'Added item \'O-1326-2026\' to DRAFTING OF O-1326-2026', '112.203.37.14', '2026-02-25 14:48:18'),
(268, 1, 'Upload Document', 'Pending', 'Session', 64, 'Uploaded \'R-3724-2026.pdf\' for agenda item \'O-1326-2026\'', '112.203.37.14', '2026-02-25 14:50:15'),
(269, 1, 'Update Agenda Item', 'Pending', 'Session', 64, 'Updated item: O-1326-2026', '112.203.37.14', '2026-02-25 14:52:43'),
(270, 1, 'Update Status', 'Pending', 'Session', 64, 'Changed status of \'O-1326-2026\' to Completed', '112.203.37.14', '2026-02-25 15:17:28'),
(271, 1, 'Delete Agenda', 'Pending', 'Session', 64, 'Deleted agenda ID: 32', '136.158.40.216', '2026-02-25 15:25:57'),
(272, 1, 'Update Agenda Item', 'Pending', 'Session', 64, 'Updated item: O-1326-2026', '136.158.40.216', '2026-02-25 15:40:12');

-- --------------------------------------------------------

--
-- Table structure for table `deadlines`
--

CREATE TABLE `deadlines` (
  `deadline_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime NOT NULL,
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `status` enum('Pending','In Progress','Completed','Overdue') DEFAULT 'Pending',
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `position` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`member_id`, `full_name`, `position`) VALUES
(1, 'Hon. Weslie T. Gatchalian', 'Mayor'),
(2, 'Hon. Marlon Paulo C. Alejandrino', 'Vice Mayor');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quorum_rules`
--

CREATE TABLE `quorum_rules` (
  `rule_id` int(11) NOT NULL,
  `required_percentage` int(11) DEFAULT 50
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminder_batches`
--

CREATE TABLE `reminder_batches` (
  `batch_id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_type` enum('Session','Agenda','System','Other') DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `target_roles` set('Administrator','Staff','User') NOT NULL,
  `reminder_date` datetime NOT NULL,
  `status` enum('Scheduled','Sent','Cancelled') DEFAULT 'Scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `admin_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reminder_recipients`
--

CREATE TABLE `reminder_recipients` (
  `recipient_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `status` enum('Pending','Read') DEFAULT 'Pending',
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `session_type` enum('Regular Session','Special Session','Emergency Session') NOT NULL,
  `session_date` date NOT NULL,
  `actual_start_time` time DEFAULT NULL,
  `actual_end_time` time DEFAULT NULL,
  `venue` varchar(150) DEFAULT NULL,
  `presiding_officer` varchar(100) DEFAULT NULL,
  `status` enum('Scheduled','Ongoing','Completed','Cancelled','Postponed','Missed','Inactive') DEFAULT 'Scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `session_status` enum('Active','Inactive') DEFAULT 'Active',
  `cancellation_reason` text DEFAULT NULL,
  `venue_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_assignments`
--

CREATE TABLE `session_assignments` (
  `assignment_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_attendance`
--

CREATE TABLE `session_attendance` (
  `attendance_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `member_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `attendance_status` enum('Present','Absent','Late','Excused') DEFAULT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `marked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_documents`
--

CREATE TABLE `session_documents` (
  `document_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(20) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `uploaded_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_minutes`
--

CREATE TABLE `session_minutes` (
  `minutes_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `summary` text DEFAULT NULL,
  `topics` text DEFAULT NULL,
  `decisions` text DEFAULT NULL,
  `action_items` text DEFAULT NULL,
  `status` enum('Draft','Published') DEFAULT 'Draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `session_status_history`
--

CREATE TABLE `session_status_history` (
  `history_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) NOT NULL,
  `reason` text DEFAULT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `otp_expiry_minutes` int(11) DEFAULT 2,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `group_name` varchar(50) NOT NULL DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `otp_expiry_minutes`, `updated_at`, `group_name`) VALUES
('ai_api_key', '', 2, '2026-01-06 06:38:49', 'general'),
('ai_enabled', 'false', 2, '2026-01-06 06:38:49', 'general'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,jpg,jpeg,png', 2, '2026-01-06 06:38:49', 'general'),
('auto_lock_screen', '1', 2, '2026-02-10 07:38:40', 'general'),
('contact_email', 'admin@lgu.gov.ph', 2, '2026-01-06 15:59:33', 'general'),
('copyright_text', '© 2025 Legislative Agenda & Content System (LACS). City Government of Valenzuela.', 2, '2026-02-10 07:38:40', 'general'),
('date_format', 'MM/DD/YYYY', 2, '2026-01-06 06:38:49', 'general'),
('debug_mode', 'false', 2, '2026-01-06 06:38:49', 'general'),
('description', '', 2, '2026-02-10 07:08:36', 'general'),
('detailed_errors', 'false', 2, '2026-01-06 06:38:49', 'general'),
('enable_ai', 'true', 2, '2026-01-06 06:38:49', 'general'),
('enable_calendar_export', 'true', 2, '2026-01-06 06:38:49', 'general'),
('enable_email_notifications', 'true', 2, '2026-01-06 06:38:49', 'general'),
('enable_public_portal', 'true', 2, '2026-01-06 06:38:49', 'general'),
('ical_enabled', 'true', 2, '2026-01-06 06:38:49', 'general'),
('ical_url', '', 2, '2026-01-06 06:38:49', 'general'),
('lockout_duration', '5', 2, '2026-02-25 13:19:00', 'general'),
('logo_path', 'images/logo.png', 2, '2026-01-06 06:38:49', 'general'),
('log_retention_days', '365', 2, '2026-02-10 07:38:40', 'general'),
('maintenance_message', 'System is currently under maintenance. Please check back later.', 2, '2026-01-06 06:38:49', 'general'),
('maintenance_mode', 'true', 2, '2026-01-19 07:47:48', 'general'),
('max_file_size', '10', 2, '2026-01-06 06:38:49', 'general'),
('max_login_attempts', '5', 2, '2026-02-10 07:38:40', 'general'),
('max_upload_size', '5', 2, '2026-01-02 04:47:16', 'general'),
('notification_email', 'true', 2, '2026-01-06 06:38:49', 'general'),
('notification_enabled', 'true', 2, '2026-01-06 06:38:49', 'general'),
('notification_in_app', 'true', 2, '2026-01-06 06:38:49', 'general'),
('org_name', '', 2, '2026-02-10 07:08:36', 'general'),
('password_complexity', 'High', 2, '2026-02-10 07:38:40', 'general'),
('password_expiry_days', '90', 2, '2026-02-10 07:38:40', 'general'),
('primary_color', '#DC2626', 2, '2026-01-06 06:38:49', 'general'),
('reminder_agenda', 'true', 2, '2026-01-06 06:38:49', 'general'),
('reminder_deadline', 'true', 2, '2026-01-06 06:38:49', 'general'),
('reminder_deadline_days', '3,1', 2, '2026-01-06 06:38:49', 'general'),
('reminder_errors', 'true', 2, '2026-01-06 06:38:49', 'general'),
('reminder_session', 'true', 2, '2026-01-06 06:38:49', 'general'),
('reminder_session_days', '7,3,1', 2, '2026-01-06 06:38:49', 'general'),
('secondary_color', '#FFFFFF', 2, '2026-01-06 06:38:49', 'general'),
('session_timeout', '30', 2, '2026-02-25 13:19:00', 'general'),
('site_description', 'Official Legislative Automation and Content System', 2, '2026-01-06 15:59:33', 'general'),
('site_name', 'LGU Legislative Management', 2, '2026-01-06 15:59:33', 'general'),
('smtp_encryption', 'tls', 2, '2026-01-06 06:38:49', 'general'),
('smtp_from_email', 'lacsspval@gmail.com', 2, '2026-02-24 06:48:26', 'general'),
('smtp_from_name', 'LACS-SPVALENZUELA', 2, '2026-02-24 06:48:26', 'general'),
('smtp_host', 'smtp.gmail.com', 2, '2026-01-06 06:38:49', 'general'),
('smtp_password', 'nweh buko kixu jref', 2, '2026-02-24 06:48:26', 'general'),
('smtp_port', '587', 2, '2026-01-06 06:38:49', 'general'),
('smtp_username', 'lacsspval@gmail.com', 2, '2026-02-24 06:48:26', 'general'),
('storage_limit', '53687091200', 2, '2026-01-06 06:38:49', 'general'),
('storage_used', '0', 2, '2026-01-06 06:38:49', 'general'),
('support_email', 'support@lgu.valenzuela.gov.ph', 2, '2026-02-10 07:38:40', 'general'),
('system_language', 'English', 2, '2026-02-10 07:38:40', 'general'),
('system_logo_url', '', 2, '2026-02-10 07:38:40', 'general'),
('system_name', '', 2, '2026-02-10 07:08:36', 'general'),
('system_timezone', 'Asia/Manila', 2, '2026-02-10 07:43:48', 'general'),
('system_version', '1.0.0', 2, '2026-01-06 06:38:49', 'general'),
('theme_color', 'red', 2, '2026-01-02 04:47:16', 'general'),
('timezone', 'Asia/Manila', 2, '2026-01-06 06:38:49', 'general');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(155) NOT NULL DEFAULT '',
  `username` varchar(155) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `user_name` varchar(155) NOT NULL,
  `user_role` enum('User','Staff','Admin') NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `status` enum('Active','Inactive','Pending') DEFAULT 'Active',
  `failed_attempts` int(11) DEFAULT 0,
  `lockout_until` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `username`, `password_hash`, `user_name`, `user_role`, `avatar_url`, `last_login`, `status`, `failed_attempts`, `lockout_until`) VALUES
(1, 'lacsspval@gmail.com', 'adminspval@lgu.gov.ph', '$2y$12$L9tGy9ufWS6K3m.ztn3cJOcanS9MarEocoQfWNQWvseZW0oZSZ4Iy', 'SP Admin', 'Admin', NULL, '2026-07-09 17:59:17', 'Active', 0, NULL),
(2, 'azraelfyro2020@gmail.com', 'staff1@lgu.gov.ph', '$2y$12$qtlQI7WiY0Wm.uf3/Wq/NeklXKFcjDCdurIbFBqOmaKMlEGvg/fqy', 'Atty. Ivan Benedik Sadsad', 'Staff', NULL, '2026-02-24 07:14:12', 'Active', 1, NULL),
(3, 'mervinagno2021@gmail.com', 'user@lgu.gov.ph', 'user123', 'HON. CHIQUI MARIE N. CARREON', 'User', NULL, '2026-01-16 16:17:32', 'Active', 0, NULL),
(4, 'salidoshane51@gmail.com', 'shane@lgu.gov.ph', 'shane123', 'HON. LOUIE P. NOLASCO', 'User', NULL, '2026-02-25 15:43:57', 'Active', 0, NULL),
(7, 'reinnganal@gmail.com', 'rein@lgu.gov.ph', 'rein123', 'HON. RICHARD C. ENRIQUEZ', 'User', NULL, '2026-02-24 07:47:13', 'Active', 0, NULL),
(12, 'ramon@gmail.com', 'honramon@lgu.gov.ph', '$2y$12$CpFmW9o9RGTiElJr1CH1i.U1mg/JFIhj.hoM/IAbkWq2YByt49cNC', 'HON. EXEQUIEL D. SERRANO', 'User', NULL, NULL, 'Active', 0, NULL),
(13, 'walter@gmail.com', 'walter@lgu.gov.ph', '$2y$12$00SNAD3TQxejFi2Jn3N7w.sugvHoCCDjNoKUUc1/jPBICq96S.i2e', 'HON. WALTER MAGNUM D. DELA CRUZ', 'User', NULL, NULL, 'Active', 0, NULL),
(14, 'cristina@gmail.com', 'cristina@lgu.gov.ph', '$2y$12$.Gu8Abb8bccA.AZYkIvV/ObV/e0fuCankfvXccq0YxKI0TynThbje', 'HON. CRISTINA MARIE FELICIANO-TAN', 'User', NULL, NULL, 'Active', 0, NULL),
(15, 'roselle@gmail.com', 'roselle@lgu.gov.ph', '$2y$12$WZfmjzBQV1E/G1kznkCkCOKLjlJ0NZLzeN3TvE9xwZjlYaU0I8yc6', 'HON. ROSELLE SABINO-SY', 'User', NULL, NULL, 'Active', 0, NULL),
(16, 'coleen@gmail.com', 'coleen@lgu.gov.ph', '$2y$12$DLh8udMWHdWdNoycQQneFu7OEf7tYCejYvZ03dnpRA048U28O4XeK', 'HON. KISHA COLEEN R. ANCHETA', 'User', NULL, NULL, 'Active', 0, NULL),
(17, 'zeke@gmail.com', 'zeke@lgu.gov.ph', '$2y$12$p7KRpJu0M6veeh9InANz/.YdV9j.n91mEaG7XhUgsYk3rZ1CPkI4K', 'HON. EXEQUIEL D. SERRANO', 'User', NULL, NULL, 'Active', 0, NULL),
(18, 'tupe@gmail.com', 'tupe@lgu.gov.ph', '$2y$12$d2g.Byj5TEDzrrv5me126umaRZIYxuwkIsB6df1DGmAwZ6U3Efupy', 'HON. CHRISTOFFER JOSEPH M. PINEDA', 'User', NULL, NULL, 'Active', 0, NULL),
(19, 'mario@gmail.com', 'mario@lgu.gov.ph', '$2y$12$RFV5FwOWgSeVBOIqW7diKemjKqPwI3r7JOAqzzZ7Vyk4boqB/4qFK', 'HON. MARIO B. SAN ANDRES', 'User', NULL, NULL, 'Active', 0, NULL),
(20, 'jairus@gmail.com', 'jairus@lgu.gov.ph', '$2y$12$ERt8ejcZ5.XlWOKxNQT5QuMnvAEUuX6HJGzmFkEXnCU6M2Vc6YPqi', 'HON. JAIRUS JEOFRI P. ESPLANA', 'User', NULL, NULL, 'Active', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_notes`
--

CREATE TABLE `user_notes` (
  `note_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `note_date` date NOT NULL,
  `note` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_otps`
--

CREATE TABLE `user_otps` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` tinyint(3) UNSIGNED DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_otps`
--

INSERT INTO `user_otps` (`id`, `user_id`, `otp_code`, `expires_at`, `is_verified`, `created_at`) VALUES
(1, 2, '295625', '2026-01-18 02:31:23', 1, '2026-01-17 18:26:23'),
(2, 2, '360983', '2026-01-18 12:17:59', 1, '2026-01-18 04:12:59'),
(3, 2, '730106', '2026-01-18 12:18:13', 1, '2026-01-18 04:13:13'),
(4, 2, '508285', '2026-01-18 12:18:43', 1, '2026-01-18 04:13:43'),
(5, 3, '376091', '2026-01-18 12:19:48', 1, '2026-01-18 04:14:48'),
(6, 3, '141690', '2026-01-18 12:20:44', 1, '2026-01-18 04:15:44'),
(7, 2, '442439', '2026-01-18 13:09:31', 1, '2026-01-18 05:04:31'),
(8, 2, '555203', '2026-01-18 18:08:49', 1, '2026-01-18 10:03:49'),
(9, 2, '451787', '2026-01-18 18:09:16', 1, '2026-01-18 10:04:16'),
(12, 2, '049211', '2026-01-19 18:32:21', 1, '2026-01-19 10:27:21'),
(13, 3, '092839', '2026-01-21 14:41:39', 1, '2026-01-21 06:36:39'),
(14, 4, '184568', '2026-01-21 14:41:59', 1, '2026-01-21 06:36:59'),
(15, 2, '434841', '2026-01-21 15:23:11', 1, '2026-01-21 07:18:11'),
(16, 3, '471375', '2026-01-22 08:29:00', 1, '2026-01-22 00:24:00'),
(17, 2, '576055', '2026-01-22 10:54:49', 1, '2026-01-22 02:49:49'),
(18, 2, '204833', '2026-02-09 14:07:27', 1, '2026-02-09 06:02:27'),
(20, 2, '203298', '2026-02-24 07:18:57', 1, '2026-02-24 07:13:57'),
(21, 7, '124669', '2026-02-24 07:49:30', 1, '2026-02-24 07:44:30'),
(22, 7, '147749', '2026-02-24 07:51:35', 1, '2026-02-24 07:46:35'),
(23, 1, '456960', '2026-02-24 17:47:29', 1, '2026-02-24 17:42:29'),
(24, 1, '468459', '2026-02-24 17:48:22', 1, '2026-02-24 17:43:22'),
(25, 1, '269719', '2026-02-25 03:01:51', 1, '2026-02-25 02:56:51'),
(26, 1, '240498', '2026-02-25 03:02:21', 1, '2026-02-25 02:57:21'),
(27, 1, '263209', '2026-02-25 03:26:36', 1, '2026-02-25 03:21:36'),
(28, 1, '181469', '2026-02-25 03:41:44', 1, '2026-02-25 03:36:44'),
(29, 4, '472916', '2026-02-25 03:59:49', 1, '2026-02-25 03:54:49'),
(30, 4, '153884', '2026-02-25 05:26:47', 1, '2026-02-25 05:21:47'),
(31, 4, '756212', '2026-02-25 05:29:44', 1, '2026-02-25 05:24:44'),
(32, 1, '275307', '2026-02-25 05:34:08', 1, '2026-02-25 05:29:08'),
(33, 1, '201757', '2026-02-25 07:19:15', 1, '2026-02-25 07:14:15'),
(34, 1, '747727', '2026-02-25 07:33:08', 1, '2026-02-25 07:28:08'),
(35, 1, '740446', '2026-02-25 11:44:58', 1, '2026-02-25 11:39:58'),
(36, 1, '657173', '2026-02-25 13:23:11', 1, '2026-02-25 13:18:11'),
(37, 1, '482180', '2026-02-25 14:50:57', 1, '2026-02-25 14:45:57'),
(38, 1, '162322', '2026-02-25 15:10:21', 1, '2026-02-25 15:05:21'),
(39, 4, '008127', '2026-02-25 15:46:29', 1, '2026-02-25 15:41:29'),
(40, 1, '110944', '2026-07-10 00:36:02', 1, '2026-07-09 16:34:02'),
(41, 1, '609802', '2026-07-10 00:42:25', 1, '2026-07-09 16:40:25'),
(42, 1, '559415', '2026-07-10 00:42:40', 1, '2026-07-09 16:40:40'),
(43, 1, '207547', '2026-07-10 01:12:50', 1, '2026-07-09 17:10:50'),
(44, 1, '261514', '2026-07-10 01:13:23', 1, '2026-07-09 17:11:23'),
(45, 1, '239948', '2026-07-10 01:13:40', 0, '2026-07-09 17:11:40');

-- --------------------------------------------------------

--
-- Table structure for table `venues`
--

CREATE TABLE `venues` (
  `id` int(11) NOT NULL,
  `venue_name` varchar(150) NOT NULL,
  `address` varchar(255) NOT NULL,
  `venue_type` enum('City Hall','Barangay Hall','Public Venue') NOT NULL,
  `capacity` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `venues`
--

INSERT INTO `venues` (`id`, `venue_name`, `address`, `venue_type`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Sangguniang Panlungsod Session Hall', 'Valenzuela City Hall, MacArthur Highway, Valenzuela City', 'City Hall', 120, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56'),
(2, 'Conference Room A - City Hall Annex', 'Valenzuela City Hall Annex, Valenzuela City', 'City Hall', 40, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56'),
(3, 'Valenzuela Astrodome', 'Astrodome, Valenzuela City', 'Public Venue', 5000, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56'),
(4, 'Barangay Hall - Malinta', 'Barangay Malinta, Valenzuela City', 'Barangay Hall', 80, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56'),
(5, 'Barangay Hall - Karuhatan', 'Barangay Karuhatan, Valenzuela City', 'Barangay Hall', 70, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56'),
(6, 'Barangay Hall - Marulas', 'Barangay Marulas, Valenzuela City', 'Barangay Hall', 60, 'Active', '2026-02-23 17:14:56', '2026-02-23 17:14:56');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `action_types`
--
ALTER TABLE `action_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`agenda_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `agenda_items`
--
ALTER TABLE `agenda_items`
  ADD PRIMARY KEY (`agenda_item_id`),
  ADD KEY `agenda_id` (`agenda_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `fk_action_type` (`action_type_id`);

--
-- Indexes for table `agenda_item_documents`
--
ALTER TABLE `agenda_item_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `agenda_item_id` (`agenda_item_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `deadlines`
--
ALTER TABLE `deadlines`
  ADD PRIMARY KEY (`deadline_id`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `quorum_rules`
--
ALTER TABLE `quorum_rules`
  ADD PRIMARY KEY (`rule_id`);

--
-- Indexes for table `reminder_batches`
--
ALTER TABLE `reminder_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `reminder_recipients`
--
ALTER TABLE `reminder_recipients`
  ADD PRIMARY KEY (`recipient_id`),
  ADD UNIQUE KEY `batch_id` (`batch_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `sessions_ibfk_created_by` (`created_by`),
  ADD KEY `fk_session_venue` (`venue_id`);

--
-- Indexes for table `session_assignments`
--
ALTER TABLE `session_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `unique_session_user` (`session_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `session_attendance`
--
ALTER TABLE `session_attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `session_id` (`session_id`,`member_id`,`user_id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `session_documents`
--
ALTER TABLE `session_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `session_minutes`
--
ALTER TABLE `session_minutes`
  ADD PRIMARY KEY (`minutes_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `session_status_history`
--
ALTER TABLE `session_status_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_notes`
--
ALTER TABLE `user_notes`
  ADD PRIMARY KEY (`note_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `note_date` (`note_date`);

--
-- Indexes for table `user_otps`
--
ALTER TABLE `user_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `otp_code` (`otp_code`);

--
-- Indexes for table `venues`
--
ALTER TABLE `venues`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `action_types`
--
ALTER TABLE `action_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `agendas`
--
ALTER TABLE `agendas`
  MODIFY `agenda_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `agenda_items`
--
ALTER TABLE `agenda_items`
  MODIFY `agenda_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `agenda_item_documents`
--
ALTER TABLE `agenda_item_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=273;

--
-- AUTO_INCREMENT for table `deadlines`
--
ALTER TABLE `deadlines`
  MODIFY `deadline_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `quorum_rules`
--
ALTER TABLE `quorum_rules`
  MODIFY `rule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reminder_batches`
--
ALTER TABLE `reminder_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `reminder_recipients`
--
ALTER TABLE `reminder_recipients`
  MODIFY `recipient_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=333;

--
-- AUTO_INCREMENT for table `sessions`
--
ALTER TABLE `sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `session_assignments`
--
ALTER TABLE `session_assignments`
  MODIFY `assignment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=177;

--
-- AUTO_INCREMENT for table `session_attendance`
--
ALTER TABLE `session_attendance`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=201;

--
-- AUTO_INCREMENT for table `session_documents`
--
ALTER TABLE `session_documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `session_minutes`
--
ALTER TABLE `session_minutes`
  MODIFY `minutes_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `session_status_history`
--
ALTER TABLE `session_status_history`
  MODIFY `history_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `user_notes`
--
ALTER TABLE `user_notes`
  MODIFY `note_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_otps`
--
ALTER TABLE `user_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `venues`
--
ALTER TABLE `venues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agendas`
--
ALTER TABLE `agendas`
  ADD CONSTRAINT `agendas_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`);

--
-- Constraints for table `agenda_items`
--
ALTER TABLE `agenda_items`
  ADD CONSTRAINT `agenda_items_ibfk_1` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`agenda_id`),
  ADD CONSTRAINT `agenda_items_ibfk_2` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`),
  ADD CONSTRAINT `fk_action_type` FOREIGN KEY (`action_type_id`) REFERENCES `action_types` (`id`);

--
-- Constraints for table `agenda_item_documents`
--
ALTER TABLE `agenda_item_documents`
  ADD CONSTRAINT `agenda_item_documents_ibfk_1` FOREIGN KEY (`agenda_item_id`) REFERENCES `agenda_items` (`agenda_item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `agenda_item_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `deadlines`
--
ALTER TABLE `deadlines`
  ADD CONSTRAINT `deadlines_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `deadlines_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_batches`
--
ALTER TABLE `reminder_batches`
  ADD CONSTRAINT `reminder_batches_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `reminder_recipients`
--
ALTER TABLE `reminder_recipients`
  ADD CONSTRAINT `reminder_recipients_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `reminder_batches` (`batch_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reminder_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_session_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sessions_ibfk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `session_assignments`
--
ALTER TABLE `session_assignments`
  ADD CONSTRAINT `session_assignments_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `session_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_attendance`
--
ALTER TABLE `session_attendance`
  ADD CONSTRAINT `session_attendance_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`),
  ADD CONSTRAINT `session_attendance_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`),
  ADD CONSTRAINT `session_attendance_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `session_documents`
--
ALTER TABLE `session_documents`
  ADD CONSTRAINT `session_documents_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`),
  ADD CONSTRAINT `session_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `session_minutes`
--
ALTER TABLE `session_minutes`
  ADD CONSTRAINT `session_minutes_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`) ON DELETE CASCADE;

--
-- Constraints for table `session_status_history`
--
ALTER TABLE `session_status_history`
  ADD CONSTRAINT `session_status_history_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`session_id`);

--
-- Constraints for table `user_notes`
--
ALTER TABLE `user_notes`
  ADD CONSTRAINT `user_notes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_otps`
--
ALTER TABLE `user_otps`
  ADD CONSTRAINT `user_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
