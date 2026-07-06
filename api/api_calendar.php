<?php
// api_calendar.php
session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

$conn = getDBConnection();
$events = [];

// 1. Sessions
$res = $conn->query("SELECT session_id, title, session_date as start, session_type as type, 'session' as category FROM sessions WHERE status != 'Inactive'");
while ($row = $res->fetch_assoc()) {
    $events[] = [
        'id' => 'sess_' . $row['session_id'],
        'title' => $row['title'],
        'start' => $row['start'],
        'className' => 'bg-blue-100 text-blue-800 border-l-4 border-blue-600',
        'extendedProps' => ['type' => $row['type'], 'category' => 'session']
    ];
}

// 2. Deadlines
$res = $conn->query("SELECT deadline_id, title, due_date as start, priority, 'deadline' as category FROM deadlines WHERE status != 'Completed'");
while ($row = $res->fetch_assoc()) {
    $color = $row['priority'] === 'High' ? 'bg-red-100 text-red-800 border-red-600' : 'bg-yellow-100 text-yellow-800 border-yellow-600';
    $events[] = [
        'id' => 'dead_' . $row['deadline_id'],
        'title' => $row['title'],
        'start' => date('Y-m-d', strtotime($row['start'])), // FullCal expects Y-m-d
        'className' => $color . ' border-l-4',
        'extendedProps' => ['priority' => $row['priority'], 'category' => 'deadline']
    ];
}

// 3. Reminders (For current user)
$userId = $_SESSION['user_id'] ?? 0;
if ($userId) {
    $stmt = $conn->prepare("SELECT reminder_id, title, reminder_date as start, 'reminder' as category FROM reminders WHERE created_by = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $events[] = [
            'id' => 'rem_' . $row['reminder_id'],
            'title' => '🔔 ' . $row['title'],
            'start' => date('Y-m-d', strtotime($row['start'])),
            'className' => 'bg-purple-100 text-purple-800 border-l-4 border-purple-600',
            'extendedProps' => ['category' => 'reminder']
        ];
    }
}

echo json_encode(['success' => true, 'events' => $events]);
$conn->close();
?>