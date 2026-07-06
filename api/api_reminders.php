<?php
// api_reminders.php
// Error handling for production
error_reporting(0);
ini_set('display_errors', 0);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
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
$currentUserId = $_SESSION['user_id'] ?? 1;

try {
    switch ($method) {
        case 'GET':
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            $userId = $currentUserId;

            $isAdmin = ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0) || strcasecmp($userRole, 'Admin') === 0);
            $isNotificationsView = (isset($_GET['view']) && $_GET['view'] === 'notifications');

            // Fetch persistable read status for system-generated items (IDs with prefixes)
            $readSystemIds = [];
            $resRead = $conn->query("SELECT message FROM notifications WHERE user_id = $userId AND type = 'SystemRead'");
            if ($resRead) {
                while ($rd = $resRead->fetch_assoc()) {
                    $readSystemIds[] = $rd['message'];
                }
            }

            // Notification bell & "All Notifications" page:
            // Show only user-specific notifications (reminder batches the user is a recipient of + direct notifications table),
            // and exclude system-generated reminders (sessions/deadlines monitoring) which belong to the Reminders module.
            if ($isNotificationsView) {
                $reminders = [];

                // 1) Reminder batches the user is a recipient of (per-user notifications)
                $bellSql = "
                    SELECT 
                        rb.batch_id as reminder_id,
                        rb.title,
                        rb.message,
                        rb.reminder_date,
                        rb.created_by,
                        rb.related_type,
                        rb.related_id,
                        rb.status as batch_status,
                        rb.created_at,
                        rr.status as read_status,
                        rr.read_at,
                        u.user_role as creator_role,
                        u.user_name as creator_name,
                        rb.target_roles
                    FROM reminder_batches rb
                    INNER JOIN reminder_recipients rr ON rb.batch_id = rr.batch_id AND rr.user_id = ?
                    LEFT JOIN users u ON rb.created_by = u.user_id
                    WHERE rb.admin_deleted = 0
                    AND (rb.status = 'Sent' OR rb.reminder_date <= NOW())
                    ORDER BY rb.batch_id DESC
                    LIMIT 50
                ";
                $bellStmt = $conn->prepare($bellSql);
                if ($bellStmt) {
                    $bellStmt->bind_param("i", $userId);
                }

                if (!empty($bellStmt)) {
                    $bellStmt->execute();
                    $bellRes = $bellStmt->get_result();
                    if ($bellRes) {
                        while ($row = $bellRes->fetch_assoc()) {
                            $reminders[] = [
                                'reminder_id' => $row['reminder_id'],
                                'title' => $row['title'],
                                'message' => $row['message'],
                                'reminder_date' => $row['reminder_date'],
                                'created_by' => $row['created_by'],
                                'created_at' => $row['created_at'],
                                'is_read' => isset($row['read_status']) ? ($row['read_status'] === 'Read' ? 1 : 0) : 0,
                                'read_at' => $row['read_at'] ?? null,
                                'related_type' => $row['related_type'],
                                'related_id' => $row['related_id'],
                                'status' => $row['batch_status'],
                                'creator_role' => $row['creator_role'] ?? null,
                                'creator_name' => $row['creator_name'] ?? null,
                                'target_roles' => $row['target_roles'] ?? null,
                                'recipient_names' => null,
                                'source' => 'Reminder'
                            ];
                        }
                    }
                    $bellStmt->close();
                }

                // 2) Dedicated notifications table (agenda status, etc.)
                $notifSql = "SELECT * FROM notifications WHERE user_id = ? AND type <> 'SystemRead' ORDER BY created_at DESC LIMIT 50";
                $notifStmt = $conn->prepare($notifSql);
                if ($notifStmt) {
                    $notifStmt->bind_param("i", $userId);
                    $notifStmt->execute();
                    $notifRes = $notifStmt->get_result();

                    if ($notifRes) {
                        while ($row = $notifRes->fetch_assoc()) {
                            $reminders[] = [
                                'reminder_id' => 'notif_' . $row['notification_id'],
                                'title' => $row['type'] ?? 'Notification',
                                'message' => $row['message'],
                                'reminder_date' => $row['created_at'],
                                'created_at' => $row['created_at'],
                                'is_read' => intval($row['is_read']),
                                'read_at' => $row['is_read'] ? $row['created_at'] : null,
                                'related_type' => $row['type'],
                                'related_id' => null,
                                'status' => 'Sent',
                                'creator_role' => 'System',
                                'creator_name' => 'System',
                                'recipient_names' => 'You',
                                'source' => 'Notification',
                                'priority' => 'Medium',
                                'link' => $row['link'] ?? null
                            ];
                        }
                    }
                    $notifStmt->close();
                }

                // Sort newest first by created_at (fallback to reminder_date)
                usort($reminders, function ($a, $b) {
                    $timeA = !empty($a['created_at']) ? strtotime($a['created_at']) : strtotime($a['reminder_date']);
                    $timeB = !empty($b['created_at']) ? strtotime($b['created_at']) : strtotime($b['reminder_date']);
                    return $timeB - $timeA;
                });

                echo json_encode(['success' => true, 'reminders' => $reminders]);
                break;
            }

            if ($isNotificationsView) {
                // Bell view for Admins: See things you are a recipient of OR that you created.
                // We show anything already "Sent" or whose reminder date has passed.
                // IGNORE admin_deleted here so history stays in the bell.
                $sql = "
                    SELECT 
                        rb.batch_id as reminder_id,
                        rb.title,
                        rb.message,
                        rb.reminder_date,
                        rb.created_by,
                        rb.related_type,
                        rb.related_id,
                        rb.status as batch_status,
                        rb.created_at,
                        rr.status as read_status,
                        rr.read_at,
                        u.user_role as creator_role,
                        u.user_name as creator_name,
                        rb.target_roles
                    FROM reminder_batches rb
                    LEFT JOIN reminder_recipients rr ON rb.batch_id = rr.batch_id AND rr.user_id = ?
                    LEFT JOIN users u ON rb.created_by = u.user_id
                    WHERE (rr.user_id IS NOT NULL OR rb.created_by = ?) 
                    AND (rb.status = 'Sent' OR rb.reminder_date <= NOW())
                    GROUP BY rb.batch_id
                    ORDER BY rb.batch_id DESC
                ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("ii", $userId, $userId);
            } else if ($isAdmin) {
                // Dashboard view for Admins: See everything but hide what was "deleted"
                $sql = "
                    SELECT 
                        rb.batch_id as reminder_id,
                        rb.title,
                        rb.message,
                        rb.reminder_date,
                        rb.created_by,
                        rb.related_type,
                        rb.related_id,
                        rb.status as batch_status,
                        rb.created_at,
                        CASE WHEN rr_self.status = 'Read' THEN 1 ELSE 0 END as is_read,
                        rr_self.read_at,
                        u.user_role as creator_role,
                        u.user_name as creator_name,
                        rb.target_roles,
                        GROUP_CONCAT(COALESCE(ru.user_name, ru.email)) as recipient_names
                    FROM reminder_batches rb
                    LEFT JOIN users u ON rb.created_by = u.user_id
                    LEFT JOIN reminder_recipients rr ON rb.batch_id = rr.batch_id
                    LEFT JOIN users ru ON rr.user_id = ru.user_id
                    LEFT JOIN reminder_recipients rr_self ON rb.batch_id = rr_self.batch_id AND rr_self.user_id = ?
                    WHERE rb.admin_deleted = 0
                    GROUP BY rb.batch_id
                    ORDER BY rb.batch_id DESC
                ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $currentUserId);
            } else {
                // Staff/User view: Only see what is assigned to you.
                // For the bell (isNotificationsView), we show "Sent" or due reminders.
                $filter = $isNotificationsView ? "AND (rb.status = 'Sent' OR rb.reminder_date <= NOW())" : "";
                $sql = "
                    SELECT 
                        rb.batch_id as reminder_id,
                        rb.title,
                        rb.message,
                        rb.reminder_date,
                        rb.created_by,
                        rb.related_type,
                        rb.related_id,
                        rb.status as batch_status,
                        rb.created_at,
                        rr.status as read_status,
                        rr.read_at,
                        u.user_role as creator_role,
                        u.user_name as creator_name,
                        rb.target_roles
                    FROM reminder_recipients rr
                    INNER JOIN reminder_batches rb ON rr.batch_id = rb.batch_id
                    LEFT JOIN users u ON rb.created_by = u.user_id
                    WHERE rr.user_id = ? $filter
                    ORDER BY rb.batch_id DESC
                ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $userId);
            }

            if (!$stmt) {
                throw new Exception($conn->error);
            }

            $stmt->execute();
            $result = $stmt->get_result();
            $reminders = [];

            while ($row = $result->fetch_assoc()) {
                // For Staff, filter out strictly "Admin side" notifications if they aren't explicit recipients
                if (strcasecmp($userRole, 'Staff') === 0 && !$isNotificationsView) {
                    $targets = $row['target_roles'] ?? '';
                    $isAdminOnly = (!empty($targets) && stripos($targets, 'Super Admin') !== false && stripos($targets, 'Staff') === false);
                    if ($isAdminOnly) continue;
                }

                // Map to expected format for frontend compatibility
                $reminders[] = [
                    'reminder_id' => $row['reminder_id'],
                    'title' => $row['title'],
                    'message' => $row['message'],
                    'reminder_date' => $row['reminder_date'],
                    'created_by' => $row['created_by'],
                    'created_at' => $row['created_at'],
                    'is_read' => isset($row['read_status']) ? ($row['read_status'] === 'Read' ? 1 : 0) : (isset($row['is_read']) ? intval($row['is_read']) : 0),
                    'read_at' => $row['read_at'] ?? null,
                    'related_type' => $row['related_type'],
                    'related_id' => $row['related_id'],
                    'status' => $row['batch_status'],
                    'creator_role' => $row['creator_role'],
                    'creator_name' => $row['creator_name'],
                    'target_roles' => $row['target_roles'] ?? null,
                    'recipient_names' => $row['recipient_names'] ?? null,
                    'source' => 'Reminder'
                ];
            }

            // Admins and Staff see these system-generated reminders
            $isAdmin = ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0) || strcasecmp($userRole, 'Admin') === 0);
            $isStaff = (strcasecmp($userRole, 'Staff') === 0);

            if ($isAdmin || $isStaff) {
                // --- FETCH DEADLINES AND AGENDA DEADLINES to include in Reminders ---
                if ($isAdmin) {
                    $deadlineSql = "SELECT d.deadline_id, d.title, d.description, d.due_date, d.status, d.created_at, u.user_name as creator_name, d.priority 
                                   FROM deadlines d 
                                   LEFT JOIN users u ON d.created_by = u.user_id
                                   WHERE d.status != 'Completed' AND d.due_date >= NOW()";
    
                    $dResult = $conn->query($deadlineSql);
                    if ($dResult) {
                        while ($row = $dResult->fetch_assoc()) {
                            $reminders[] = [
                                'reminder_id' => 'd_' . $row['deadline_id'],
                                'title' => 'Deadline: ' . $row['title'],
                                'message' => $row['description'],
                                'reminder_date' => $row['due_date'],
                                'created_by' => null,
                                'created_at' => $row['created_at'],
                                'is_read' => in_array('d_' . $row['deadline_id'], $readSystemIds) ? 1 : 0,
                                'read_at' => null,
                                'related_type' => 'Deadline',
                                'related_id' => $row['deadline_id'],
                                'status' => $row['status'],
                                'creator_role' => 'System',
                                'creator_name' => $row['creator_name'] ?? 'System',
                                'recipient_names' => 'All Staff',
                                'source' => 'Deadline',
                                'priority' => $row['priority'] ?? 'Medium'
                            ];
                        }
                    }
                }

                if ($isAdmin) {
                    // 2. Fetch from agenda_items table (Active Sessions only)
                    $agendaSql = "SELECT ai.agenda_item_id, ai.item_title as title, ai.item_description as description, ai.deadline, ai.status, ai.created_at, ai.priority
                                  FROM agenda_items ai 
                                  JOIN sessions s ON ai.session_id = s.session_id
                                  WHERE ai.deadline IS NOT NULL AND ai.deadline >= NOW() AND s.status != 'Inactive' AND ai.status != 'Completed'";
    
                    $aResult = $conn->query($agendaSql);
                    if ($aResult) {
                        while ($row = $aResult->fetch_assoc()) {
                            $reminders[] = [
                                'reminder_id' => 'a_' . $row['agenda_item_id'],
                                'title' => 'Agenda Deadline: ' . $row['title'],
                                'message' => $row['description'],
                                'reminder_date' => $row['deadline'],
                                'created_by' => null,
                                'created_at' => $row['created_at'],
                                'is_read' => in_array('a_' . $row['agenda_item_id'], $readSystemIds) ? 1 : 0,
                                'read_at' => null,
                                'related_type' => 'AgendaItem',
                                'related_id' => $row['agenda_item_id'],
                                'status' => $row['status'] ?? 'Scheduled',
                                'creator_role' => 'System',
                                'creator_name' => 'System',
                                'recipient_names' => 'Council',
                                'source' => 'AgendaDeadline',
                                'priority' => $row['priority'] ?? 'Medium'
                            ];
                        }
                    }
                }

                // 3. Fetch from sessions table (Incomplete Session Records)
                $incompleteSessionSql = "
                    SELECT s.session_id, s.title, s.session_date, s.created_at, s.actual_start_time, s.venue, s.presiding_officer,
                           (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) as agenda_count,
                           (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) as item_count,
                           (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) as doc_count
                    FROM sessions s
                    WHERE s.status = 'Scheduled'
                    AND (
                        s.actual_start_time IS NULL OR s.venue IS NULL OR s.venue = '' 
                        OR s.presiding_officer IS NULL OR s.presiding_officer = ''
                        OR (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) = 0
                        OR (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) = 0
                        OR (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) = 0
                    )";

                $isResult = $conn->query($incompleteSessionSql);
                if ($isResult) {
                    while ($row = $isResult->fetch_assoc()) {
                        $missing = [];
                        if (empty($row['venue'])) $missing[] = "venue";
                        if (empty($row['actual_start_time'])) $missing[] = "time";
                        if (empty($row['presiding_officer'])) $missing[] = "presiding officer";
                        if ($row['agenda_count'] == 0) $missing[] = "agenda";
                        if ($row['item_count'] == 0) $missing[] = "agenda items";
                        if ($row['doc_count'] == 0) $missing[] = "documents";

                        $missingStr = implode(", ", $missing);
                        if (count($missing) > 1) {
                            $lastCommaPos = strrpos($missingStr, ", ");
                            $missingStr = substr_replace($missingStr, " and ", $lastCommaPos, 2);
                        }

                        $reminders[] = [
                            'reminder_id' => 's_inc_' . $row['session_id'],
                            'title' => 'Action Required: ' . $row['title'],
                            'message' => 'This session is incomplete. Please specify the ' . $missingStr . '.',
                            'reminder_date' => $row['session_date'] . (!empty($row['actual_start_time']) ? ' ' . $row['actual_start_time'] : ' 00:00:00'),
                            'created_at' => $row['created_at'],
                            'is_read' => in_array('s_inc_' . $row['session_id'], $readSystemIds) ? 1 : 0,
                            'related_type' => 'Session',
                            'related_id' => $row['session_id'],
                            'status' => 'Incomplete',
                            'creator_role' => 'System',
                            'creator_name' => 'System',
                            'recipient_names' => 'Admins',
                            'source' => 'System',
                            'priority' => 'High'
                        ];
                    }
                }

            }
            // ---------------------------------------------------------------------

            // 5. Fetch from sessions table (Completed Sessions -> Upcoming Reminder) - VISIBLE TO ALL ROLES
            $completedSessionSql = "
                SELECT s.session_id, s.title, s.session_date, s.created_at, s.actual_start_time, s.venue, s.session_type
                FROM sessions s
                WHERE s.status IN ('Scheduled', 'Ongoing')
                AND s.actual_start_time IS NOT NULL AND s.venue IS NOT NULL AND s.venue != '' 
                AND s.presiding_officer IS NOT NULL AND s.presiding_officer != ''
                AND (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) > 0
                AND (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) > 0
                AND (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) > 0
            ";

            $csResult = $conn->query($completedSessionSql);
            if ($csResult) {
                while ($row = $csResult->fetch_assoc()) {
                    $timeStr = !empty($row['actual_start_time']) ? date("h:i A", strtotime($row['actual_start_time'])) : 'TBD';
                    $dateStr = date("M d, Y", strtotime($row['session_date']));
                    
                    // If user has a SystemRead marker for this session reminder, skip it entirely
                    if (in_array('s_inc_' . $row['session_id'], $readSystemIds)) {
                        continue;
                    }
                    
                    $reminders[] = [
                        'reminder_id' => 's_ready_' . $row['session_id'],
                        'title' => 'Upcoming Session Reminder',
                        'message' => 'Reminder: ' . $row['title'] . ' (' . ($row['session_type'] ?? 'Regular Session') . ') will start on ' . $dateStr . ' at ' . $timeStr . ' at ' . ($row['venue'] ?? 'TBD') . '.',
                        'reminder_date' => $row['session_date'],
                        'created_at' => $row['created_at'],
                        'is_read' => in_array('s_ready_' . $row['session_id'], $readSystemIds) ? 1 : 0,
                        'related_type' => 'Session',
                        'related_id' => $row['session_id'],
                        'status' => 'Ready',
                        'creator_role' => 'System',
                        'creator_name' => 'System',
                        'recipient_names' => 'Everyone',
                        'source' => 'System',
                        'priority' => 'Medium'
                    ];
                }
            }
            // ---------------------------------------------------------------------

            // 6. Fetch from the dedicated 'notifications' table - used for Agendas (Revision Needed / Approved)
            // Note: Exclude internal 'SystemRead' records which are only used to track read state
            $notifSql = "SELECT * FROM notifications WHERE user_id = ? AND type <> 'SystemRead' ORDER BY created_at DESC LIMIT 50";
            $notifStmt = $conn->prepare($notifSql);
            $notifStmt->bind_param("i", $userId);
            $notifStmt->execute();
            $notifRes = $notifStmt->get_result();
            if ($notifRes) {
                while ($row = $notifRes->fetch_assoc()) {
                    // If user has a SystemRead marker for this ready reminder, skip it entirely
                    if (in_array('s_ready_' . $row['session_id'], $readSystemIds)) {
                        continue;
                    }

                    $reminders[] = [
                        'reminder_id' => 'notif_' . $row['notification_id'],
                        'title' => $row['type'] ?? 'Notification',
                        'message' => $row['message'],
                        'reminder_date' => $row['created_at'],
                        'created_at' => $row['created_at'],
                        'is_read' => intval($row['is_read']),
                        'read_at' => $row['is_read'] ? $row['created_at'] : null,
                        'related_type' => $row['type'],
                        'related_id' => null,
                        'status' => 'Sent',
                        'creator_role' => 'System',
                        'creator_name' => 'System',
                        'recipient_names' => 'You',
                        'source' => 'Notification',
                        'priority' => 'Medium',
                        'link' => $row['link'] ?? null
                    ];
                }
            }
            // ---------------------------------------------------------------------

            // Re-sort the combined array by created_at DESC (Newest Sent first)
            usort($reminders, function ($a, $b) {
                $timeA = !empty($a['created_at']) ? strtotime($a['created_at']) : strtotime($a['reminder_date']);
                $timeB = !empty($b['created_at']) ? strtotime($b['created_at']) : strtotime($b['reminder_date']);
                return $timeB - $timeA;
            });

            echo json_encode(['success' => true, 'reminders' => $reminders]);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';

            // Check if this is a role-based reminder (for sessions/broadcasts)
            if (isset($input['role_based']) && ($input['role_based'] === true || $input['role_based'] === 'true' || $input['role_based'] == 1)) {
                // Only Administrator can send role-based reminders
                $currentRole = $userRole;
                if (strcasecmp($currentRole, 'Super Admin') !== 0 && strcasecmp($currentRole, 'Admin') !== 0) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only Admins can send role-based reminders']);
                    exit;
                }

                if (empty($input['title']) || empty($input['reminder_date'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                    exit;
                }

                // Determine target roles
                $targetRoles = 'Super Admin,Admin,Staff'; // Default for role-based
                if (isset($input['target_roles'])) {
                    $targetRoles = $input['target_roles'];
                }

                // Create reminder batch
                $relatedType = isset($input['related_type']) ? $input['related_type'] : 'Session';
                $relatedId = isset($input['related_id']) ? intval($input['related_id']) : null;
                $message = isset($input['message']) ? $input['message'] : '';

                $status = isset($input['status']) ? $input['status'] : 'Scheduled';
                $stmt = $conn->prepare("
                    INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");

                if (!$stmt) {
                    throw new Exception($conn->error);
                }

                $stmt->bind_param(
                    "isssisss",
                    $currentUserId,
                    $input['title'],
                    $message,
                    $relatedType,
                    $relatedId,
                    $targetRoles,
                    $input['reminder_date'],
                    $status
                );

                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }

                $batchId = $conn->insert_id;

                // Create recipient records for targeted roles
                $rolesArray = explode(',', $targetRoles);
                $rolesArray = array_map('trim', $rolesArray);
                $placeholders = implode(',', array_fill(0, count($rolesArray), '?'));
                
                $stmt = $conn->prepare("
                    INSERT INTO reminder_recipients (batch_id, user_id, status)
                    SELECT ?, user_id, 'Pending'
                    FROM users
                    WHERE status = 'Active' AND user_role IN ($placeholders)
                ");

                if (!$stmt) {
                    throw new Exception($conn->error);
                }

                $bindTypes = "i" . str_repeat("s", count($rolesArray));
                $bindParams = array_merge([$batchId], $rolesArray);
                $stmt->bind_param($bindTypes, ...$bindParams);

                if ($stmt->execute()) {
                    $count = $stmt->affected_rows;
                    echo json_encode(['success' => true, 'message' => "Notification sent to $count recipients successfully", 'count' => $count, 'batch_id' => $batchId]);
                } else {
                    throw new Exception($stmt->error);
                }
                break;
            }

            // Regular reminder creation (non-role-based)
            if ($userRole === 'Staff') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Staff cannot create personal reminders']);
                exit;
            }

            if (empty($input['title']) || empty($input['reminder_date'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing fields']);
                exit;
            }

            // For personal reminders, create batch and single recipient
            $relatedType = isset($input['related_type']) ? $input['related_type'] : 'Other';
            $relatedId = isset($input['related_id']) ? intval($input['related_id']) : null;
            $targetRoles = isset($input['target_roles']) ? $input['target_roles'] : 'User';
            $assignedTo = !empty($input['assigned_to']) ? intval($input['assigned_to']) : $currentUserId;

            // Create reminder batch
            $status = isset($input['status']) ? $input['status'] : 'Scheduled';
            $stmt = $conn->prepare("
                INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            if (!$stmt) {
                throw new Exception($conn->error);
            }

            $message = isset($input['message']) ? $input['message'] : '';
            $stmt->bind_param(
                "isssisss",
                $currentUserId,
                $input['title'],
                $message,
                $relatedType,
                $relatedId,
                $targetRoles,
                $input['reminder_date'],
                $status
            );

            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }

            $batchId = $conn->insert_id;

            // Create recipient record
            $stmt = $conn->prepare("
                INSERT INTO reminder_recipients (batch_id, user_id, status)
                VALUES (?, ?, 'Pending')
            ");

            if (!$stmt) {
                throw new Exception($conn->error);
            }

            $stmt->bind_param("ii", $batchId, $assignedTo);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Notification sent successfully', 'batch_id' => $batchId]);
            } else {
                throw new Exception($stmt->error);
            }
            break;

        case 'PUT':
            // Mark reminder as read / update / resend / bulk clear / send system reminder
            $input = json_decode(file_get_contents('php://input'), true);

            if (empty($input['action']) ||
                (!isset($input['reminder_id']) && !in_array($input['action'], ['clear_all_recipients', 'send_incomplete_session'], true))) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                exit;
            }

            $action = $input['action'];
            $batchId = isset($input['reminder_id']) ? intval($input['reminder_id']) : 0;

            // Clear all reminder_recipients rows AND per-user notifications for current user (used by "Clear All" in bell / notifications)
            if ($action === 'clear_all_recipients') {
                // 1) Remove reminder_recipients for this user
                $stmt = $conn->prepare("DELETE FROM reminder_recipients WHERE user_id = ?");
                if (!$stmt) {
                    throw new Exception($conn->error);
                }
                $stmt->bind_param("i", $currentUserId);
                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
                $stmt->close();

                // 2) Remove entries from notifications table for this user (except internal SystemRead markers)
                $stmt = $conn->prepare("DELETE FROM notifications WHERE user_id = ? AND type <> 'SystemRead'");
                if (!$stmt) {
                    throw new Exception($conn->error);
                }
                $stmt->bind_param("i", $currentUserId);
                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
                $stmt->close();

                echo json_encode(['success' => true, 'message' => 'All notifications cleared for this user']);
                break;
            }

            if ($action === 'mark_read') {
                $remId = $input['reminder_id'];
                if (strpos($remId, 'notif_') === 0) {
                    $notifId = intval(substr($remId, 6));
                    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?");
                    $stmt->bind_param("ii", $notifId, $currentUserId);
                } else if (strpos($remId, 's_') === 0 || strpos($remId, 'd_') === 0 || strpos($remId, 'a_') === 0) {
                    // Check if already exists to avoid duplicates
                    $chk = $conn->prepare("SELECT notification_id FROM notifications WHERE user_id = ? AND type = 'SystemRead' AND message = ?");
                    $chk->bind_param("is", $currentUserId, $remId);
                    $chk->execute();
                    if ($chk->get_result()->num_rows === 0) {
                        $stmt = $conn->prepare("INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (?, 'SystemRead', ?, 1, NOW())");
                        $stmt->bind_param("is", $currentUserId, $remId);
                    } else {
                        // Just a fallback
                        echo json_encode(['success' => true, 'message' => 'Already read']);
                        exit;
                    }
                } else {
                    $batchId = intval($remId);
                    // Update recipient status to Read
                    $stmt = $conn->prepare("
                        UPDATE reminder_recipients 
                        SET status = 'Read', read_at = NOW()
                        WHERE batch_id = ? AND user_id = ?
                    ");
                    $stmt->bind_param("ii", $batchId, $currentUserId);
                }

                if (!$stmt) {
                    throw new Exception($conn->error);
                }

                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Notification marked as read']);
                } else {
                    throw new Exception($stmt->error);
                }
            } else if ($action === 'send_incomplete_session') {
                // Create and immediately send a reminder batch for an incomplete session ("Action Required")
                if (empty($input['session_id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Session ID is required']);
                    exit;
                }

                $sessionId = intval($input['session_id']);

                $sSql = "
                    SELECT s.session_id, s.title, s.session_date, s.actual_start_time, s.venue, s.session_type,
                           s.created_at,
                           (SELECT COUNT(*) FROM agendas a WHERE a.session_id = s.session_id) as agenda_count,
                           (SELECT COUNT(*) FROM agenda_items ai WHERE ai.session_id = s.session_id) as item_count,
                           (SELECT COUNT(*) FROM session_documents sd WHERE sd.session_id = s.session_id) as doc_count
                    FROM sessions s
                    WHERE s.session_id = ?
                ";
                $sStmt = $conn->prepare($sSql);
                if (!$sStmt) {
                    throw new Exception($conn->error);
                }
                $sStmt->bind_param("i", $sessionId);
                $sStmt->execute();
                $sRes = $sStmt->get_result();
                if ($sRes->num_rows === 0) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Session not found']);
                    exit;
                }
                $row = $sRes->fetch_assoc();
                $sStmt->close();

                $missing = [];
                if (empty($row['venue'])) $missing[] = "venue";
                if (empty($row['actual_start_time'])) $missing[] = "time";
                if (empty($row['presiding_officer'])) $missing[] = "presiding officer";
                if ($row['agenda_count'] == 0) $missing[] = "agenda";
                if ($row['item_count'] == 0) $missing[] = "agenda items";
                if ($row['doc_count'] == 0) $missing[] = "documents";

                $missingStr = implode(", ", $missing);
                if (count($missing) > 1) {
                    $lastCommaPos = strrpos($missingStr, ", ");
                    $missingStr = substr_replace($missingStr, " and ", $lastCommaPos, 2);
                }

                $title = 'Action Required: ' . $row['title'];
                $message = 'This session is incomplete. Please specify the ' . $missingStr . '.';
                $reminderDate = date('Y-m-d H:i:s');
                $targetRoles = 'Super Admin,Admin,Staff';

                $stmt = $conn->prepare("
                    INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                    VALUES (?, ?, ?, 'Session', ?, ?, ?, 'Sent')
                ");
                if (!$stmt) {
                    throw new Exception($conn->error);
                }
                $stmt->bind_param("ississ", $currentUserId, $title, $message, $sessionId, $targetRoles, $reminderDate);
                if (!$stmt->execute()) {
                    throw new Exception($stmt->error);
                }
                $newBatchId = $conn->insert_id;
                $stmt->close();

                // Insert recipients for Administrator & Staff
                $rolesArray = array_map('trim', explode(',', $targetRoles));
                $placeholders = implode(',', array_fill(0, count($rolesArray), '?'));

                $insertStmt = $conn->prepare("
                    INSERT INTO reminder_recipients (batch_id, user_id, status)
                    SELECT ?, user_id, 'Pending'
                    FROM users
                    WHERE status = 'Active' AND user_role IN ($placeholders)
                ");
                if (!$insertStmt) {
                    throw new Exception($conn->error);
                }

                $bindTypes = "i" . str_repeat("s", count($rolesArray));
                $bindParams = array_merge([$newBatchId], $rolesArray);
                $insertStmt->bind_param($bindTypes, ...$bindParams);
                $insertStmt->execute();
                $totalRecipients = $insertStmt->affected_rows;
                $insertStmt->close();

                echo json_encode(['success' => true, 'message' => "Action Required reminder sent to {$totalRecipients} recipients"]);
            } else if ($action === 'update_reminder') {
                // Update reminder batch details
                $currentRole = $_SESSION['user_role'] ?? 'User - Committee';
                if (strcasecmp($currentRole, 'Super Admin') !== 0 && strcasecmp($currentRole, 'Admin') !== 0) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only Admins can edit reminders']);
                    exit;
                }

                if (empty($input['title']) || empty($input['reminder_date'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                    exit;
                }

                $message = isset($input['message']) ? $input['message'] : '';
                $targetRoles = isset($input['target_roles']) ? $input['target_roles'] : 'Super Admin,Admin,Staff,User - Committee';
                $relatedType = isset($input['related_type']) ? $input['related_type'] : 'System';
                $relatedId = isset($input['related_id']) ? intval($input['related_id']) : null;

                $stmt = $conn->prepare("
                     UPDATE reminder_batches 
                     SET title = ?, message = ?, reminder_date = ?, target_roles = ?, related_type = ?, related_id = ?
                     WHERE batch_id = ?
                 ");

                if (!$stmt) {
                    throw new Exception($conn->error);
                }

                $stmt->bind_param("sssssii", $input['title'], $message, $input['reminder_date'], $targetRoles, $relatedType, $relatedId, $batchId);

                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Reminder updated successfully']);
                } else {
                    throw new Exception($stmt->error);
                }
            } else if ($action === 'add_recipients') {
                // Add recipients to existing batch
                $currentRole = $_SESSION['user_role'] ?? 'User - Committee';
                if (strcasecmp($currentRole, 'Super Admin') !== 0 && strcasecmp($currentRole, 'Admin') !== 0) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only Admins can add recipients']);
                    exit;
                }

                if (empty($input['recipient_ids']) || !is_array($input['recipient_ids'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Invalid recipients']);
                    exit;
                }

                $recipientIds = $input['recipient_ids'];
                $addedCount = 0;

                $stmt = $conn->prepare("
                    INSERT IGNORE INTO reminder_recipients (batch_id, user_id, status)
                    VALUES (?, ?, 'Pending')
                ");

                if (!$stmt) {
                    throw new Exception($conn->error);
                }

                foreach ($recipientIds as $userId) {
                    $userId = intval($userId);
                    $stmt->bind_param("ii", $batchId, $userId);
                    if ($stmt->execute() && $stmt->affected_rows > 0) {
                        $addedCount++;
                    }
                }

                echo json_encode(['success' => true, 'message' => "$addedCount recipients added successfully"]);
            } else if ($action === 'send_batch') {
                // Manual re-send: Create a BRAND NEW batch so it always appears as a fresh notification,
                // even if the original was already unread/pending.
                $currentRole = $_SESSION['user_role'] ?? 'User - Committee';
                if (strcasecmp($currentRole, 'Super Admin') !== 0 && strcasecmp($currentRole, 'Admin') !== 0) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only Admins can trigger manual sends']);
                    exit;
                }

                // 1. Fetch the original batch details
                $batchStmt = $conn->prepare("SELECT title, message, related_type, related_id, target_roles FROM reminder_batches WHERE batch_id = ?");
                $batchStmt->bind_param("i", $batchId);
                $batchStmt->execute();
                $batchRes = $batchStmt->get_result();
                if ($batchRes->num_rows === 0) {
                    throw new Exception("Reminder batch not found");
                }
                $orig = $batchRes->fetch_assoc();
                $targetRoles = $orig['target_roles'] ?? 'Super Admin,Admin,Staff,User - Committee';

                // 2. Mark the original batch as 'Sent' (archived, stays visible but won't be confused with the new one)
                $markOld = $conn->prepare("UPDATE reminder_batches SET status = 'Sent' WHERE batch_id = ?");
                $markOld->bind_param("i", $batchId);
                $markOld->execute();

                // 3. Create a NEW batch with the same content, reminder_date = NOW()
                $newBatchStmt = $conn->prepare("
                    INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), 'Sent')
                ");
                if (!$newBatchStmt) throw new Exception($conn->error);

                $newBatchStmt->bind_param(
                    "isssis",
                    $currentUserId,
                    $orig['title'],
                    $orig['message'],
                    $orig['related_type'],
                    $orig['related_id'],
                    $targetRoles
                );
                if (!$newBatchStmt->execute()) throw new Exception($newBatchStmt->error);

                $newBatchId = $conn->insert_id;

                // 4. Insert recipients for the new batch based on target_roles
                $rolesArray = array_map('trim', explode(',', $targetRoles));
                $placeholders = implode(',', array_fill(0, count($rolesArray), '?'));

                $insertStmt = $conn->prepare("
                    INSERT INTO reminder_recipients (batch_id, user_id, status)
                    SELECT ?, user_id, 'Pending'
                    FROM users
                    WHERE status = 'Active' AND user_role IN ($placeholders)
                ");
                if (!$insertStmt) throw new Exception($conn->error);

                $bindTypes = "i" . str_repeat("s", count($rolesArray));
                $bindParams = array_merge([$newBatchId], $rolesArray);
                $insertStmt->bind_param($bindTypes, ...$bindParams);
                $insertStmt->execute();

                $totalRecipients = $insertStmt->affected_rows;

                echo json_encode(['success' => true, 'message' => "Reminder resent to $totalRecipients recipients successfully", 'new_batch_id' => $newBatchId]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid action']);
            }
            break;

        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['reminder_id'])) {
                throw new Exception("Missing reminder ID");
            }

            $remId = $input['reminder_id'];
            if (strpos($remId, 'notif_') === 0) {
                $notifId = intval(substr($remId, 6));
                $stmt = $conn->prepare("DELETE FROM notifications WHERE notification_id = ? AND user_id = ?");
                $stmt->bind_param("ii", $notifId, $currentUserId);
                $stmt->execute();
                echo json_encode(['success' => true, 'message' => 'Notification removed']);
                break;
            }

            $batchId = intval($remId);
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';

            // Check if reminder batch exists and get creator role
            $stmt = $conn->prepare("
                SELECT rb.*, u.user_role as creator_role 
                FROM reminder_batches rb 
                LEFT JOIN users u ON rb.created_by = u.user_id 
                WHERE rb.batch_id = ?
            ");
            $stmt->bind_param("i", $batchId);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res->num_rows === 0) {
                // If it was a prefixed ID (like d_ or a_) that isn't in notifications, we just return success
                // since these are virtual reminders anyway.
                echo json_encode(['success' => true, 'message' => 'Notification removed from view']);
                break;
            }
            $reminder = $res->fetch_assoc();

            if ($userRole === 'Staff') {
                // Staff can ONLY delete if created by Admin
                if ($reminder['creator_role'] !== 'Super Admin') {
                    throw new Exception("Staff can only delete notifications provided by the admin");
                }
            } else if ($userRole !== 'Super Admin' && $userRole !== 'Admin') {
                // Regular users can only delete their own
                if ($reminder['created_by'] != $currentUserId) {
                    throw new Exception("Unauthorized to delete this reminder");
                }
            }
            // Admin can delete anything

            $isAdmin = ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0) || strcasecmp($userRole, 'Admin') === 0);
            if ($isAdmin) {
                // Admins only "hide" the reminder from their panel
                // Updated: Hide ALL duplicates (same title/message/type/id) to avoid "whack-a-mole" deletion
                $stmt = $conn->prepare("
                    UPDATE reminder_batches 
                    SET admin_deleted = 1 
                    WHERE title = ? 
                    AND (message = ? OR (message IS NULL AND ? IS NULL))
                    AND (related_type = ? OR (related_type IS NULL AND ? IS NULL))
                    AND (related_id = ? OR (related_id IS NULL AND ? IS NULL))
                ");
                
                $msg = $reminder['message'];
                $rType = $reminder['related_type'];
                $rId = $reminder['related_id'];
                
                $stmt->bind_param("sssssii", 
                    $reminder['title'], 
                    $msg, $msg, 
                    $rType, $rType, 
                    $rId, $rId
                );
                
                $stmt->execute();
                echo json_encode(['success' => true, 'message' => 'Reminder(s) removed from Admin panel']);
            } else {
                // For Staff and Users, we should probably just remove them as recipients 
                // so it disappears from THEIR list but stays for others.
                $stmt = $conn->prepare("DELETE FROM reminder_recipients WHERE batch_id = ? AND user_id = ?");
                $stmt->bind_param("ii", $batchId, $currentUserId);
                $stmt->execute();
                
                // If it was their own custom reminder and they were the only recipient, 
                // or if it's a draft, we could delete the batch, but "soft delete" for recipients is safer.
                echo json_encode(['success' => true, 'message' => 'Notification removed']);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();