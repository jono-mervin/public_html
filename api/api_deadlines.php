<?php
// api_deadlines.php
session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Only allow GET requests (View Only)
if ($method === 'GET') {
    // Fetch deadlines from both 'deadlines' table and 'agenda_items'
    // Combine them into a single list
    
    // Check if priority column exists in agenda_items (it was recently added)
    $hasPriority = false;
    $checkCol = $conn->query("SHOW COLUMNS FROM agenda_items LIKE 'priority'");
    if ($checkCol && $checkCol->num_rows > 0) {
        $hasPriority = true;
    }

    $priorityField = $hasPriority ? "ai.priority" : "'Medium'";

    $userRole = $_SESSION['user_role'] ?? 'User - Committee';
    $userId = $_SESSION['user_id'] ?? 0;

    $isAdminOrStaff = ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0) || strcasecmp($userRole, 'Admin') === 0 || strcasecmp($userRole, 'Staff') === 0);

    if ($isAdminOrStaff) {
        // Admin and Staff see EVERYTHING
        $sql = "
            SELECT d.deadline_id as id, d.title, d.description, d.due_date, d.priority, d.status, 'Task' as source, u.user_name as assigned_to FROM deadlines d LEFT JOIN users u ON d.assigned_to = u.user_id WHERE d.description NOT LIKE '%(Linked to Agenda Item ID:%'
            UNION ALL
            SELECT ai.agenda_item_id as id, ai.item_title as title, ai.item_description as description, ai.deadline as due_date, $priorityField as priority, ai.status, CONCAT('Agenda Item (', s.title, ')') as source, u.user_name as assigned_to FROM agenda_items ai INNER JOIN sessions s ON ai.session_id = s.session_id LEFT JOIN users u ON ai.assigned_to = u.user_id WHERE ai.deadline IS NOT NULL
            UNION ALL
            -- 1. Completed Sessions -> Upcoming Reminder
            SELECT s.session_id as id, 'Upcoming Session Reminder' as title, 
                   CONCAT('Reminder: ', s.title, ' (', s.session_type, ') will start on ', DATE_FORMAT(s.session_date, '%b %d, %y'), ' at ', COALESCE(TIME_FORMAT(s.actual_start_time, '%r'), 'TBD'), ' at ', COALESCE(s.venue, 'TBD'), '.') as description, 
                   CONCAT(s.session_date, ' ', COALESCE(s.actual_start_time, '00:00:00')) as due_date, 'High' as priority, s.status, 'Upcoming' as source, COALESCE(s.presiding_officer, 'TBD') as assigned_to 
            FROM sessions s 
            WHERE s.status IN ('Scheduled', 'Ongoing')
            AND s.actual_start_time IS NOT NULL AND s.venue IS NOT NULL AND s.venue != '' 
            AND s.presiding_officer IS NOT NULL AND s.presiding_officer != ''
            AND (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) > 0
            AND (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) > 0
            AND (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) > 0
            UNION ALL
            -- 2. Incomplete Sessions -> Action Required (Consolidated)
            SELECT s.session_id as id, 'Action Required: Incomplete Session' as title, 
                   CONCAT('Session \"', s.title, '\" is missing: ',
                        TRIM(BOTH ', ' FROM CONCAT(
                            IF(COALESCE(s.venue, '') = '', 'venue, ', ''),
                            IF(s.actual_start_time IS NULL, 'time, ', ''),
                            IF(COALESCE(s.presiding_officer, '') = '', 'presiding officer, ', ''),
                            IF((SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) = 0, 'agenda, ', ''),
                            IF((SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) = 0, 'agenda items, ', ''),
                            IF((SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) = 0, 'documents, ', '')
                        ))
                   ) as description,
                   CONCAT(s.session_date, ' 00:00:00') as due_date, 'Urgent' as priority, 'Incomplete' as status, 'Session Requirement' as source, NULL as assigned_to 
            FROM sessions s 
            WHERE s.status IN ('Scheduled', 'Ongoing')
            AND (
                s.actual_start_time IS NULL OR COALESCE(s.venue, '') = '' 
                OR COALESCE(s.presiding_officer, '') = ''
                OR (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) = 0
                OR (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) = 0
                OR (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) = 0
            )
            ORDER BY due_date ASC
        ";
        $result = $conn->query($sql);
    } else {
        // Staff/User only sees what is assigned to them + general sessions
        $sql = "
            SELECT d.deadline_id as id, d.title, d.description, d.due_date, d.priority, d.status, 'Task' as source, u.user_name as assigned_to FROM deadlines d LEFT JOIN users u ON d.assigned_to = u.user_id WHERE d.assigned_to = ? AND d.description NOT LIKE '%(Linked to Agenda Item ID:%'
            UNION ALL
            SELECT ai.agenda_item_id as id, ai.item_title as title, ai.item_description as description, ai.deadline as due_date, $priorityField as priority, ai.status, CONCAT('Agenda Item (', s.title, ')') as source, u.user_name as assigned_to FROM agenda_items ai INNER JOIN sessions s ON ai.session_id = s.session_id LEFT JOIN users u ON ai.assigned_to = u.user_id WHERE ai.deadline IS NOT NULL AND ai.assigned_to = ?
            UNION ALL
            -- Show Legislative Sessions only if they are 'Ready' (Complete) or if user is assigned
            SELECT s.session_id as id, s.title as title, 
                   CONCAT('Session Type: ', s.session_type, ' | Venue: ', COALESCE(s.venue, 'TBD')) as description, 
                   CONCAT(s.session_date, ' ', COALESCE(s.actual_start_time, '00:00:00')) as due_date, 
                   'High' as priority, s.status, 'Legislative Session' as source, 
                   COALESCE(s.presiding_officer, 'TBD') as assigned_to 
            FROM sessions s 
            WHERE s.status != 'Inactive'
            AND (
                -- Show if session is 'Ready'
                (s.actual_start_time IS NOT NULL AND s.venue IS NOT NULL AND s.venue != '' 
                AND s.presiding_officer IS NOT NULL AND s.presiding_officer != ''
                AND (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) > 0
                AND (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) > 0
                AND (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) > 0)
                OR
                -- OR if user is specifically assigned to it
                EXISTS (SELECT 1 FROM session_assignments sa WHERE sa.session_id = s.session_id AND sa.user_id = ?)
            )
            ORDER BY due_date ASC
        ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iii", $userId, $userId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    
    if (!$result) {
        // Fallback if query fails (e.g. schema mismatch)
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }

    $deadlines = [];
    while ($row = $result->fetch_assoc()) {
        // Normalizing data types
        $row['id'] = intval($row['id']);
        $deadlines[] = $row;
    }
    
    echo json_encode(['success' => true, 'deadlines' => $deadlines]);

} else {
    // Block all other methods (CRUD removal)
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Deadlines are view-only.']);
}

$conn->close();
?>