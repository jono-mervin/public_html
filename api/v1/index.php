<?php
/**
 * Integration API index — optional discovery endpoint (no auth required).
 * Confirms the integration layer is installed; does not expose data.
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    integrationJsonError(405, 'Method not allowed');
}

integrationJsonSuccess([
    'service' => 'LACS Integration API',
    'version' => '1.0',
    'status' => 'ready',
    'term' => [
        'start' => INTEGRATION_TERM_START,
        'end' => INTEGRATION_TERM_END,
    ],
    'endpoints' => [
        'calendar' => 'GET  /api/v1/calendar.php',
        'sessions' => 'GET|POST|PUT /api/v1/sessions.php',
        'sync' => 'GET|POST /api/v1/sync.php',
        'clients' => 'GET|POST|PUT|DELETE /api/v1/clients.php (admin session)',
    ],
    'auth' => 'Authorization: Bearer <api_key>',
    'note' => 'Main LACS application works independently. Integration is optional.',
]);
