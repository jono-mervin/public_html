-- Optional manual migration for LACS Integration API
-- The api/v1 bootstrap also applies this automatically on first integration request.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS `integration_clients` (
  `client_id` int(11) NOT NULL AUTO_INCREMENT,
  `client_name` varchar(100) NOT NULL,
  `source_system` varchar(64) NOT NULL,
  `api_key_hash` varchar(255) NOT NULL,
  `api_key_prefix` varchar(16) NOT NULL,
  `allowed_ips` text DEFAULT NULL COMMENT 'JSON array of allowed IPs; null = any',
  `scopes` text NOT NULL COMMENT 'JSON array of scope strings',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`client_id`),
  UNIQUE KEY `uq_source_system` (`source_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `integration_logs` (
  `log_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) DEFAULT NULL,
  `endpoint` varchar(255) NOT NULL,
  `method` varchar(10) NOT NULL,
  `request_id` varchar(64) DEFAULT NULL,
  `status_code` smallint(6) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_client_created` (`client_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sync columns on existing tables (run only if columns do not exist)
ALTER TABLE `sessions`
  ADD COLUMN IF NOT EXISTS `external_ref` varchar(128) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `source_system` varchar(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `synced_at` timestamp NULL DEFAULT NULL;

ALTER TABLE `agendas`
  ADD COLUMN IF NOT EXISTS `external_ref` varchar(128) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `source_system` varchar(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `synced_at` timestamp NULL DEFAULT NULL;

-- Note: IF NOT EXISTS for ADD COLUMN requires MySQL 8.0+.
-- On MariaDB/XAMPP without IF NOT EXISTS, use api/v1 bootstrap auto-migration instead.
