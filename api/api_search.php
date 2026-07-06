<?php
// api/api_search.php
// Disable error display to prevent HTML output breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../config/config.php';
session_start();

if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();

header('Content-Type: application/json');

$query = isset($_GET['q']) ? trim($_GET['q']) : '';

if (empty($query)) {
    echo json_encode(['success' => true, 'results' => []]);
    exit;
}

$searchTerm = "%$query%";
$results = [];

try {
    // 1. Sessions Search - Fixed columns: title, venue
    $stmt = $conn->prepare("SELECT session_id, title, venue FROM sessions WHERE (title LIKE ? OR venue LIKE ?) AND status != 'Inactive' LIMIT 5");
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $sessionRes = $stmt->get_result();
    while ($row = $sessionRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Session',
            'id' => $row['session_id'],
            'title' => $row['title'],
            'subtitle' => ($row['venue'] ? $row['venue'] : 'System Session'),
            'icon' => 'bi-calendar-event',
            'action' => 'session',
            'data' => $row
        ];
    }

    // 2. Agendas
    $stmt = $conn->prepare("SELECT a.agenda_id, a.agenda_title FROM agendas a JOIN sessions s ON a.session_id = s.session_id WHERE a.agenda_title LIKE ? AND s.status != 'Inactive' LIMIT 5");
    $stmt->bind_param("s", $searchTerm);
    $stmt->execute();
    $agendaRes = $stmt->get_result();
    while ($row = $agendaRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Agenda',
            'id' => $row['agenda_id'],
            'title' => $row['agenda_title'],
            'subtitle' => 'Legislative Agenda',
            'icon' => 'bi-journal-text',
            'action' => 'agenda',
            'data' => $row
        ];
    }

    // 3. Agenda Items
    $stmt = $conn->prepare("SELECT ai.agenda_item_id, ai.item_title, ai.item_description FROM agenda_items ai JOIN sessions s ON ai.session_id = s.session_id WHERE (ai.item_title LIKE ? OR ai.item_description LIKE ?) AND s.status != 'Inactive' LIMIT 5");
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $itemRes = $stmt->get_result();
    while ($row = $itemRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Agenda Item',
            'id' => $row['agenda_item_id'],
            'title' => $row['item_title'],
            'subtitle' => 'Agenda Topic/Action',
            'icon' => 'bi-list-check',
            'action' => 'agenda_item',
            'data' => $row
        ];
    }

    // 4. AI Documents
    $stmt = $conn->prepare("SELECT id, filename, summary, classification FROM ai_documents WHERE filename LIKE ? OR summary LIKE ? OR classification LIKE ? LIMIT 10");
    $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
    $stmt->execute();
    $docRes = $stmt->get_result();
    while ($row = $docRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Document',
            'id' => $row['id'],
            'title' => $row['filename'],
            'subtitle' => $row['classification'] ?? 'AI Classified Document',
            'icon' => 'bi-file-earmark-pdf',
            'action' => 'document',
            'data' => $row
        ];
    }

    // 5. Announcements
    $stmt = $conn->prepare("SELECT announcement_id, title, content FROM announcements WHERE title LIKE ? OR content LIKE ? LIMIT 10");
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $announcementRes = $stmt->get_result();
    while ($row = $announcementRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Announcement',
            'id' => $row['announcement_id'],
            'title' => $row['title'],
            'subtitle' => 'System Announcement',
            'icon' => 'bi-megaphone',
            'action' => 'announcement',
            'data' => $row
        ];
    }

    // 6. Deadlines
    $stmt = $conn->prepare("SELECT deadline_id, title, description FROM deadlines WHERE title LIKE ? OR description LIKE ? LIMIT 10");
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $deadlineRes = $stmt->get_result();
    while ($row = $deadlineRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Deadline',
            'id' => $row['deadline_id'],
            'title' => $row['title'],
            'subtitle' => 'System Deadline',
            'icon' => 'bi-clock-history',
            'action' => 'deadline',
            'data' => $row
        ];
    }

    // 7. Personal Notes (Calendar)
    $stmt = $conn->prepare("SELECT note_id, note, note_date FROM user_notes WHERE note LIKE ? LIMIT 10");
    $stmt->bind_param("s", $searchTerm);
    $stmt->execute();
    $noteRes = $stmt->get_result();
    while ($row = $noteRes->fetch_assoc()) {
        $results[] = [
            'type' => 'Note',
            'id' => $row['note_id'],
            'title' => (strlen($row['note']) > 50 ? substr($row['note'], 0, 50) . '...' : $row['note']),
            'subtitle' => 'Personal Note | ' . $row['note_date'],
            'icon' => 'bi-sticky',
            'action' => 'note',
            'data' => $row
        ];
    }

    // 8. Reminders
    $stmt = $conn->prepare("SELECT batch_id, title, message FROM reminder_batches WHERE title LIKE ? OR message LIKE ? LIMIT 10");
    if ($stmt) {
        $stmt->bind_param("ss", $searchTerm, $searchTerm);
        $stmt->execute();
        $reminderRes = $stmt->get_result();
        while ($row = $reminderRes->fetch_assoc()) {
            $results[] = [
                'type' => 'Reminder',
                'id' => $row['batch_id'],
                'title' => $row['title'],
                'subtitle' => 'System Reminder',
                'icon' => 'bi-alarm',
                'action' => 'reminder',
                'data' => $row
            ];
        }
    }

    echo json_encode(['success' => true, 'results' => $results]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Search error: ' . $e->getMessage()]);
}

$conn->close();
