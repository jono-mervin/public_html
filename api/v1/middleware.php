<?php
/**
 * Integration API authentication middleware.
 */

function integrationRequireAuth(array $requiredScopes = []): array
{
    $conn = $GLOBALS['integration_conn'];
    $endpoint = $_SERVER['SCRIPT_NAME'] ?? 'unknown';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $requestId = $GLOBALS['integration_request_id'];

    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
                break;
            }
        }
    }

    if (!preg_match('/Bearer\s+(\S+)/i', $header, $matches)) {
        integrationLogRequest($conn, null, $endpoint, $method, $requestId, 401);
        integrationJsonError(401, 'Missing API key. Use Authorization: Bearer <api_key>');
    }

    $apiKey = $matches[1];
    $client = integrationFindClientByKey($conn, $apiKey);

    if (!$client) {
        integrationLogRequest($conn, null, $endpoint, $method, $requestId, 401);
        integrationJsonError(401, 'Invalid or inactive API key');
    }

    if (!integrationClientIpAllowed($client)) {
        integrationLogRequest($conn, (int) $client['client_id'], $endpoint, $method, $requestId, 403);
        integrationJsonError(403, 'Request IP is not allowed for this integration client');
    }

    $clientScopes = json_decode($client['scopes'] ?? '[]', true);
    if (!is_array($clientScopes)) {
        $clientScopes = [];
    }

    foreach ($requiredScopes as $scope) {
        if (!in_array($scope, $clientScopes, true)) {
            integrationLogRequest($conn, (int) $client['client_id'], $endpoint, $method, $requestId, 403);
            integrationJsonError(403, 'Insufficient scope: ' . $scope);
        }
    }

    $stmt = $conn->prepare("UPDATE integration_clients SET last_used_at = NOW() WHERE client_id = ?");
    $clientId = (int) $client['client_id'];
    $stmt->bind_param('i', $clientId);
    $stmt->execute();
    $stmt->close();

    $client['scopes'] = $clientScopes;
    $GLOBALS['integration_client'] = $client;

    return $client;
}

function integrationFindClientByKey(mysqli $conn, string $apiKey): ?array
{
    $result = $conn->query("SELECT * FROM integration_clients WHERE is_active = 1");
    if (!$result) {
        return null;
    }

    while ($row = $result->fetch_assoc()) {
        if (password_verify($apiKey, $row['api_key_hash'])) {
            return $row;
        }
    }

    return null;
}

function integrationClientIpAllowed(array $client): bool
{
    if (empty($client['allowed_ips'])) {
        return true;
    }

    $allowed = json_decode($client['allowed_ips'], true);
    if (!is_array($allowed) || empty($allowed)) {
        return true;
    }

    $requestIp = $_SERVER['REMOTE_ADDR'] ?? '';
    return in_array($requestIp, $allowed, true);
}

function integrationLogRequest(
    mysqli $conn,
    ?int $clientId,
    string $endpoint,
    string $method,
    string $requestId,
    int $statusCode
): void {
    if (!integrationTablesReady($conn)) {
        return;
    }

    $stmt = $conn->prepare("
        INSERT INTO integration_logs (client_id, endpoint, method, request_id, status_code)
        VALUES (?, ?, ?, ?, ?)
    ");
    if (!$stmt) {
        return;
    }

    $stmt->bind_param('isssi', $clientId, $endpoint, $method, $requestId, $statusCode);
    $stmt->execute();
    $stmt->close();
}

function integrationFinishRequest(int $statusCode): void
{
    $conn = $GLOBALS['integration_conn'];
    $client = $GLOBALS['integration_client'] ?? null;
    $clientId = $client ? (int) $client['client_id'] : null;
    integrationLogRequest(
        $conn,
        $clientId,
        $_SERVER['SCRIPT_NAME'] ?? 'unknown',
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $GLOBALS['integration_request_id'],
        $statusCode
    );
}

function integrationReadJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        integrationJsonError(400, 'Request body must be valid JSON');
    }

    return $data;
}

function integrationRequireSessionAdmin(): array
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
        (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

    if (!$isAuthenticated) {
        integrationJsonError(401, 'Unauthorized — admin login required');
    }

    $role = $_SESSION['user_role'] ?? '';
    if (strcasecmp($role, 'Super Admin') !== 0 && strcasecmp($role, 'Admin') !== 0) {
        integrationJsonError(403, 'Only Admin or Super Admin can manage integration clients');
    }

    return [
        'user_id' => (int) ($_SESSION['user_id'] ?? 0),
        'role' => $role,
    ];
}
