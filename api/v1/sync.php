<?php
/**
 * POST /api/v1/sync.php  — upsert session or agenda by external_ref (scope: sync:write)
 * GET  /api/v1/sync.php?since=ISO8601 — delta changes (scope: sync:read)
 */

require_once __DIR__ . '/bootstrap.php';

$conn = $GLOBALS['integration_conn'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $client = integrationRequireAuth(['sync:read']);

    $since = $_GET['since'] ?? null;
    if (!$since) {
        integrationJsonError(400, 'Query parameter "since" is required (ISO 8601 datetime)');
    }

    $sinceTs = strtotime($since);
    if ($sinceTs === false) {
        integrationJsonError(400, 'Invalid "since" datetime format');
    }
    $sinceSql = date('Y-m-d H:i:s', $sinceTs);

    $sessions = [];
    $stmt = $conn->prepare("
        SELECT session_id, title, session_type, session_date, status, venue,
               external_ref, source_system, synced_at, created_at
        FROM sessions
        WHERE session_status = 'Active'
          AND (
              synced_at >= ?
              OR (synced_at IS NULL AND created_at >= ?)
          )
        ORDER BY COALESCE(synced_at, created_at) ASC
    ");
    $stmt->bind_param('ss', $sinceSql, $sinceSql);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }
    $stmt->close();

    $agendas = [];
    $agendaCheck = $conn->query("SHOW COLUMNS FROM agendas LIKE 'synced_at'");
    if ($agendaCheck && $agendaCheck->num_rows > 0) {
        $agendaStmt = $conn->prepare("
            SELECT agenda_id, session_id, agenda_title, agenda_description, status,
                   external_ref, source_system, synced_at, created_at
            FROM agendas
            WHERE synced_at >= ? OR (synced_at IS NULL AND created_at >= ?)
            ORDER BY COALESCE(synced_at, created_at) ASC
        ");
        $agendaStmt->bind_param('ss', $sinceSql, $sinceSql);
        $agendaStmt->execute();
        $agendaResult = $agendaStmt->get_result();
        while ($row = $agendaResult->fetch_assoc()) {
            $agendas[] = $row;
        }
        $agendaStmt->close();
    }

    integrationFinishRequest(200);
    integrationJsonSuccess([
        'since' => $since,
        'sessions' => $sessions,
        'agendas' => $agendas,
        'request_id' => $GLOBALS['integration_request_id'],
    ]);
}

if ($method === 'POST') {
    $client = integrationRequireAuth(['sync:write']);
    $body = integrationReadJsonBody();

    $entity = strtolower($body['entity'] ?? 'session');
    $sourceSystem = $body['source_system'] ?? $client['source_system'];
    $externalRef = trim($body['external_ref'] ?? '');

    if ($externalRef === '') {
        integrationJsonError(422, 'external_ref is required for sync upsert', ['external_ref' => 'Required']);
    }

    if ($entity === 'session') {
        $result = integrationSyncSession($conn, $client, $body, $sourceSystem, $externalRef);
        integrationFinishRequest($result['status']);
        integrationJsonSuccess($result['data'], $result['message'], $result['status']);
    }

    if ($entity === 'agenda') {
        $result = integrationSyncAgenda($conn, $client, $body, $sourceSystem, $externalRef);
        integrationFinishRequest($result['status']);
        integrationJsonSuccess($result['data'], $result['message'], $result['status']);
    }

    integrationJsonError(400, 'Unsupported entity. Use "session" or "agenda".');
}

integrationJsonError(405, 'Method not allowed');

function integrationSyncSession(mysqli $conn, array $client, array $body, string $sourceSystem, string $externalRef): array
{
    $allowedTypes = ['Regular Session', 'Special Session', 'Emergency Session'];
    $allowedStatuses = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed', 'Missed'];

    $existing = integrationFindSessionByExternalRef($conn, $sourceSystem, $externalRef);

    if ($existing) {
        $fields = [];
        $types = '';
        $values = [];

        $map = [
            'title' => 's',
            'session_type' => 's',
            'session_date' => 's',
            'actual_start_time' => 's',
            'actual_end_time' => 's',
            'venue' => 's',
            'presiding_officer' => 's',
            'status' => 's',
        ];

        foreach ($map as $field => $type) {
            if (!array_key_exists($field, $body)) {
                continue;
            }
            if ($field === 'session_date' && !integrationIsWithinTerm($body[$field])) {
                integrationJsonError(422, 'session_date outside electoral term');
            }
            $fields[] = "{$field} = ?";
            $types .= $type;
            $values[] = $body[$field];
        }

        if (empty($fields)) {
            return [
                'status' => 200,
                'message' => 'No changes',
                'data' => ['session' => $existing, 'action' => 'unchanged'],
            ];
        }

        $fields[] = 'synced_at = NOW()';
        $types .= 'iss';
        $values[] = (int) $existing['session_id'];
        $values[] = $sourceSystem;
        $values[] = $externalRef;

        $sql = 'UPDATE sessions SET ' . implode(', ', $fields) . ' WHERE session_id = ? AND source_system = ? AND external_ref = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        $stmt->close();

        $session = integrationGetSessionById($conn, (int) $existing['session_id']);
        return [
            'status' => 200,
            'message' => 'Session updated via sync',
            'data' => ['session' => $session, 'action' => 'updated'],
        ];
    }

    if (empty($body['title']) || empty($body['session_type']) || empty($body['session_date'])) {
        integrationJsonError(422, 'title, session_type, and session_date are required for new session sync');
    }

    if (!in_array($body['session_type'], $allowedTypes, true)) {
        integrationJsonError(422, 'Invalid session_type');
    }
    if (!integrationIsWithinTerm($body['session_date'])) {
        integrationJsonError(422, 'session_date outside electoral term');
    }

    $createdBy = integrationGetSystemUserId($conn);
    $status = $body['status'] ?? 'Scheduled';
    if (!in_array($status, $allowedStatuses, true)) {
        $status = 'Scheduled';
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
    $stmt->execute();
    $newId = (int) $stmt->insert_id;
    $stmt->close();

    return [
        'status' => 201,
        'message' => 'Session created via sync',
        'data' => [
            'session' => integrationGetSessionById($conn, $newId),
            'action' => 'created',
        ],
    ];
}

function integrationSyncAgenda(mysqli $conn, array $client, array $body, string $sourceSystem, string $externalRef): array
{
    $sessionId = isset($body['session_id']) ? (int) $body['session_id'] : 0;
    if ($sessionId <= 0) {
        integrationJsonError(422, 'session_id is required when syncing an agenda');
    }

    $session = integrationGetSessionById($conn, $sessionId);
    if (!$session) {
        integrationJsonError(404, 'Linked session not found');
    }

    $stmt = $conn->prepare("
        SELECT * FROM agendas
        WHERE source_system = ? AND external_ref = ?
        LIMIT 1
    ");
    $stmt->bind_param('ss', $sourceSystem, $externalRef);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $title = $body['agenda_title'] ?? $body['title'] ?? null;
    $description = $body['agenda_description'] ?? $body['description'] ?? null;
    $status = $body['status'] ?? 'Draft';

    if ($existing) {
        $update = $conn->prepare("
            UPDATE agendas
            SET agenda_title = COALESCE(?, agenda_title),
                agenda_description = COALESCE(?, agenda_description),
                status = COALESCE(?, status),
                synced_at = NOW()
            WHERE agenda_id = ?
        ");
        $agendaId = (int) $existing['agenda_id'];
        $update->bind_param('sssi', $title, $description, $status, $agendaId);
        $update->execute();
        $update->close();

        return [
            'status' => 200,
            'message' => 'Agenda updated via sync',
            'data' => ['agenda_id' => $agendaId, 'action' => 'updated'],
        ];
    }

    if (!$title) {
        integrationJsonError(422, 'agenda_title is required for new agenda sync');
    }

    $insert = $conn->prepare("
        INSERT INTO agendas (session_id, agenda_title, agenda_description, status, external_ref, source_system, synced_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    $insert->bind_param('isssss', $sessionId, $title, $description, $status, $externalRef, $sourceSystem);
    $insert->execute();
    $agendaId = (int) $insert->insert_id;
    $insert->close();

    return [
        'status' => 201,
        'message' => 'Agenda created via sync',
        'data' => ['agenda_id' => $agendaId, 'action' => 'created'],
    ];
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
