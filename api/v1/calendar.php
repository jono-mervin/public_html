<?php
/**
 * GET /api/v1/calendar.php?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Read-only calendar events for external systems (sessions + deadlines).
 * Requires scope: calendar:read
 */

require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    integrationJsonError(405, 'Method not allowed');
}

$client = integrationRequireAuth(['calendar:read']);
$conn = $GLOBALS['integration_conn'];

$from = $_GET['from'] ?? INTEGRATION_TERM_START;
$to = $_GET['to'] ?? INTEGRATION_TERM_END;

if (!integrationIsWithinTerm($from) || !integrationIsWithinTerm($to)) {
    integrationJsonError(400, 'Date range must be within electoral term (' . INTEGRATION_TERM_START . ' to ' . INTEGRATION_TERM_END . ')');
}

if ($from > $to) {
    integrationJsonError(400, 'Parameter "from" must be on or before "to"');
}

$events = [];

$sessionStmt = $conn->prepare("
    SELECT session_id, title, session_type, session_date, status, venue,
           actual_start_time, actual_end_time, external_ref, source_system, synced_at
    FROM sessions
    WHERE session_status = 'Active'
      AND status != 'Inactive'
      AND session_date BETWEEN ? AND ?
    ORDER BY session_date ASC, actual_start_time ASC
");
$sessionStmt->bind_param('ss', $from, $to);
$sessionStmt->execute();
$sessionResult = $sessionStmt->get_result();

while ($row = $sessionResult->fetch_assoc()) {
    $events[] = [
        'id' => 'sess_' . $row['session_id'],
        'category' => 'session',
        'title' => $row['title'],
        'start' => $row['session_date'],
        'type' => $row['session_type'],
        'status' => $row['status'],
        'venue' => $row['venue'],
        'start_time' => $row['actual_start_time'],
        'end_time' => $row['actual_end_time'],
        'external_ref' => $row['external_ref'],
        'source_system' => $row['source_system'],
        'synced_at' => $row['synced_at'],
    ];
}
$sessionStmt->close();

$deadlineStmt = $conn->prepare("
    SELECT deadline_id, title, description, due_date, priority, status
    FROM deadlines
    WHERE status != 'Completed'
      AND DATE(due_date) BETWEEN ? AND ?
    ORDER BY due_date ASC
");
$deadlineStmt->bind_param('ss', $from, $to);
$deadlineStmt->execute();
$deadlineResult = $deadlineStmt->get_result();

while ($row = $deadlineResult->fetch_assoc()) {
    $events[] = [
        'id' => 'dead_' . $row['deadline_id'],
        'category' => 'deadline',
        'title' => $row['title'],
        'start' => date('Y-m-d', strtotime($row['due_date'])),
        'due_at' => $row['due_date'],
        'priority' => $row['priority'],
        'status' => $row['status'],
        'description' => $row['description'],
    ];
}
$deadlineStmt->close();

integrationFinishRequest(200);
integrationJsonSuccess([
    'term' => [
        'start' => INTEGRATION_TERM_START,
        'end' => INTEGRATION_TERM_END,
    ],
    'from' => $from,
    'to' => $to,
    'count' => count($events),
    'events' => $events,
    'request_id' => $GLOBALS['integration_request_id'],
]);
