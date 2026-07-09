<?php
/**
 * LACS Integration API configuration.
 * Loaded only by api/v1/* endpoints — does not affect the main application.
 */

define('INTEGRATION_TERM_START', '2025-06-30');
define('INTEGRATION_TERM_END', '2028-06-30');

define('INTEGRATION_KEY_PREFIX', 'lacs_live_');

/** All supported scopes for integration clients */
define('INTEGRATION_SCOPES', [
    'calendar:read',
    'sessions:read',
    'sessions:write',
    'sync:read',
    'sync:write',
]);

/**
 * Return true when integration tables exist in the database.
 */
function integrationTablesReady(mysqli $conn): bool
{
    $result = $conn->query("SHOW TABLES LIKE 'integration_clients'");
    return $result && $result->num_rows > 0;
}

/**
 * Create integration tables and optional sync columns (safe to run multiple times).
 * Only called from api/v1/bootstrap.php — never from the main app.
 */
function ensureIntegrationSchema(mysqli $conn): void
{
    $conn->query("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $conn->query("
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    ");

    $sessionColumns = [
        'external_ref' => "ALTER TABLE `sessions` ADD COLUMN `external_ref` varchar(128) DEFAULT NULL AFTER `venue_id`",
        'source_system' => "ALTER TABLE `sessions` ADD COLUMN `source_system` varchar(64) DEFAULT NULL AFTER `external_ref`",
        'synced_at' => "ALTER TABLE `sessions` ADD COLUMN `synced_at` timestamp NULL DEFAULT NULL AFTER `source_system`",
    ];

    foreach ($sessionColumns as $column => $sql) {
        $check = $conn->query("SHOW COLUMNS FROM `sessions` LIKE '{$column}'");
        if ($check && $check->num_rows === 0) {
            $conn->query($sql);
        }
    }

    $indexCheck = $conn->query("SHOW INDEX FROM `sessions` WHERE Key_name = 'uq_session_external_ref'");
    if ($indexCheck && $indexCheck->num_rows === 0) {
        $conn->query("
            ALTER TABLE `sessions`
            ADD UNIQUE KEY `uq_session_external_ref` (`source_system`, `external_ref`)
        ");
    }

    $agendaColumns = [
        'external_ref' => "ALTER TABLE `agendas` ADD COLUMN `external_ref` varchar(128) DEFAULT NULL AFTER `created_at`",
        'source_system' => "ALTER TABLE `agendas` ADD COLUMN `source_system` varchar(64) DEFAULT NULL AFTER `external_ref`",
        'synced_at' => "ALTER TABLE `agendas` ADD COLUMN `synced_at` timestamp NULL DEFAULT NULL AFTER `source_system`",
    ];

    foreach ($agendaColumns as $column => $sql) {
        $check = $conn->query("SHOW COLUMNS FROM `agendas` LIKE '{$column}'");
        if ($check && $check->num_rows === 0) {
            $conn->query($sql);
        }
    }

    $agendaIndexCheck = $conn->query("SHOW INDEX FROM `agendas` WHERE Key_name = 'uq_agenda_external_ref'");
    if ($agendaIndexCheck && $agendaIndexCheck->num_rows === 0) {
        $conn->query("
            ALTER TABLE `agendas`
            ADD UNIQUE KEY `uq_agenda_external_ref` (`source_system`, `external_ref`)
        ");
    }
}

function integrationJsonResponse(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function integrationJsonSuccess($data = null, string $message = 'OK', int $status = 200): void
{
    $payload = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $payload['data'] = $data;
    }
    integrationJsonResponse($status, $payload);
}

function integrationJsonError(int $status, string $message, array $errors = []): void
{
    $payload = ['success' => false, 'message' => $message];
    if (!empty($errors)) {
        $payload['errors'] = $errors;
    }
    integrationJsonResponse($status, $payload);
}

function integrationGenerateApiKey(): array
{
    $raw = bin2hex(random_bytes(24));
    $plain = INTEGRATION_KEY_PREFIX . $raw;
    return [
        'plain' => $plain,
        'hash' => password_hash($plain, PASSWORD_DEFAULT),
        'prefix' => substr($plain, 0, 16),
    ];
}

function integrationClampDateToTerm(string $date): ?string
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}/', $date, $m)) {
        return null;
    }
    $value = $m[0];
    if ($value < INTEGRATION_TERM_START) {
        return INTEGRATION_TERM_START;
    }
    if ($value > INTEGRATION_TERM_END) {
        return INTEGRATION_TERM_END;
    }
    return $value;
}

function integrationIsWithinTerm(string $date): bool
{
    $clamped = integrationClampDateToTerm($date);
    return $clamped !== null && $clamped === substr($date, 0, 10);
}

function integrationGetRequestId(): string
{
    $header = $_SERVER['HTTP_X_REQUEST_ID'] ?? '';
    if ($header !== '' && preg_match('/^[a-zA-Z0-9\-_]{8,64}$/', $header)) {
        return $header;
    }
    return bin2hex(random_bytes(16));
}

function integrationGetSystemUserId(mysqli $conn): int
{
    $result = $conn->query("SELECT user_id FROM users WHERE user_role = 'Super Admin' ORDER BY user_id ASC LIMIT 1");
    if ($result && ($row = $result->fetch_assoc())) {
        return (int) $row['user_id'];
    }
    $fallback = $conn->query("SELECT user_id FROM users ORDER BY user_id ASC LIMIT 1");
    if ($fallback && ($row = $fallback->fetch_assoc())) {
        return (int) $row['user_id'];
    }
    return 1;
}
