<?php
/**
 * GET  /api/v1/sessions.php          — list sessions (scope: sessions:read)
 * GET  /api/v1/sessions.php?id=64    — single session
 * POST /api/v1/sessions.php          — create session (scope: sessions:write)
 * PUT  /api/v1/sessions.php?id=64    — update session status/metadata (scope: sessions:write)
 */

require_once __DIR__ . '/bootstrap.php';

$conn = $GLOBALS['integration_conn'];
$method = $_SERVER['REQUEST_METHOD'];
$sessionId = isset($_GET['id']) ? (int) $_GET['id'] : null;

$allowedTypes = ['Regular Session', 'Special Session', 'Emergency Session'];
$allowedStatuses = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed', 'Missed'];

if ($method === 'GET') {
    $client = integrationRequireAuth(['sessions:read']);

    if ($sessionId) {
        $stmt = $conn->prepare("
            SELECT s.*, u.user_name AS creator_name
            FROM sessions s
            LEFT JOIN users u ON s.created_by = u.user_id
            WHERE s.session_id = ? AND s.session_status = 'Active'
            LIMIT 1
        ");
        $stmt->bind_param('i', $sessionId);
        $stmt->execute();
        $result = $stmt->get_result();
        $session = $result->fetch_assoc();
        $stmt->close();

        if (!$session) {
            integrationFinishRequest(404);
            integrationJsonError(404, 'Session not found');
        }

        integrationFinishRequest(200);
        integrationJsonSuccess(['session' => $session]);
    }

    $from = $_GET['from'] ?? INTEGRATION_TERM_START;
    $to = $_GET['to'] ?? INTEGRATION_TERM_END;
    $status = $_GET['status'] ?? null;

    if (!integrationIsWithinTerm($from) || !integrationIsWithinTerm($to)) {
        integrationJsonError(400, 'Date range must be within electoral term');
    }

    $sql = "
        SELECT session_id, title, session_type, session_date, status, venue,
               actual_start_time, actual_end_time, external_ref, source_system,
               synced_at, created_at
        FROM sessions
        WHERE session_status = 'Active'
          AND session_date BETWEEN ? AND ?
    ";
    $types = 'ss';
    $params = [$from, $to];

    if ($status !== null && $status !== '') {
        $sql .= " AND status = ?";
        $types .= 's';
        $params[] = $status;
    }

    $sql .= " ORDER BY session_date ASC, session_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }
    $stmt->close();

    integrationFinishRequest(200);
    integrationJsonSuccess([
        'from' => $from,
        'to' => $to,
        'count' => count($sessions),
        'sessions' => $sessions,
    ]);
}

if ($method === 'POST') {
    $client = integrationRequireAuth(['sessions:write']);
    $body = integrationReadJsonBody();

    $errors = integrationValidateSessionPayload($body, $allowedTypes, $allowedStatuses, true);
    if (!empty($errors)) {
        integrationJsonError(422, 'Validation failed', $errors);
    }

    $createdBy = integrationGetSystemUserId($conn);
    $sourceSystem = $body['source_system'] ?? $client['source_system'];
    $externalRef = $body['external_ref'] ?? null;

    if ($externalRef) {
        $existing = integrationFindSessionByExternalRef($conn, $sourceSystem, $externalRef);
        if ($existing) {
            integrationFinishRequest(200);
            integrationJsonSuccess([
                'session' => $existing,
                'action' => 'existing',
            ], 'Session already exists for this external reference');
        }
    }

    $stmt = $conn->prepare("
        INSERT INTO sessions (
            title, session_type, session_date, actual_start_time, actual_end_time,
            venue, presiding_officer, status, created_by, session_status,
            external_ref, source_system, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, NOW())
    ");

    $title = $body['title'];
    $sessionType = $body['session_type'];
    $sessionDate = $body['session_date'];
    $startTime = $body['actual_start_time'] ?? null;
    $endTime = $body['actual_end_time'] ?? null;
    $venue = $body['venue'] ?? null;
    $presidingOfficer = $body['presiding_officer'] ?? null;
    $status = $body['status'] ?? 'Scheduled';

    $stmt->bind_param(
        'ssssssssiss',
        $title,
        $sessionType,
        $sessionDate,
        $startTime,
        $endTime,
        $venue,
        $presidingOfficer,
        $status,
        $createdBy,
        $externalRef,
        $sourceSystem
    );

    if (!$stmt->execute()) {
        integrationJsonError(500, 'Failed to create session: ' . $stmt->error);
    }

    $newId = (int) $stmt->insert_id;
    $stmt->close();

    $session = integrationGetSessionById($conn, $newId);
    integrationFinishRequest(201);
    integrationJsonSuccess(['session' => $session, 'action' => 'created'], 'Session created', 201);
}

if ($method === 'PUT') {
    $client = integrationRequireAuth(['sessions:write']);

    if (!$sessionId) {
        integrationJsonError(400, 'Session id is required for update');
    }

    $body = integrationReadJsonBody();
    $existing = integrationGetSessionById($conn, $sessionId);
    if (!$existing) {
        integrationFinishRequest(404);
        integrationJsonError(404, 'Session not found');
    }

    $fields = [];
    $types = '';
    $values = [];

    $updatable = [
        'title' => 's',
        'session_type' => 's',
        'session_date' => 's',
        'actual_start_time' => 's',
        'actual_end_time' => 's',
        'venue' => 's',
        'presiding_officer' => 's',
        'status' => 's',
        'external_ref' => 's',
        'source_system' => 's',
    ];

    foreach ($updatable as $field => $type) {
        if (!array_key_exists($field, $body)) {
            continue;
        }

        if ($field === 'session_type' && !in_array($body[$field], $allowedTypes, true)) {
            integrationJsonError(422, 'Invalid session_type', ['session_type' => 'Must be one of: ' . implode(', ', $allowedTypes)]);
        }

        if ($field === 'status' && !in_array($body[$field], $allowedStatuses, true)) {
            integrationJsonError(422, 'Invalid status', ['status' => 'Must be one of: ' . implode(', ', $allowedStatuses)]);
        }

        if ($field === 'session_date' && !integrationIsWithinTerm($body[$field])) {
            integrationJsonError(422, 'session_date outside electoral term');
        }

        $fields[] = "{$field} = ?";
        $types .= $type;
        $values[] = $body[$field];
    }

    if (empty($fields)) {
        integrationJsonError(400, 'No updatable fields provided');
    }

    $fields[] = 'synced_at = NOW()';
    $types .= 'i';
    $values[] = $sessionId;

    $sql = 'UPDATE sessions SET ' . implode(', ', $fields) . ' WHERE session_id = ?';
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);

    if (!$stmt->execute()) {
        integrationJsonError(500, 'Failed to update session: ' . $stmt->error);
    }
    $stmt->close();

    $session = integrationGetSessionById($conn, $sessionId);
    integrationFinishRequest(200);
    integrationJsonSuccess(['session' => $session, 'action' => 'updated'], 'Session updated');
}

integrationJsonError(405, 'Method not allowed');

function integrationValidateSessionPayload(array $body, array $allowedTypes, array $allowedStatuses, bool $requireCore): array
{
    $errors = [];

    if ($requireCore && empty($body['title'])) {
        $errors['title'] = 'Required';
    }
    if ($requireCore && empty($body['session_type'])) {
        $errors['session_type'] = 'Required';
    } elseif (!empty($body['session_type']) && !in_array($body['session_type'], $allowedTypes, true)) {
        $errors['session_type'] = 'Invalid value';
    }
    if ($requireCore && empty($body['session_date'])) {
        $errors['session_date'] = 'Required';
    } elseif (!empty($body['session_date']) && !integrationIsWithinTerm($body['session_date'])) {
        $errors['session_date'] = 'Must be within ' . INTEGRATION_TERM_START . ' to ' . INTEGRATION_TERM_END;
    }
    if (!empty($body['status']) && !in_array($body['status'], $allowedStatuses, true)) {
        $errors['status'] = 'Invalid value';
    }

    return $errors;
}

function integrationFindSessionByExternalRef(mysqli $conn, string $sourceSystem, string $externalRef): ?array
{
    $stmt = $conn->prepare("
        SELECT * FROM sessions
        WHERE source_system = ? AND external_ref = ?
        LIMIT 1
    ");
    $stmt->bind_param('ss', $sourceSystem, $externalRef);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

function integrationGetSessionById(mysqli $conn, int $sessionId): ?array
{
    $stmt = $conn->prepare("SELECT * FROM sessions WHERE session_id = ? LIMIT 1");
    $stmt->bind_param('i', $sessionId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}
