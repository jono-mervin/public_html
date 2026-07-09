<?php
/**
 * Integration client (API key) management.
 * Uses existing LACS admin session — NOT integration API keys.
 *
 * GET  /api/v1/clients.php           — list clients (Admin/Super Admin)
 * POST /api/v1/clients.php           — create client + return plain API key once
 * PUT  /api/v1/clients.php?id=1      — update client (activate/deactivate, scopes, IPs)
 * DELETE /api/v1/clients.php?id=1    — deactivate client
 */

require_once __DIR__ . '/bootstrap.php';

$admin = integrationRequireSessionAdmin();
$conn = $GLOBALS['integration_conn'];
$method = $_SERVER['REQUEST_METHOD'];
$clientId = isset($_GET['id']) ? (int) $_GET['id'] : null;

if ($method === 'GET') {
    $result = $conn->query("
        SELECT client_id, client_name, source_system, api_key_prefix, allowed_ips,
               scopes, is_active, created_by, created_at, last_used_at
        FROM integration_clients
        ORDER BY client_id DESC
    ");

    $clients = [];
    while ($row = $result->fetch_assoc()) {
        $row['scopes'] = json_decode($row['scopes'] ?? '[]', true);
        $row['allowed_ips'] = $row['allowed_ips'] ? json_decode($row['allowed_ips'], true) : null;
        $clients[] = $row;
    }

    $recentLogs = [];
    $logResult = $conn->query("
        SELECT l.log_id, l.endpoint, l.method, l.status_code, l.request_id, l.created_at,
               c.client_name, c.source_system
        FROM integration_logs l
        LEFT JOIN integration_clients c ON c.client_id = l.client_id
        ORDER BY l.log_id DESC
        LIMIT 20
    ");
    if ($logResult) {
        while ($row = $logResult->fetch_assoc()) {
            $recentLogs[] = $row;
        }
    }

    integrationJsonSuccess([
        'clients' => $clients,
        'available_scopes' => INTEGRATION_SCOPES,
        'term' => [
            'start' => INTEGRATION_TERM_START,
            'end' => INTEGRATION_TERM_END,
        ],
        'recent_logs' => $recentLogs,
    ]);
}

if ($method === 'POST') {
    $body = integrationReadJsonBody();

    $clientName = trim($body['client_name'] ?? '');
    $sourceSystem = trim($body['source_system'] ?? '');
    $scopes = $body['scopes'] ?? ['calendar:read', 'sessions:read', 'sync:read'];
    $allowedIps = $body['allowed_ips'] ?? null;

    if ($clientName === '' || $sourceSystem === '') {
        integrationJsonError(422, 'client_name and source_system are required');
    }

    if (!is_array($scopes) || empty($scopes)) {
        integrationJsonError(422, 'At least one scope is required');
    }

    foreach ($scopes as $scope) {
        if (!in_array($scope, INTEGRATION_SCOPES, true)) {
            integrationJsonError(422, 'Invalid scope: ' . $scope);
        }
    }

    $keyData = integrationGenerateApiKey();
    $scopesJson = json_encode(array_values($scopes));
    $allowedIpsJson = is_array($allowedIps) && !empty($allowedIps) ? json_encode(array_values($allowedIps)) : null;
    $createdBy = $admin['user_id'];

    $stmt = $conn->prepare("
        INSERT INTO integration_clients (
            client_name, source_system, api_key_hash, api_key_prefix,
            allowed_ips, scopes, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    ");
    $stmt->bind_param(
        'ssssssi',
        $clientName,
        $sourceSystem,
        $keyData['hash'],
        $keyData['prefix'],
        $allowedIpsJson,
        $scopesJson,
        $createdBy
    );

    if (!$stmt->execute()) {
        if ($conn->errno === 1062) {
            integrationJsonError(409, 'source_system already registered');
        }
        integrationJsonError(500, 'Failed to create integration client');
    }

    $newId = (int) $stmt->insert_id;
    $stmt->close();

    integrationJsonSuccess([
        'client_id' => $newId,
        'client_name' => $clientName,
        'source_system' => $sourceSystem,
        'scopes' => $scopes,
        'api_key' => $keyData['plain'],
        'warning' => 'Store this API key now. It will not be shown again.',
    ], 'Integration client created', 201);
}

if ($method === 'PUT') {
    if (!$clientId) {
        integrationJsonError(400, 'Client id is required');
    }

    $body = integrationReadJsonBody();
    $fields = [];
    $types = '';
    $values = [];

    if (array_key_exists('client_name', $body)) {
        $fields[] = 'client_name = ?';
        $types .= 's';
        $values[] = trim($body['client_name']);
    }
    if (array_key_exists('is_active', $body)) {
        $fields[] = 'is_active = ?';
        $types .= 'i';
        $values[] = !empty($body['is_active']) ? 1 : 0;
    }
    if (array_key_exists('scopes', $body)) {
        if (!is_array($body['scopes']) || empty($body['scopes'])) {
            integrationJsonError(422, 'scopes must be a non-empty array');
        }
        foreach ($body['scopes'] as $scope) {
            if (!in_array($scope, INTEGRATION_SCOPES, true)) {
                integrationJsonError(422, 'Invalid scope: ' . $scope);
            }
        }
        $fields[] = 'scopes = ?';
        $types .= 's';
        $values[] = json_encode(array_values($body['scopes']));
    }
    if (array_key_exists('allowed_ips', $body)) {
        $fields[] = 'allowed_ips = ?';
        $types .= 's';
        $values[] = is_array($body['allowed_ips']) && !empty($body['allowed_ips'])
            ? json_encode(array_values($body['allowed_ips']))
            : null;
    }

    if (empty($fields)) {
        integrationJsonError(400, 'No updatable fields provided');
    }

    $types .= 'i';
    $values[] = $clientId;

    $sql = 'UPDATE integration_clients SET ' . implode(', ', $fields) . ' WHERE client_id = ?';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        integrationJsonError(404, 'Client not found or no changes made');
    }
    $stmt->close();

    integrationJsonSuccess(['client_id' => $clientId], 'Integration client updated');
}

if ($method === 'DELETE') {
    if (!$clientId) {
        integrationJsonError(400, 'Client id is required');
    }

    $stmt = $conn->prepare("UPDATE integration_clients SET is_active = 0 WHERE client_id = ?");
    $stmt->bind_param('i', $clientId);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        integrationJsonError(404, 'Client not found');
    }
    $stmt->close();

    integrationJsonSuccess(['client_id' => $clientId], 'Integration client deactivated');
}

integrationJsonError(405, 'Method not allowed');
