<?php
/**
 * Integration API bootstrap.
 * Loaded only by api/v1/* — the main LACS app never includes this file.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/integration.php';

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

$GLOBALS['integration_request_id'] = integrationGetRequestId();
$GLOBALS['integration_conn'] = getDBConnection();

ensureIntegrationSchema($GLOBALS['integration_conn']);

require_once __DIR__ . '/middleware.php';
