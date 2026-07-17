<?php
// api_sessions.php
// Handle sessions CRUD operations

// Disable error display to prevent HTML output breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once '../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    // error_log('API Sessions: Unauthorized access attempt.');
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - Please log in again']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$conn = getDBConnection();

define('SESSION_TITLE_BODY', 'Sangguniang Panlungsod ng Valenzuela');

function ensureSessionNumberColumn($conn) {
    $check = $conn->query("SHOW COLUMNS FROM sessions LIKE 'session_number'");
    if ($check && $check->num_rows === 0) {
        $conn->query("ALTER TABLE sessions ADD COLUMN session_number INT NULL DEFAULT NULL AFTER title");
    }
}

function toOrdinalSuffix($number) {
    $number = (int) $number;
    if ($number <= 0) {
        return '';
    }
    if (!in_array($number % 100, [11, 12, 13], true)) {
        switch ($number % 10) {
            case 1: return $number . 'st';
            case 2: return $number . 'nd';
            case 3: return $number . 'rd';
        }
    }
    return $number . 'th';
}

function buildSessionTitle($sessionNumber, $sessionType) {
    $sessionNumber = (int) $sessionNumber;
    $sessionType = trim((string) $sessionType);
    if ($sessionNumber <= 0 || $sessionType === '') {
        return '';
    }
    return toOrdinalSuffix($sessionNumber) . ' ' . $sessionType . ' of the ' . SESSION_TITLE_BODY;
}

function parseSessionNumberFromTitle($title) {
    $title = trim((string) $title);
    if (preg_match('/(\d+)(?:st|nd|rd|th)\s+(?:Regular|Special|Emergency)\s+Session/i', $title, $matches)) {
        return (int) $matches[1];
    }
    if (preg_match('/^(\d+)(?:st|nd|rd|th)\b/i', $title, $matches)) {
        return (int) $matches[1];
    }
    return null;
}

function backfillSessionNumbers($conn) {
    ensureSessionNumberColumn($conn);
    $result = $conn->query("SELECT session_id, title, session_number FROM sessions WHERE session_number IS NULL OR session_number = 0");
    if (!$result) {
        return;
    }
    $stmt = $conn->prepare("UPDATE sessions SET session_number = ? WHERE session_id = ?");
    if (!$stmt) {
        return;
    }
    while ($row = $result->fetch_assoc()) {
        $parsed = parseSessionNumberFromTitle($row['title']);
        if ($parsed !== null && $parsed > 0) {
            $stmt->bind_param('ii', $parsed, $row['session_id']);
            $stmt->execute();
        }
    }
    $stmt->close();
}

function getNextConsecutiveNumber(array $usedNumbers) {
    $used = array_values(array_unique(array_filter(array_map('intval', $usedNumbers), function ($n) {
        return $n > 0;
    })));
    sort($used, SORT_NUMERIC);

    $next = 1;
    foreach ($used as $number) {
        if ($number < $next) {
            continue;
        }
        if ($number === $next) {
            $next++;
            continue;
        }
        break;
    }

    return $next;
}

function getSessionNumberStats($conn, $excludeSessionId = null, $sessionType = null) {
    ensureSessionNumberColumn($conn);
    backfillSessionNumbers($conn);

    $sql = "SELECT session_id, session_number, title, session_type FROM sessions WHERE session_status = 'Active'";
    $params = [];
    $types = '';

    if ($excludeSessionId !== null) {
        $sql .= " AND session_id != ?";
        $params[] = (int) $excludeSessionId;
        $types .= 'i';
    }
    if ($sessionType !== null && trim($sessionType) !== '') {
        $sql .= " AND session_type = ?";
        $params[] = trim($sessionType);
        $types .= 's';
    }

    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();
        } else {
            $result = false;
        }
    } else {
        $result = $conn->query($sql);
    }

    $usedNumbers = [];
    $maxNumber = 0;

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $number = !empty($row['session_number']) ? (int) $row['session_number'] : parseSessionNumberFromTitle($row['title']);
            if ($number !== null && $number > 0) {
                $usedNumbers[$number] = (int) $row['session_id'];
                if ($number > $maxNumber) {
                    $maxNumber = $number;
                }
            }
        }
    }

    ksort($usedNumbers, SORT_NUMERIC);
    $usedNumberList = array_map('intval', array_keys($usedNumbers));

    return [
        'max_number' => $maxNumber,
        'next_number' => getNextConsecutiveNumber($usedNumberList),
        'used_numbers' => $usedNumberList,
        'used_map' => $usedNumbers,
    ];
}

function validateSessionNumberForSave($conn, $sessionNumber, $excludeSessionId = null, $sessionType = null, $currentSessionNumber = null) {
    $stats = getSessionNumberStats($conn, $excludeSessionId, $sessionType);
    $sessionNumber = (int) $sessionNumber;

    if ($sessionNumber <= 0) {
        return ['valid' => false, 'message' => 'Invalid session number'];
    }

    if (in_array($sessionNumber, $stats['used_numbers'], true)) {
        return ['valid' => false, 'message' => 'Session number is already in use for this session type'];
    }

    if ($currentSessionNumber !== null && $sessionNumber === (int) $currentSessionNumber) {
        return ['valid' => true, 'stats' => $stats];
    }

    if ($sessionNumber !== $stats['next_number']) {
        return [
            'valid' => false,
            'message' => 'Session number must be the next consecutive number (' . toOrdinalSuffix($stats['next_number']) . ') for this session type',
        ];
    }

    return ['valid' => true, 'stats' => $stats];
}

function isSessionNumberTaken($conn, $sessionNumber, $excludeSessionId = null, $sessionType = null) {
    $validation = validateSessionNumberForSave($conn, $sessionNumber, $excludeSessionId, $sessionType);
    return !$validation['valid'] && strpos($validation['message'], 'already in use') !== false;
}

switch ($method) {
    case 'GET':
        try {
        // Auto-mark past sessions as 'Missed' when still Scheduled
        // Uses session_date + actual_start_time (or end of day if no time set) compared to NOW()
        try {
            $autoMissedSql = "
                UPDATE sessions 
                SET status = 'Missed' 
                WHERE status = 'Scheduled' 
                  AND session_status = 'Active'
                  AND CONCAT(session_date, ' ', COALESCE(actual_start_time, '23:59:59')) < NOW()
            ";
            $conn->query($autoMissedSql);
        } catch (Exception $e) {
            // Silent fail; don't block main GET if auto-update fails
        }

        // Check if requesting members list
        if (isset($_GET['members']) && $_GET['members'] == '1') {
            $membersStmt = $conn->prepare("SELECT member_id, full_name, position FROM members ORDER BY full_name");
            $membersStmt->execute();
            $membersResult = $membersStmt->get_result();
            $members = [];
            while ($row = $membersResult->fetch_assoc()) {
                $members[] = $row;
            }
            echo json_encode(['success' => true, 'members' => $members]);
            $membersStmt->close();
            exit;
        }

        // Session number stats for auto-generated titles
        if (isset($_GET['session_numbers']) && $_GET['session_numbers'] == '1') {
            $excludeSessionId = isset($_GET['exclude_id']) ? (int) $_GET['exclude_id'] : null;
            $sessionType = isset($_GET['session_type']) ? trim($_GET['session_type']) : null;
            $stats = getSessionNumberStats($conn, $excludeSessionId, $sessionType);
            echo json_encode([
                'success' => true,
                'title_body' => SESSION_TITLE_BODY,
                'session_type' => $sessionType,
                'max_number' => $stats['max_number'],
                'next_number' => $stats['next_number'],
                'used_numbers' => $stats['used_numbers'],
            ]);
            exit;
        }

        // Get all sessions or a specific session
        $sessionId = isset($_GET['id']) ? intval($_GET['id']) : null;

        if ($sessionId) {
            // Get single session - restrict for User role
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            $currentUserId = $_SESSION['user_id'] ?? 0;

            if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0) && strcasecmp($userRole, 'Staff') !== 0) {
                $stmt = $conn->prepare("SELECT s.*, u.user_name as creator_name FROM sessions s JOIN session_assignments sa ON s.session_id = sa.session_id LEFT JOIN users u ON s.created_by = u.user_id WHERE s.session_id = ? AND sa.user_id = ?");
                if (!$stmt) throw new Exception($conn->error);
                $stmt->bind_param("ii", $sessionId, $currentUserId);
            } else {
                $sql = "SELECT s.*, u.user_name as creator_name FROM sessions s LEFT JOIN users u ON s.created_by = u.user_id WHERE s.session_id = ?";
                if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0)) {
                    $sql .= " AND s.session_status = 'Active'";
                }
                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new Exception($conn->error);
                $stmt->bind_param("i", $sessionId);
            }

            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $session = $result->fetch_assoc();

                // Get attendance count
                $attendanceStmt = $conn->prepare("SELECT COUNT(*) as total FROM session_attendance WHERE session_id = ? AND attendance_status = 'Present'");
                $attendanceStmt->bind_param("i", $sessionId);
                $attendanceStmt->execute();
                $attendanceResult = $attendanceStmt->get_result();
                $attendance = $attendanceResult->fetch_assoc();

                // Get agenda count
                $agendaStmt = $conn->prepare("SELECT COUNT(*) as total FROM agendas WHERE session_id = ?");
                $agendaStmt->bind_param("i", $sessionId);
                $agendaStmt->execute();
                $agendaResult = $agendaStmt->get_result();
                $agenda = $agendaResult->fetch_assoc();

                // Get full attendance list with member/user names
                // Modified to handle user_id and new columns
                $attendanceListStmt = $conn->prepare("
                    SELECT sa.attendance_id, sa.attendance_status as status, sa.marked_at, sa.time_in, sa.time_out, sa.notes,
                           sa.member_id, sa.user_id,
                           COALESCE(m.full_name, u.user_name) as name,
                           COALESCE(m.position, u.user_role) as position,
                           u.avatar_url
                    FROM session_attendance sa
                    LEFT JOIN members m ON sa.member_id = m.member_id
                    LEFT JOIN users u ON sa.user_id = u.user_id
                    WHERE sa.session_id = ?
                    ORDER BY name
                ");
                $attendanceListStmt->bind_param("i", $sessionId);
                $attendanceListStmt->execute();
                $attendanceListResult = $attendanceListStmt->get_result();
                $attendanceList = [];
                while ($row = $attendanceListResult->fetch_assoc()) {
                    // Normalize status case just in case
                    $row['status'] = ucfirst(strtolower($row['status']));
                    $attendanceList[] = $row;
                }

                // Get meeting minutes
                $minutesStmt = $conn->prepare("SELECT * FROM session_minutes WHERE session_id = ? ORDER BY created_at DESC LIMIT 1");
                $minutesStmt->bind_param("i", $sessionId);
                $minutesStmt->execute();
                $minutesResult = $minutesStmt->get_result();
                $minutes = $minutesResult->fetch_assoc(); // Can be null

                // Get session documents
                $documentsStmt = $conn->prepare("
                    SELECT sd.document_id, sd.file_name, sd.file_type, sd.file_size, sd.file_path, 
                           sd.uploaded_at, sd.uploaded_by, sd.permission_state,
                           u.user_name as uploaded_by_name
                    FROM session_documents sd
                    LEFT JOIN users u ON sd.uploaded_by = u.user_id
                    WHERE sd.session_id = ?
                    ORDER BY sd.uploaded_at DESC
                ");
                $documentsStmt->bind_param("i", $sessionId);
                $documentsStmt->execute();
                $documentsResult = $documentsStmt->get_result();
                $documents = [];
                while ($row = $documentsResult->fetch_assoc()) {
                    // Format uploaded_at for display
                    $uploadedDate = new DateTime($row['uploaded_at']);
                    $now = new DateTime();
                    $diff = $now->diff($uploadedDate);

                    if ($diff->days == 0) {
                        if ($diff->h == 0) {
                            $row['uploaded_ago'] = $diff->i . ' minutes ago';
                        } else {
                            $row['uploaded_ago'] = $diff->h . ' hour' . ($diff->h > 1 ? 's' : '') . ' ago';
                        }
                    } else if ($diff->days == 1) {
                        $row['uploaded_ago'] = 'yesterday';
                    } else {
                        $row['uploaded_ago'] = $diff->days . ' days ago';
                    }

                    // Format file size
                    $bytes = $row['file_size'] ?? 0;
                    if ($bytes >= 1048576) {
                        $row['size'] = number_format($bytes / 1048576, 2) . ' MB';
                    } elseif ($bytes >= 1024) {
                        $row['size'] = number_format($bytes / 1024, 2) . ' KB';
                    } else {
                        $row['size'] = $bytes . ' B';
                    }
                    // Fix path for frontend to be usable (if relative to api, frontend needs to know)
                    // If path is '../uploads/...', and frontend is in 'modules/', link should be '../uploads/...'?
                    // Frontend is accessed as Main page -> modules/main.js -> calls API.
                    // Links are rendered in HTML. Relative links depend on the URL of the PAGE.
                    // Page: http://localhost/.../modules/main.php (or index.php?)
                    // If Main file is index.php in root, then link '../uploads/...' tries to go to parent of root? No.
                    // If index.php is in root, 'uploads/...' is correct.
                    // Stored: '../uploads/...'.
                    // We should strip the leading '../' for the view if the page is in root.
                    // Assuming Page is in Root (index.php) or 'modules/main.php'. 
                    // Let's provide a 'download_url'
                    $row['download_url'] = str_replace('../', '', $row['file_path']); // e.g. 'uploads/session_documents/...'
                    // If user is in 'modules/', this path 'uploads/...' is wrong. It should be '../uploads/...'.
                    // Let's rely on absolute path from webroot or handle it.
                    // For now, let's just make sure the object has 'size' so loop works.

                    $documents[] = $row;
                }

                // Get assigned staff
                $staffStmt = $conn->prepare("
                    SELECT u.user_id, u.user_name, u.avatar_url, u.user_role
                    FROM session_assignments sa 
                    JOIN users u ON sa.user_id = u.user_id 
                    WHERE sa.session_id = ?
                ");
                $staffStmt->bind_param("i", $sessionId);
                $staffStmt->execute();
                $staffResult = $staffStmt->get_result();
                $assignedStaff = [];
                while ($staffRow = $staffResult->fetch_assoc()) {
                    $assignedStaff[] = $staffRow;
                }

                // Calculate Quorum
                $tmRes = $conn->query("SELECT COUNT(*) as cnt FROM members");
                $tmRow = $tmRes->fetch_assoc();
                $totalMembersCount = $tmRow['cnt'];
                
                $presentCount = $attendance['total'] ?? 0;
                $required = floor($totalMembersCount * 0.5) + 1;
                $quorumStatus = ($presentCount >= $required) ? 'Quorum Reached' : 'No Quorum';

                // Format the response
                $session['attendees'] = $presentCount . ' Present'; // Keep original string format if frontend relies on it
                $session['attendees_count'] = $presentCount; // Clean number
                $session['attendance_status'] = $quorumStatus;
                $session['quorum_required'] = $required;
                
                $session['hasAgenda'] = ($agenda['total'] ?? 0) > 0;
                $session['attendance_list'] = $attendanceList; // rename key in JS if needed, but I think 'attendance' was expected in JS
                $session['attendance'] = $attendanceList; // map to 'attendance' as expected by JS
                $session['minutes'] = $minutes;
                $session['documents'] = $documents;
                $session['assigned_staff'] = $assignedStaff;

                // Format date and time for display
                $session['date'] = date('M d, Y', strtotime($session['session_date']));
                // Format time from actual_start_time and actual_end_time
                if ($session['actual_start_time'] && $session['actual_end_time']) {
                    $session['time'] = date('g:i A', strtotime($session['actual_start_time'])) . ' - ' . date('g:i A', strtotime($session['actual_end_time']));
                    $session['start_time'] = date('H:i:s', strtotime($session['actual_start_time']));
                    $session['end_time'] = date('H:i:s', strtotime($session['actual_end_time']));
                } else {
                    $session['time'] = 'TBD';
                    $session['start_time'] = null;
                    $session['end_time'] = null;
                }
                $session['type'] = $session['session_type'];

                echo json_encode(['success' => true, 'session' => $session]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Session not found']);
            }

            if (isset($stmt) && is_object($stmt)) $stmt->close();
            if (isset($attendanceStmt) && is_object($attendanceStmt)) $attendanceStmt->close();
            if (isset($agendaStmt) && is_object($agendaStmt)) $agendaStmt->close();
            if (isset($attendanceListStmt) && is_object($attendanceListStmt)) $attendanceListStmt->close();
            if (isset($minutesStmt) && is_object($minutesStmt)) $minutesStmt->close();
            if (isset($documentsStmt) && is_object($documentsStmt)) $documentsStmt->close();
            if (isset($staffStmt) && is_object($staffStmt)) $staffStmt->close();
            exit; // Stop execution after single session response
        }

        // Get all sessions logic (kept same as before, updated slightly)
        $userRole = $_SESSION['user_role'] ?? 'User - Committee';
        $currentUserId = $_SESSION['user_id'] ?? 0;

        $sql = "SELECT s.*, u.user_name as creator_name, v.address as venue_address 
                FROM sessions s 
                LEFT JOIN users u ON s.created_by = u.user_id
                LEFT JOIN venues v ON s.venue_id = v.id";
        if ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0 || strcasecmp($userRole, 'Administrator') === 0)) {
            // See everything
        } else if (strcasecmp($userRole, 'Staff') === 0) {
            // Staff sees all sessions except soft-deleted ones
            $sql = "SELECT s.*, u.user_name as creator_name, v.address as venue_address 
                    FROM sessions s 
                    LEFT JOIN users u ON s.created_by = u.user_id 
                    LEFT JOIN venues v ON s.venue_id = v.id 
                    WHERE s.session_status = 'Active'";
        } else {
            // User sees only active sessions assigned to them
            $sql = "SELECT s.*, u.user_name as creator_name, v.address as venue_address 
                    FROM sessions s 
                    JOIN session_assignments sa ON s.session_id = sa.session_id 
                    LEFT JOIN users u ON s.created_by = u.user_id 
                    LEFT JOIN venues v ON s.venue_id = v.id 
                    WHERE s.session_status = 'Active' AND sa.user_id = ?";
        }
        $sql .= " ORDER BY (CASE WHEN s.session_type = 'Emergency Session' THEN 0 ELSE 1 END), s.session_date DESC, s.session_id DESC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . $conn->error);
        }

        if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0) && strcasecmp($userRole, 'Staff') !== 0) {
            $stmt->bind_param("i", $currentUserId);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $sessions = [];

        while ($row = $result->fetch_assoc()) {
            // Get attendance count
            $attendanceStmt = $conn->prepare("SELECT COUNT(*) as total FROM session_attendance WHERE session_id = ? AND attendance_status = 'Present'");
            $attendanceStmt->bind_param("i", $row['session_id']);
            $attendanceStmt->execute();
            $attendanceResult = $attendanceStmt->get_result();
            $attendance = $attendanceResult->fetch_assoc();

            $agendaStmt = $conn->prepare("SELECT COUNT(*) as total FROM agendas WHERE session_id = ?");
            $agendaStmt->bind_param("i", $row['session_id']);
            $agendaStmt->execute();
            $agendaResult = $agendaStmt->get_result();
            $agenda = $agendaResult->fetch_assoc();

            // Calculate Quorum (50% + 1 of total MEMBERS)
            // Note: Users are not Members (usually). Members table has the elected officials.
            // We need total members count.
            // Optimally, fetch this once outside the loop, but for safety in case it changes dynamically per session context (unlikely but safe), we can do it here or cache it.
            // Let's cache it outside the loop if possible, but for this structure, inside is safer for now or separate query.
            // Actually, querying it once is better.
            static $totalMembersCount = null;
            if ($totalMembersCount === null) {
                $tmRes = $conn->query("SELECT COUNT(*) as cnt FROM members");
                $tmRow = $tmRes->fetch_assoc();
                $totalMembersCount = $tmRow['cnt'];
            }

            $presentCount = $attendance['total'] ?? 0;
            $required = floor($totalMembersCount * 0.5) + 1;
            $quorumStatus = ($presentCount >= $required) ? 'Quorum Reached' : 'No Quorum';

            $row['id'] = $row['session_id'];
            $row['attendees'] = $presentCount;
            $row['attendance_status'] = $quorumStatus; // API Response field
            $row['hasAgenda'] = ($agenda['total'] ?? 0) > 0;
            $row['date'] = date('M d, Y', strtotime($row['session_date']));

            if ($row['actual_start_time'] && $row['actual_end_time']) {
                $row['time'] = date('g:i A', strtotime($row['actual_start_time'])) . ' - ' . date('g:i A', strtotime($row['actual_end_time']));
                $row['start_time'] = date('H:i:s', strtotime($row['actual_start_time']));
                $row['end_time'] = date('H:i:s', strtotime($row['actual_end_time']));
            } else {
                $row['time'] = 'TBD';
                $row['start_time'] = null;
                $row['end_time'] = null;
            }
            $row['type'] = $row['session_type'];

            $sessions[] = $row;
            $attendanceStmt->close();
            $agendaStmt->close();
        }

        echo json_encode(['success' => true, 'sessions' => $sessions]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error loading sessions: ' . $e->getMessage()]);
        }
        break;

    case 'POST':
        // Determine input type
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $input = $_POST;
        }

        // Check for specific action
        if (isset($input['action'])) {
            $action = $input['action'];

            if ($action === 'record_attendance') {
                $sessionId = intval($input['session_id']);
                $attendanceData = $input['attendance_data'];
                $notes = $input['notes'] ?? '';

                if (empty($attendanceData)) {
                    echo json_encode(['success' => false, 'message' => 'No attendance data provided']);
                    exit;
                }

                $conn->begin_transaction();
                try {
                    // Delete existing attendance records for this session to avoid duplication
                    // Since UNIQUE(session_id, member_id, user_id) allows multiple NULLs in many DBs,
                    // we'll use a more surgical approach of clearing and re-inserting for bulk updates.
                    $deleteStmt = $conn->prepare("DELETE FROM session_attendance WHERE session_id = ?");
                    $deleteStmt->bind_param("i", $sessionId);
                    $deleteStmt->execute();
                    $deleteStmt->close();

                    // Prepare statement with both user_id and member_id
                    $stmt = $conn->prepare("
                        INSERT INTO session_attendance (session_id, user_id, member_id, attendance_status, time_in, time_out, notes)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");

                    foreach ($attendanceData as $record) {
                        $userId = !empty($record['user_id']) ? intval($record['user_id']) : null;
                        $memberId = !empty($record['member_id']) ? intval($record['member_id']) : null;

                        if (!$userId && !$memberId)
                            continue;

                        // Normalize status; allow NULL when no status is selected to avoid enum truncation errors
                        $statusRaw = isset($record['status']) ? trim($record['status']) : '';
                        $status = $statusRaw !== '' ? ucfirst(strtolower($statusRaw)) : null;
                        $timeIn = !empty($record['timeIn']) ? $record['timeIn'] : null;
                        $timeOut = !empty($record['timeOut']) ? $record['timeOut'] : null;

                        $stmt->bind_param("iiissss", $sessionId, $userId, $memberId, $status, $timeIn, $timeOut, $notes);
                        $stmt->execute();
                    }
                    $stmt->close();

                    $conn->commit();
                    
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Record Attendance";
                        $log_count = count($attendanceData);
                        $log_desc = "Recorded attendance for $log_count participants";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Attendance recorded successfully']);
                } catch (Exception $e) {
                    $conn->rollback();
                    echo json_encode(['success' => false, 'message' => 'Failed to record attendance: ' . $e->getMessage()]);
                }
                exit;
            }

            if ($action === 'save_minutes') {
                $sessionId = intval($input['session_id']);
                $summary = $input['summary'];
                $topics = $input['topics'];
                $decisions = $input['decisions'];
                $actions = $input['actions']; // Map to action_items
                $status = ucfirst(strtolower($input['status'])); // Draft/Published

                $stmt = $conn->prepare("
                    SELECT minutes_id FROM session_minutes WHERE session_id = ?
                ");
                $stmt->bind_param("i", $sessionId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    // Update
                    $stmt = $conn->prepare("
                        UPDATE session_minutes 
                        SET summary = ?, topics = ?, decisions = ?, action_items = ?, status = ?
                        WHERE session_id = ?
                    ");
                    $stmt->bind_param("sssssi", $summary, $topics, $decisions, $actions, $status, $sessionId);
                } else {
                    // Insert
                    $stmt = $conn->prepare("
                        INSERT INTO session_minutes (session_id, summary, topics, decisions, action_items, status)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->bind_param("isssss", $sessionId, $summary, $topics, $decisions, $actions, $status);
                }

                if ($stmt->execute()) {
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Save Minutes";
                        $log_desc = "Minutes saved as $status";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Minutes saved successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to save minutes']);
                }
                $stmt->close();
                exit;
            }

            if ($action === 'upload_documents') {
                $sessionId = intval($input['session_id']);

                if (!isset($_FILES['files']['name'][0])) {
                    echo json_encode(['success' => false, 'message' => 'No files uploaded']);
                    exit;
                }

                $uploadDir = '../uploads/session_documents/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $uploadedCount = 0;
                // Updated query to include file_size
                $stmt = $conn->prepare("INSERT INTO session_documents (session_id, file_name, file_type, file_size, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)");

                foreach ($_FILES['files']['name'] as $key => $name) {
                    $tmpName = $_FILES['files']['tmp_name'][$key];
                    $type = pathinfo($name, PATHINFO_EXTENSION);
                    $size = $_FILES['files']['size'][$key];
                    $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $name);
                    $targetPath = $uploadDir . $fileName;

                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $uploadedBy = $_SESSION['user_id'] ?? null;
                        $dbPath = $targetPath;

                        $stmt->bind_param("issisi", $sessionId, $name, $type, $size, $dbPath, $uploadedBy);
                        $stmt->execute();
                        $uploadedCount++;
                    } else {
                        error_log("Failed to move uploaded file: $tmpName to $targetPath");
                    }
                }
                $stmt->close();

                if ($uploadedCount > 0) {
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Upload Documents";
                        $log_desc = "Uploaded $uploadedCount document(s)";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => "$uploadedCount files uploaded successfully"]);
                } else {
                    echo json_encode(['success' => false, 'message' => "Failed to upload files"]);
                }
                exit;
            }

            if ($action === 'delete_minutes') {
                $sessionId = intval($input['session_id']);
                $stmt = $conn->prepare("DELETE FROM session_minutes WHERE session_id = ?");
                $stmt->bind_param("i", $sessionId);

                if ($stmt->execute()) {
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Delete Minutes";
                        $log_desc = "Removed meeting minutes";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Minutes deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete minutes']);
                }
                $stmt->close();
                exit;
            }
            
            if ($action === 'update_document_permission') {
                $docId = intval($input['document_id'] ?? 0);
                $permState = $input['permission_state'] ?? 'Public view';
                $stmt = $conn->prepare("UPDATE session_documents SET permission_state = ? WHERE document_id = ?");
                if ($stmt) {
                    $stmt->bind_param("si", $permState, $docId);
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Permission updated']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to update permission']);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['success' => false, 'message' => 'Database error']);
                }
                exit;
            }

            if ($action === 'delete_attendance') {
                $sessionId = intval($input['session_id']);
                $stmt = $conn->prepare("DELETE FROM session_attendance WHERE session_id = ?");
                $stmt->bind_param("i", $sessionId);

                if ($stmt->execute()) {
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Clear Attendance";
                        $log_desc = "Cleared all attendance records";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Attendance records cleared successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to clear attendance']);
                }
                $stmt->close();
                exit;
            }

            if ($action === 'cancel_session') {
                $sessionId = intval($input['session_id']);
                $reason = $input['reason'];
                $notes = $input['notes'];
                $notify = $input['notify']; // Boolean/String

                // Format comprehensive reason
                $cancellationReason = "Reason: " . ucfirst($reason) . ". Notes: " . $notes;

                $stmt = $conn->prepare("UPDATE sessions SET status = 'Cancelled', cancellation_reason = ? WHERE session_id = ?");
                $stmt->bind_param("si", $cancellationReason, $sessionId);

                if ($stmt->execute()) {
                    // Update status in history
                    $hstmt = $conn->prepare("INSERT INTO session_status_history (session_id, old_status, new_status, reason, changed_by) VALUES (?, 'Scheduled', 'Cancelled', ?, ?)");
                    $userId = $_SESSION['user_id'] ?? null;
                    $hstmt->bind_param("isi", $sessionId, $cancellationReason, $userId);
                    $hstmt->execute();
                    $hstmt->close();

                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Cancel Session";
                        $log_desc = "Session cancelled. $cancellationReason";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Session cancelled successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to cancel session']);
                }
                $stmt->close();
                exit;
            }

            if ($action === 'delete_document') {
                $documentId = intval($input['document_id']);
                $sessionId = intval($input['session_id']);

                // Get file path first
                $stmt = $conn->prepare("SELECT file_path FROM session_documents WHERE document_id = ? AND session_id = ?");
                $stmt->bind_param("ii", $documentId, $sessionId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows === 0) {
                    echo json_encode(['success' => false, 'message' => 'Document not found']);
                    exit;
                }

                $doc = $result->fetch_assoc();
                $filePath = $doc['file_path'];

                // Delete from DB
                $delStmt = $conn->prepare("DELETE FROM session_documents WHERE document_id = ?");
                $delStmt->bind_param("i", $documentId);

                if ($delStmt->execute()) {
                    // Try to delete physical file
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }

                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Delete Document";
                        $log_desc = "Deleted document: " . $doc['file_name'];
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Document deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete document from database']);
                }
                $delStmt->close();
                exit;
            }

            if ($action === 'send_reminder') {
                $sessionId = intval($input['session_id']);

                // Verify session exists
                $stmt = $conn->prepare("SELECT title, session_date FROM sessions WHERE session_id = ?");
                $stmt->bind_param("i", $sessionId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows === 0) {
                    echo json_encode(['success' => false, 'message' => 'Session not found']);
                    exit;
                }
                $session = $result->fetch_assoc();
                $stmt->close();

                // Generate notification
                // Check if notifications table exists or handle error gracefullly
                // For now, we assume schema will be updated by user.

                $notificationType = 'session_reminder';
                $message = "Reminder: upcoming session '{$session['title']}' on " . date('F j, Y', strtotime($session['session_date']));
                $link = "/admin/sessions/" . $sessionId; // Or relevant link

                // Get participants to notify
                $participants = [];

                // 1. Members invited
                if (!empty($session['invited_members'])) {
                    $memberIds = explode(',', $session['invited_members']);
                    // Fetch user_ids for these members if mapped, or just skip for now as members might not have login
                    // Assuming members are external, maybe email? For now, let's skip members for system notification
                }

                // 2. Assigned Staff
                $staffStmt = $conn->prepare("SELECT user_id FROM session_assignments WHERE session_id = ?");
                $staffStmt->bind_param("i", $sessionId);
                $staffStmt->execute();
                $staffResult = $staffStmt->get_result();
                while ($staff = $staffResult->fetch_assoc()) {
                    $participants[] = $staff['user_id'];
                }
                $staffStmt->close();

                // Insert notifications (skip inactive users)
                if (!empty($participants)) {
                    // Load active user IDs once
                    $inClause = implode(',', array_fill(0, count($participants), '?'));
                    $types = str_repeat('i', count($participants));
                    $activeLookupSql = "SELECT user_id FROM users WHERE status = 'Active' AND user_id IN ($inClause)";
                    $activeStmt = $conn->prepare($activeLookupSql);
                    $activeStmt->bind_param($types, ...$participants);
                    $activeStmt->execute();
                    $activeRes = $activeStmt->get_result();
                    $activeIds = [];
                    while ($row = $activeRes->fetch_assoc()) {
                        $activeIds[] = intval($row['user_id']);
                    }
                    $activeStmt->close();

                    if (!empty($activeIds)) {
                    $notifyStmt = $conn->prepare("INSERT INTO notifications (user_id, type, message, link, created_at) VALUES (?, ?, ?, ?, NOW())");
                        foreach (array_unique($activeIds) as $userId) {
                        $notifyStmt->bind_param("isss", $userId, $notificationType, $message, $link);
                        $notifyStmt->execute();
                    }
                    $notifyStmt->close();
                    }
                }

                // Log Activity
                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Send Reminder";
                    $log_desc = "Sent manual session reminder to all participants";
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                echo json_encode(['success' => true, 'message' => 'Reminders sent successfully']);
                exit;
            } elseif ($action === 'send_bulk_reminders') {
                // Only Administrators can bulk send reminders
                $currentRole = $_SESSION['user_role'] ?? 'User - Committee';
                if (strcasecmp($currentRole, 'Super Admin') !== 0 && strcasecmp($currentRole, 'Admin') !== 0 && strcasecmp($currentRole, 'Administrator') !== 0) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    exit;
                }

                // Get all scheduled sessions in the next 7 days
                $sql = "SELECT session_id, title, session_date FROM sessions WHERE status = 'Scheduled' AND session_date >= CURDATE() AND session_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $sessions = $stmt->get_result();
                
                $sentCount = 0;
                $totalRecipients = 0;

                while ($session = $sessions->fetch_assoc()) {
                    $sessionId = $session['session_id'];
                    $title = $session['title'];
                    $date = date('F j, Y', strtotime($session['session_date']));
                    
                    $msg = "Manual Reminder: Session '$title' is scheduled for $date. Please prepare accordingly.";
                    $link = "/admin/sessions/$sessionId";
                    $notifType = 'manual_staff_reminder';

                    // Get assigned staff
                    $staffStmt = $conn->prepare("SELECT user_id FROM session_assignments WHERE session_id = ?");
                    $staffStmt->bind_param("i", $sessionId);
                    $staffStmt->execute();
                    $staffResult = $staffStmt->get_result();
                    
                    while ($staff = $staffResult->fetch_assoc()) {
                        $uid = $staff['user_id'];
                        $notifyStmt = $conn->prepare("INSERT INTO notifications (user_id, type, message, link, created_at) VALUES (?, ?, ?, ?, NOW())");
                        $notifyStmt->bind_param("isss", $uid, $notifType, $msg, $link);
                        if ($notifyStmt->execute()) {
                            $totalRecipients++;
                        }
                        $notifyStmt->close();
                    }
                    $staffStmt->close();
                    $sentCount++;
                }
                $stmt->close();

                echo json_encode([
                    'success' => true, 
                    'message' => "Successfully sent reminders for $sentCount session(s) to $totalRecipients recipient(s)."
                ]);
                exit;
            } elseif ($action === 'assign_staff') {
                $sessionId = intval($input['session_id']);
                $staffIds = isset($input['staff_ids']) && is_array($input['staff_ids']) ? $input['staff_ids'] : [];

                // Transactional update
                $conn->begin_transaction();
                try {
                // 0. Get old assignments for detailed logging
                $oldUsers = [];
                $oldStmt = $conn->prepare("SELECT sa.user_id, u.user_name FROM session_assignments sa JOIN users u ON sa.user_id = u.user_id WHERE sa.session_id = ?");
                $oldStmt->bind_param("i", $sessionId);
                $oldStmt->execute();
                $oldRes = $oldStmt->get_result();
                while ($row = $oldRes->fetch_assoc()) {
                    $oldUsers[$row['user_id']] = $row['user_name'];
                }
                $oldStmt->close();

                    // 1. Remove existing assignments for this session
                    $deleteStmt = $conn->prepare("DELETE FROM session_assignments WHERE session_id = ?");
                    $deleteStmt->bind_param("i", $sessionId);
                    $deleteStmt->execute();
                    $deleteStmt->close();

                    // 2. Insert new assignments
                    if (!empty($staffIds)) {
                        $insertStmt = $conn->prepare("INSERT INTO session_assignments (session_id, user_id) VALUES (?, ?)");
                        foreach ($staffIds as $userId) {
                            $userId = intval($userId);
                            if ($userId > 0) {
                                $insertStmt->bind_param("ii", $sessionId, $userId);
                                $insertStmt->execute();
                            }
                        }
                        $insertStmt->close();
                    }

                    // 3. Notify newly assigned staff? (Optional, skipping for now to keep it simple as per request)

                    $conn->commit();

                // Calculate Delta for Logging
                $newUsers = [];
                if (!empty($staffIds)) {
                    $placeholders = implode(',', array_fill(0, count($staffIds), '?'));
                    $newStmt = $conn->prepare("SELECT user_id, user_name FROM users WHERE user_id IN ($placeholders)");
                    $types = str_repeat('i', count($staffIds));
                    $newStmt->bind_param($types, ...$staffIds);
                    $newStmt->execute();
                    $newRes = $newStmt->get_result();
                    while ($row = $newRes->fetch_assoc()) {
                        $newUsers[$row['user_id']] = $row['user_name'];
                    }
                    $newStmt->close();
                }

                $added = [];
                $removed = [];
                foreach ($newUsers as $id => $name) {
                    if (!isset($oldUsers[$id])) $added[] = $name;
                }
                foreach ($oldUsers as $id => $name) {
                    if (!isset($newUsers[$id])) $removed[] = $name;
                }

                $log_desc = "Updated staff assignments.";
                $desc_parts = [];
                if (!empty($added)) $desc_parts[] = "User added: " . implode(', ', $added);
                if (!empty($removed)) $desc_parts[] = "User removed: " . implode(', ', $removed);
                if (!empty($desc_parts)) {
                    $log_desc = implode(" | ", $desc_parts);
                } else if (empty($oldUsers) && empty($newUsers)) {
                    $log_desc = "Cleared all staff assignments";
                } else {
                    $log_desc = "No changes to staff assignments";
                }

                // Log Activity
                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Update Assignments";
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Staff assignments updated']);
                } catch (Exception $e) {
                    $conn->rollback();
                    echo json_encode(['success' => false, 'message' => 'Failed to updated assignments: ' . $e->getMessage()]);
                }
                exit;
            } elseif ($action === 'bulk_delete') {
                $sessionIds = isset($input['session_ids']) && is_array($input['session_ids']) ? $input['session_ids'] : [];
                if (empty($sessionIds)) {
                    echo json_encode(['success' => false, 'message' => 'No session IDs provided']);
                    exit;
                }

                $successCount = 0;
                $conn->begin_transaction();
                try {
                    foreach ($sessionIds as $id) {
                        $sessionId = intval($id);
                        
                        // Check current status
                        $checkStmt = $conn->prepare("SELECT session_status, title FROM sessions WHERE session_id = ?");
                        $checkStmt->bind_param("i", $sessionId);
                        $checkStmt->execute();
                        $session = $checkStmt->get_result()->fetch_assoc();
                        $checkStmt->close();

                        if (!$session) continue;

                        if ($session['session_status'] === 'Inactive') {
                            // Permanent delete cleanup
                            // 1. Delete agenda items (redundant link, but sometimes exists)
                            $cleanStmt = $conn->prepare("DELETE FROM agenda_items WHERE session_id = ?");
                            $cleanStmt->bind_param("i", $sessionId);
                            $cleanStmt->execute();
                            $cleanStmt->close();

                            // 2. Delete agendas
                            $cleanStmt = $conn->prepare("DELETE FROM agendas WHERE session_id = ?");
                            $cleanStmt->bind_param("i", $sessionId);
                            $cleanStmt->execute();
                            $cleanStmt->close();

                            // 3. Delete status history
                            $cleanStmt = $conn->prepare("DELETE FROM session_status_history WHERE session_id = ?");
                            $cleanStmt->bind_param("i", $sessionId);
                            $cleanStmt->execute();
                            $cleanStmt->close();

                            // 4. Delete attendance
                            $cleanStmt = $conn->prepare("DELETE FROM session_attendance WHERE session_id = ?");
                            $cleanStmt->bind_param("i", $sessionId);
                            $cleanStmt->execute();
                            $cleanStmt->close();

                            // 5. Delete documents (Note: ideally delete files too, but focusing on DB error)
                            $cleanStmt = $conn->prepare("DELETE FROM session_documents WHERE session_id = ?");
                            $cleanStmt->bind_param("i", $sessionId);
                            $cleanStmt->execute();
                            $cleanStmt->close();

                             // 6. Delete related reminders (Session, Agendas, and Items)
                             try {
                                 // Clean up Session reminders
                                 $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Session' AND related_id = $sessionId");
                                 
                                 // Clean up Agenda reminders linked to this session
                                 $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Agenda' AND related_id IN (SELECT agenda_id FROM agendas WHERE session_id = $sessionId)");
                                 
                                 // Clean up Item reminders linked to this session
                                 $conn->query("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id IN (SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId)");
                                 
                                 // Clean up Item deadlines
                                 $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId");
                                 while ($itemRow = $itemsRes->fetch_assoc()) {
                                     $itemId = $itemRow['agenda_item_id'];
                                     $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                                     $conn->query("DELETE FROM deadlines WHERE description LIKE '$deadlineSearch'");
                                 }
                             } catch (Exception $e) {}

                            // Finally delete session
                            $stmt = $conn->prepare("DELETE FROM sessions WHERE session_id = ?");
                            $stmt->bind_param("i", $sessionId);
                            if ($stmt->execute()) {
                                $successCount++;
                                // Log Permanent Delete
                                try {
                                    $log_uid = $_SESSION['user_id'] ?? 0;
                                    $log_act = "Permanent Delete Session";
                                    $log_desc = "Permanently deleted session: " . $session['title'];
                                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                                    if ($lstmt) {
                                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                                        $lstmt->execute();
                                        $lstmt->close();
                                    }
                                } catch (Exception $e) {}
                            }
                            $stmt->close();
                        } else {
                            // Soft delete
                            $stmt = $conn->prepare("UPDATE sessions SET session_status = 'Inactive' WHERE session_id = ?");
                            $stmt->bind_param("i", $sessionId);
                            if ($stmt->execute()) {
                                $successCount++;
                                
                                // Clean up all related reminders and deadlines on soft delete
                                try {
                                    // 1. Session Reminders
                                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Session' AND related_id = $sessionId");
                                    
                                    // 2. Agenda Reminders For this session
                                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Agenda' AND related_id IN (SELECT agenda_id FROM agendas WHERE session_id = $sessionId)");
                                    
                                    // 3. Agenda Item Reminders For this session
                                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id IN (SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId)");
                                    
                                    // 4. Item deadlines
                                    $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId");
                                    while ($itemRow = $itemsRes->fetch_assoc()) {
                                        $itemId = $itemRow['agenda_item_id'];
                                        $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                                        $conn->query("DELETE FROM deadlines WHERE description LIKE '$deadlineSearch'");
                                    }
                                } catch (Exception $e) {}

                                // Log Soft Delete
                                try {
                                    $log_uid = $_SESSION['user_id'] ?? 0;
                                    $log_act = "Soft Delete Session";
                                    $log_desc = "Moved session '" . $session['title'] . "' to Inactive status";
                                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                                    if ($lstmt) {
                                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                                        $lstmt->execute();
                                        $lstmt->close();
                                    }
                                } catch (Exception $e) {}
                            }
                            $stmt->close();
                        }
                    }
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => "Successfully processed $successCount sessions"]);
                } catch (Exception $e) {
                    $conn->rollback();
                    echo json_encode(['success' => false, 'message' => 'Bulk delete failed: ' . $e->getMessage()]);
                }
                exit;
            }
        }

        // Standard Session Create (existing logic)
        // ... (Keep existing logic but wrap it or if checks above failed)
        // Actually, I should just paste existing POST logic here if action is not set.

        // Administrators and Staff can create sessions
        $userRole = $_SESSION['user_role'] ?? 'User - Committee';
        if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0) && strcasecmp($userRole, 'Staff') !== 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Only administrators and staff can create sessions']);
            exit;
        }

        // Validate required fields
        if (
            !isset($input['session_type']) || !isset($input['session_date']) ||
            (
                !isset($input['session_number']) &&
                (!isset($input['title']) || trim((string) $input['title']) === '')
            )
        ) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        ensureSessionNumberColumn($conn);

        $sessionType = $input['session_type'];
        $sessionDate = $input['session_date'];
        $sessionNumber = isset($input['session_number']) ? (int) $input['session_number'] : null;

        if ($sessionNumber !== null && $sessionNumber > 0) {
            $validation = validateSessionNumberForSave($conn, $sessionNumber, null, $sessionType);
            if (!$validation['valid']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $validation['message']]);
                exit;
            }
            $title = buildSessionTitle($sessionNumber, $sessionType);
        } else {
            $title = trim($input['title'] ?? '');
            $parsedNumber = parseSessionNumberFromTitle($title);
            if ($parsedNumber !== null && $parsedNumber > 0) {
                $sessionNumber = $parsedNumber;
            }
        }

        if ($title === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }
        // Handle both start_time/end_time (for compatibility) and actual_start_time/actual_end_time
        $actualStart = null;
        $actualEnd = null;
        if (isset($input['actual_start_time']) && isset($input['actual_end_time'])) {
            $actualStart = $input['actual_start_time'];
            $actualEnd = $input['actual_end_time'];
        } else if (isset($input['actual_start']) && isset($input['actual_end'])) {
            $actualStart = $input['actual_start'];
            $actualEnd = $input['actual_end'];
        } else if (isset($input['start_time']) && isset($input['end_time'])) {
            $actualStart = $input['start_time'];
            $actualEnd = $input['end_time'];
        }
        $venue = isset($input['venue']) ? trim($input['venue']) : null;
        $venueId = isset($input['venue_id']) ? intval($input['venue_id']) : null;
        $presidingOfficer = isset($input['presiding_officer']) ? trim($input['presiding_officer']) : null;
        $status = isset($input['status']) ? $input['status'] : 'Scheduled';
        $statusReason = isset($input['status_reason']) ? trim($input['status_reason']) : null;

        // If venue_id is provided, fetch the venue name from venues table
        if ($venueId !== null && $venueId > 0) {
            $venueStmt = $conn->prepare("SELECT venue_name FROM venues WHERE id = ? AND status = 'Active'");
            if ($venueStmt) {
                $venueStmt->bind_param("i", $venueId);
                $venueStmt->execute();
                $venueResult = $venueStmt->get_result();
                if ($venueRow = $venueResult->fetch_assoc()) {
                    $venue = $venueRow['venue_name'];
                }
                $venueStmt->close();
            }
        }

        // Validate session type
        $validTypes = ['Regular Session', 'Special Session', 'Emergency Session'];
        if (!in_array($sessionType, $validTypes)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid session type']);
            exit;
        }

        // Validate status
        $validStatuses = ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'];
        if (!in_array($status, $validStatuses)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            exit;
        }

        // Build dynamic INSERT query based on available fields
        $fields = ['title', 'session_type', 'session_date', 'status', 'created_by', 'session_status'];
        $values = [$title, $sessionType, $sessionDate, $status, $_SESSION['user_id'], 'Active'];
        $types = 'ssssis';

        if ($sessionNumber !== null && $sessionNumber > 0) {
            $fields[] = 'session_number';
            $values[] = $sessionNumber;
            $types .= 'i';
        }

        if ($actualStart && $actualEnd) {
            $fields[] = 'actual_start_time';
            $fields[] = 'actual_end_time';
            $values[] = $actualStart;
            $values[] = $actualEnd;
            $types .= 'ss';
        }

        if ($venueId !== null && $venueId > 0) {
            $fields[] = 'venue_id';
            $values[] = $venueId;
            $types .= 'i';
        }

        if ($venue) {
            $fields[] = 'venue';
            $values[] = $venue;
            $types .= 's';
        }

        if ($presidingOfficer) {
            $fields[] = 'presiding_officer';
            $values[] = $presidingOfficer;
            $types .= 's';
        }

        // Build dynamic INSERT query based on available fields
        $fieldsStr = implode(', ', $fields);
        $placeholders = implode(', ', array_fill(0, count($values), '?'));

        $stmt = $conn->prepare("INSERT INTO sessions ($fieldsStr) VALUES ($placeholders)");
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            $sessionId = $conn->insert_id;

            // Log Activity
            try {
                $log_uid = $_SESSION['user_id'] ?? 0;
                $log_act = "Create Session";
                $log_desc = "Created session: " . $title;
                $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                if ($lstmt) {
                    $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                    $lstmt->execute();
                    $lstmt->close();
                }
            } catch (Exception $e) {
            }

            // Automatically create a reminder batch for this session
            try {
                $creatorId = $_SESSION['user_id'] ?? 0;
                $reminderTitle = $title;
                $sessionDateTime = $sessionDate . ' ' . ($actualStart ?: '00:00:00');
                $readableDate = date('M d, Y', strtotime($sessionDate));
                $readableTime = $actualStart ? date('g:i A', strtotime($actualStart)) : 'TBD';
                $reminderMessage = "Upcoming session: {$title} scheduled for {$readableDate} at {$readableTime}.";

                $targetRoles = 'Super Admin,Admin,Staff'; // Default audience for auto session reminders

                $rbStmt = $conn->prepare("
                    INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                    VALUES (?, ?, ?, 'Session', ?, ?, ?, 'Scheduled')
                ");

                if ($rbStmt) {
                    $rbStmt->bind_param(
                        "ississ",
                        $creatorId,
                        $reminderTitle,
                        $reminderMessage,
                        $sessionId,
                        $targetRoles,
                        $sessionDateTime
                    );
                    if ($rbStmt->execute()) {
                        $batchId = $conn->insert_id;
                        $rbStmt->close();

                        // Create recipients for the selected roles
                        $rolesArray = explode(',', $targetRoles);
                        $rolesArray = array_map('trim', $rolesArray);
                        $placeholdersRoles = implode(',', array_fill(0, count($rolesArray), '?'));

                        $rrStmt = $conn->prepare("
                            INSERT INTO reminder_recipients (batch_id, user_id, status)
                            SELECT ?, user_id, 'Pending'
                            FROM users
                            WHERE status = 'Active' AND user_role IN ($placeholdersRoles)
                        ");

                        if ($rrStmt) {
                            $bindTypes = "i" . str_repeat("s", count($rolesArray));
                            $bindParams = array_merge([$batchId], $rolesArray);
                            $rrStmt->bind_param($bindTypes, ...$bindParams);
                            $rrStmt->execute();
                            $rrStmt->close();
                        }
                    } else {
                        $rbStmt->close();
                    }
                }
            } catch (Exception $e) {
                // Fail silently; session creation should not fail if reminder creation fails
            }

            // Handle Staff Assignment
            if (isset($input['assigned_staff'])) {
                $assignedStaff = $input['assigned_staff'];
                $staffIds = [];

                if ($assignedStaff === 'all') {
                    // Fetch all users with 'User' or 'Staff' role
                    $staffQuery = "SELECT user_id FROM users WHERE user_role IN ('User', 'Staff')";
                    $staffResult = $conn->query($staffQuery);
                    while ($sRow = $staffResult->fetch_assoc()) {
                        $staffIds[] = $sRow['user_id'];
                    }
                } else {
                    $staffIds = array_filter(array_map('intval', explode(',', $assignedStaff)));
                }

                if (!empty($staffIds)) {
                    $insStmt = $conn->prepare("INSERT INTO session_assignments (session_id, user_id) VALUES (?, ?)");
                    foreach ($staffIds as $uId) {
                        $insStmt->bind_param("ii", $sessionId, $uId);
                        $insStmt->execute();
                    }
                    $insStmt->close();
                }
            }

            echo json_encode(['success' => true, 'message' => 'Session created successfully', 'session_id' => $sessionId]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to create session']);
        }

        $stmt->close();
        break;

    case 'PUT':
        // Update session
        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['session_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Session ID is required']);
            exit;
        }

        $sessionId = intval($input['session_id']);
        $userRole = $_SESSION['user_role'] ?? 'User - Committee';
        $currentUserId = $_SESSION['user_id'] ?? 0;

        // Capture old schedule/status so we can detect reschedules and generate a new reminder batch
        $oldSession = null;
        try {
            $oldStmt = $conn->prepare("SELECT title, session_date, actual_start_time, status FROM sessions WHERE session_id = ? LIMIT 1");
            if ($oldStmt) {
                $oldStmt->bind_param("i", $sessionId);
                $oldStmt->execute();
                $oldRes = $oldStmt->get_result();
                $oldSession = $oldRes ? $oldRes->fetch_assoc() : null;
                $oldStmt->close();
            }
        } catch (Exception $e) {}

        if (strcasecmp($userRole, 'Staff') === 0) {
            // Check if user is the creator
            $checkStmt = $conn->prepare("SELECT created_by FROM sessions WHERE session_id = ?");
            $checkStmt->bind_param("i", $sessionId);
            $checkStmt->execute();
            $checkRes = $checkStmt->get_result();
            $isCreator = false;
            if ($checkRes->num_rows === 1) {
                $sData = $checkRes->fetch_assoc();
                if (intval($sData['created_by']) === intval($currentUserId)) {
                    $isCreator = true;
                }
            }
            $checkStmt->close();

            if (!$isCreator) {
                $status = isset($input['status']) ? $input['status'] : null;
                if ($status === null) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Staff can only update status for sessions they did not create']);
                    exit;
                }
                // Restrict to status only
                $sessionIdTemp = $sessionId;
                $input = ['session_id' => $sessionIdTemp, 'status' => $status];
            }
        } elseif ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Unauthorized to update sessions']);
            exit;
        }

        // Handle Assignment Update separately if requested
        if (isset($input['action']) && $input['action'] === 'update_assignments') {
            if (!isset($input['user_ids']) || !is_array($input['user_ids'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'User IDs array is required for assignment update']);
                exit;
            }

            $conn->begin_transaction();
            try {
                // 0. Get old assignments for detailed logging
                $oldUsers = [];
                $oldStmt = $conn->prepare("SELECT sa.user_id, u.user_name FROM session_assignments sa JOIN users u ON sa.user_id = u.user_id WHERE sa.session_id = ?");
                $oldStmt->bind_param("i", $sessionId);
                $oldStmt->execute();
                $oldRes = $oldStmt->get_result();
                while ($row = $oldRes->fetch_assoc()) {
                    $oldUsers[$row['user_id']] = $row['user_name'];
                }
                $oldStmt->close();

                // Delete existing assignments for this session
                $delStmt = $conn->prepare("DELETE FROM session_assignments WHERE session_id = ?");
                $delStmt->bind_param("i", $sessionId);
                $delStmt->execute();
                $delStmt->close();

                // Insert new assignments
                if (!empty($input['user_ids'])) {
                    $insStmt = $conn->prepare("INSERT INTO session_assignments (session_id, user_id) VALUES (?, ?)");
                    foreach ($input['user_ids'] as $uId) {
                        $uIdInt = intval($uId);
                        $insStmt->bind_param("ii", $sessionId, $uIdInt);
                        $insStmt->execute();
                    }
                    $insStmt->close();
                }

                $conn->commit();

                // Calculate Delta for Logging
                $newUsers = [];
                $newIds = $input['user_ids'];
                if (!empty($newIds)) {
                    $placeholders = implode(',', array_fill(0, count($newIds), '?'));
                    $newStmt = $conn->prepare("SELECT user_id, user_name FROM users WHERE user_id IN ($placeholders)");
                    $types = str_repeat('i', count($newIds));
                    $newStmt->bind_param($types, ...$newIds);
                    $newStmt->execute();
                    $newRes = $newStmt->get_result();
                    while ($row = $newRes->fetch_assoc()) {
                        $newUsers[$row['user_id']] = $row['user_name'];
                    }
                    $newStmt->close();
                }

                $added = [];
                $removed = [];
                foreach ($newUsers as $id => $name) {
                    if (!isset($oldUsers[$id])) $added[] = $name;
                }
                foreach ($oldUsers as $id => $name) {
                    if (!isset($newUsers[$id])) $removed[] = $name;
                }

                $log_desc = "Updated staff assignments.";
                $desc_parts = [];
                if (!empty($added)) $desc_parts[] = "User added: " . implode(', ', $added);
                if (!empty($removed)) $desc_parts[] = "User removed: " . implode(', ', $removed);
                if (!empty($desc_parts)) {
                    $log_desc = implode(" | ", $desc_parts);
                } else if (empty($oldUsers) && empty($newUsers)) {
                    $log_desc = "Cleared all staff assignments";
                } else {
                    $log_desc = "No changes to staff assignments";
                }

                // Log Activity
                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Update Assignments";
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                echo json_encode(['success' => true, 'message' => 'Assignments updated successfully']);
                exit;
            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update assignments: ' . $e->getMessage()]);
                exit;
            }
        }

        $title = isset($input['title']) ? trim($input['title']) : null;
        $sessionType = isset($input['session_type']) ? $input['session_type'] : null;
        $sessionDate = isset($input['session_date']) ? $input['session_date'] : null;
        $sessionNumber = isset($input['session_number']) ? (int) $input['session_number'] : null;

        ensureSessionNumberColumn($conn);

        $currentSessionNumber = null;
        if ($sessionNumber !== null && $sessionNumber > 0) {
            $currentStmt = $conn->prepare("SELECT session_number, session_type FROM sessions WHERE session_id = ?");
            if ($currentStmt) {
                $currentStmt->bind_param('i', $sessionId);
                $currentStmt->execute();
                $currentResult = $currentStmt->get_result();
                if ($currentRow = $currentResult->fetch_assoc()) {
                    if (!empty($currentRow['session_number'])) {
                        $currentSessionNumber = (int) $currentRow['session_number'];
                    }
                    if ($sessionType === null) {
                        $sessionType = $currentRow['session_type'];
                    }
                }
                $currentStmt->close();
            }

            $validation = validateSessionNumberForSave(
                $conn,
                $sessionNumber,
                $sessionId,
                $sessionType,
                $currentSessionNumber
            );
            if (!$validation['valid']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $validation['message']]);
                exit;
            }
        }

        if ($sessionNumber !== null && $sessionNumber > 0 && $sessionType !== null) {
            $title = buildSessionTitle($sessionNumber, $sessionType);
        } elseif ($title !== null && $title !== '') {
            $parsedNumber = parseSessionNumberFromTitle($title);
            if ($parsedNumber !== null && $parsedNumber > 0) {
                $sessionNumber = $parsedNumber;
            }
        }
        // Handle both actual_start/actual_end and start_time/end_time for compatibility
        // Note: DB columns `actual_start_time` / `actual_end_time` are TIME, so we must store time-only values.
        $actualStart = isset($input['actual_start']) ? $input['actual_start'] : null;
        $actualEnd = isset($input['actual_end']) ? $input['actual_end'] : null;
        if (!$actualStart && isset($input['start_time'])) {
            $actualStart = $input['start_time'];
        }
        if (!$actualEnd && isset($input['end_time'])) {
            $actualEnd = $input['end_time'];
        }

        // Normalize datetime-ish inputs to time-only (e.g. "2026-02-25 03:10:00" -> "03:10:00")
        if (is_string($actualStart) && (strpos($actualStart, ' ') !== false || strpos($actualStart, 'T') !== false)) {
            $actualStart = preg_split('/[ T]/', $actualStart)[1] ?? $actualStart;
        }
        if (is_string($actualEnd) && (strpos($actualEnd, ' ') !== false || strpos($actualEnd, 'T') !== false)) {
            $actualEnd = preg_split('/[ T]/', $actualEnd)[1] ?? $actualEnd;
        }
        $venue = isset($input['venue']) ? trim($input['venue']) : null;
        $venueId = isset($input['venue_id']) ? intval($input['venue_id']) : null;
        $presidingOfficer = isset($input['presiding_officer']) ? trim($input['presiding_officer']) : null;
        $status = isset($input['status']) ? $input['status'] : null;

        // If venue_id is provided, fetch the venue name from venues table
        if ($venueId !== null && $venueId > 0) {
            $venueStmt = $conn->prepare("SELECT venue_name FROM venues WHERE id = ? AND status = 'Active'");
            $venueStmt->bind_param("i", $venueId);
            $venueStmt->execute();
            $venueResult = $venueStmt->get_result();
            if ($venueRow = $venueResult->fetch_assoc()) {
                $venue = $venueRow['venue_name'];
            }
            $venueStmt->close();
        }

        // Build dynamic update query
        $updates = [];
        $params = [];
        $types = '';

        if ($title !== null) {
            $updates[] = "title = ?";
            $params[] = $title;
            $types .= 's';
        }
        if ($sessionType !== null) {
            $updates[] = "session_type = ?";
            $params[] = $sessionType;
            $types .= 's';
        }
        if ($sessionNumber !== null && $sessionNumber > 0) {
            $updates[] = "session_number = ?";
            $params[] = $sessionNumber;
            $types .= 'i';
        }
        if ($sessionDate !== null) {
            $updates[] = "session_date = ?";
            $params[] = $sessionDate;
            $types .= 's';
        }
        if ($actualStart !== null) {
            $updates[] = "actual_start_time = ?";
            $params[] = $actualStart;
            $types .= 's';
        }
        if ($actualEnd !== null) {
            $updates[] = "actual_end_time = ?";
            $params[] = $actualEnd;
            $types .= 's';
        }
        if ($venueId !== null && $venueId > 0) {
            $updates[] = "venue_id = ?";
            $params[] = $venueId;
            $types .= 'i';
        }
        if ($venue !== null) {
            $updates[] = "venue = ?";
            $params[] = $venue;
            $types .= 's';
        }
        if ($presidingOfficer !== null) {
            $updates[] = "presiding_officer = ?";
            $params[] = $presidingOfficer;
            $types .= 's';
        }
        if ($status !== null) {
            $updates[] = "status = ?";
            $params[] = $status;
            $types .= 's';
        }
        $sessionStatus = isset($input['session_status']) ? $input['session_status'] : null;
        if ($sessionStatus !== null) {
            $updates[] = "session_status = ?";
            $params[] = $sessionStatus;
            $types .= 's';
        }
        $checkCol = $conn->query("SHOW COLUMNS FROM sessions LIKE 'assigned_staff'");
        $hasAssignedStaff = $checkCol->num_rows > 0;

        if (isset($input['assigned_staff']) && $hasAssignedStaff) {
            $updates[] = "assigned_staff = ?";
            $params[] = $input['assigned_staff'];
            $types .= 's';
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }

        $types .= 'i'; // for session_id
        $params[] = $sessionId;

        $sql = "UPDATE sessions SET " . implode(', ', $updates) . " WHERE session_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            // Log Activity
            try {
                $log_uid = $_SESSION['user_id'] ?? 0;
                $log_act = "Update Session";
                $log_desc = "Updated details for session ID $sessionId";
                
                if ($sessionStatus === 'Active') {
                    $log_act = "Restore Session";
                    $log_desc = "Restored session ID $sessionId from Inactive status";
                } elseif ($status !== null) {
                    $log_desc = "Updated status for session ID $sessionId to $status";
                }

                $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                if ($lstmt) {
                    $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                    $lstmt->execute();
                    $lstmt->close();
                }
            } catch (Exception $e) {}

            // If the schedule changed (rescheduled), create a NEW reminder batch so recipients see it as a fresh notification
            try {
                if ($oldSession) {
                    $oldDate = $oldSession['session_date'] ?? null;
                    $oldStart = $oldSession['actual_start_time'] ?? null;
                    $oldStatus = $oldSession['status'] ?? null;

                    $newDate = $sessionDate !== null ? $sessionDate : $oldDate;
                    $newStartRaw = $actualStart !== null ? $actualStart : $oldStart;
                    // Normalize to HH:MM:SS if a datetime string was passed in
                    $newStart = $newStartRaw;
                    if (is_string($newStart) && strpos($newStart, ' ') !== false) {
                        $parts = explode(' ', $newStart);
                        $newStart = end($parts);
                    }
                    if (!$newStart) $newStart = '00:00:00';

                    $oldStartNorm = $oldStart ?: '00:00:00';
                    $oldDateTime = ($oldDate ? ($oldDate . ' ' . $oldStartNorm) : null);
                    $newDateTime = ($newDate ? ($newDate . ' ' . $newStart) : null);

                    $statusChangedToScheduled = ($status !== null && $status === 'Scheduled' && $oldStatus !== 'Scheduled');
                    $scheduleChanged = ($oldDateTime && $newDateTime && $oldDateTime !== $newDateTime);

                    if ($scheduleChanged || $statusChangedToScheduled) {
                        $titleNow = $oldSession['title'] ?? ('Session #' . $sessionId);
                        $oldReadable = $oldDate ? (date('M d, Y', strtotime($oldDate)) . ' ' . ($oldStartNorm !== '00:00:00' ? date('g:i A', strtotime($oldStartNorm)) : 'TBD')) : 'TBD';
                        $newReadable = $newDate ? (date('M d, Y', strtotime($newDate)) . ' ' . ($newStart !== '00:00:00' ? date('g:i A', strtotime($newStart)) : 'TBD')) : 'TBD';

                        // Keep title clean (no "Session Rescheduled" prefix); put details in the message instead
                        $rbTitle = $titleNow;
                        $rbMessage = "Session has been rescheduled.\n\nSession: {$titleNow}\nPrevious: {$oldReadable}\nNew: {$newReadable}";

                        $targetRoles = 'Super Admin,Admin,Staff';

                        $rbStmt = $conn->prepare("
                            INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status)
                            VALUES (?, ?, ?, 'Session', ?, ?, NOW(), 'Sent')
                        ");

                        if ($rbStmt) {
                            $rbStmt->bind_param("issis", $currentUserId, $rbTitle, $rbMessage, $sessionId, $targetRoles);
                            if ($rbStmt->execute()) {
                                $batchId = $conn->insert_id;
                                $rbStmt->close();

                                // Create recipients for the selected roles (unread/pending)
                                $rolesArray = array_map('trim', explode(',', $targetRoles));
                                $placeholdersRoles = implode(',', array_fill(0, count($rolesArray), '?'));

                                $rrStmt = $conn->prepare("
                                    INSERT INTO reminder_recipients (batch_id, user_id, status)
                                    SELECT ?, user_id, 'Pending'
                                    FROM users
                                    WHERE status = 'Active' AND user_role IN ($placeholdersRoles)
                                ");

                                if ($rrStmt) {
                                    $bindTypes = "i" . str_repeat("s", count($rolesArray));
                                    $bindParams = array_merge([$batchId], $rolesArray);
                                    $rrStmt->bind_param($bindTypes, ...$bindParams);
                                    $rrStmt->execute();
                                    $rrStmt->close();
                                }
                            } else {
                                $rbStmt->close();
                            }
                        }
                    }
                }
            } catch (Exception $e) {}

            // If execution status moved to a terminal state, remove all deadlines linked to this session's agenda items
            try {
                $terminalStatuses = ['Missed', 'Completed', 'Cancelled', 'Canceled', 'Postponed'];
                if ($status !== null && in_array($status, $terminalStatuses, true)) {
                    $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE session_id = " . intval($sessionId));
                    if ($itemsRes) {
                        while ($itemRow = $itemsRes->fetch_assoc()) {
                            $itemId = (int)$itemRow['agenda_item_id'];
                            $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                            $conn->query("DELETE FROM deadlines WHERE description LIKE '$deadlineSearch'");
                        }
                    }
                }
            } catch (Exception $e) {
                // Don't block the update if deadline cleanup fails
            }

            echo json_encode(['success' => true, 'message' => 'Session updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update session']);
        }

        $stmt->close();
        break;

    case 'DELETE':
        // Delete session (soft or permanent)
        $input = json_decode(file_get_contents('php://input'), true);

        $userRole = $_SESSION['user_role'] ?? 'User - Committee';
        $currentUserId = $_SESSION['user_id'] ?? 0;
        $permanent = !empty($input['permanent']);

        if (!isset($input['session_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Session ID is required']);
            exit;
        }

        $sessionId = intval($input['session_id']);

        // Check permissions: Administrator or Creator
        if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0 && strcasecmp($userRole, 'Administrator') !== 0)) {
            $checkStmt = $conn->prepare("SELECT created_by FROM sessions WHERE session_id = ?");
            $checkStmt->bind_param("i", $sessionId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            
            if ($checkResult->num_rows === 1) {
                $sessionData = $checkResult->fetch_assoc();
                if (intval($sessionData['created_by']) !== intval($currentUserId)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Unauthorized: Only the creator or administrator can delete this session']);
                    $checkStmt->close();
                    exit;
                }
            }
            $checkStmt->close();
        }

        // Get session for logging
        $checkStmt = $conn->prepare("SELECT session_status, title FROM sessions WHERE session_id = ?");
        $checkStmt->bind_param("i", $sessionId);
        $checkStmt->execute();
        $session = $checkStmt->get_result()->fetch_assoc();
        $checkStmt->close();

        if (!$session) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Session not found']);
            exit;
        }

        $doPermanent = $permanent || $session['session_status'] === 'Inactive';

        try {
            if ($doPermanent) {
                // Permanent delete - cleanup reminders/deadlines first, then related tables, then session
                $conn->begin_transaction();
                try {
                    try {
                        $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Session' AND related_id = $sessionId");
                        $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Agenda' AND related_id IN (SELECT agenda_id FROM agendas WHERE session_id = $sessionId)");
                        $conn->query("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id IN (SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId)");
                        $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId");
                        if ($itemsRes) {
                            while ($itemRow = $itemsRes->fetch_assoc()) {
                                $itemId = (int)$itemRow['agenda_item_id'];
                                $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                                $conn->query("DELETE FROM deadlines WHERE description LIKE '$deadlineSearch'");
                            }
                        }
                    } catch (Exception $e) {}

                    $cleanStmt = $conn->prepare("DELETE FROM agenda_items WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM agendas WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM session_status_history WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM session_attendance WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM session_minutes WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM session_documents WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $cleanStmt = $conn->prepare("DELETE FROM session_assignments WHERE session_id = ?");
                    $cleanStmt->bind_param("i", $sessionId);
                    $cleanStmt->execute();
                    $cleanStmt->close();

                    $stmt = $conn->prepare("DELETE FROM sessions WHERE session_id = ?");
                    $stmt->bind_param("i", $sessionId);
                    $stmt->execute();
                    $stmt->close();

                    $conn->commit();

                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Permanent Delete Session";
                        $log_desc = "Permanently deleted session: " . $session['title'];
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Session permanently deleted']);
                } catch (Exception $e) {
                    $conn->rollback();
                    throw $e;
                }
            } else {
                // Soft delete
            $stmt = $conn->prepare("UPDATE sessions SET session_status = 'Inactive' WHERE session_id = ?");
            $stmt->bind_param("i", $sessionId);

            if ($stmt->execute()) {
                try {
                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Session' AND related_id = $sessionId");
                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'Agenda' AND related_id IN (SELECT agenda_id FROM agendas WHERE session_id = $sessionId)");
                    $conn->query("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id IN (SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId)");
                    $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE session_id = $sessionId");
                        if ($itemsRes) {
                    while ($itemRow = $itemsRes->fetch_assoc()) {
                        $itemId = $itemRow['agenda_item_id'];
                        $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                        $conn->query("DELETE FROM deadlines WHERE description LIKE '$deadlineSearch'");
                            }
                    }
                } catch (Exception $e) {}

                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Soft Delete Session";
                    $log_desc = "Moved session ID $sessionId to Inactive status";
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                echo json_encode(['success' => true, 'message' => 'Session moved to inactive status successfully']);
            } else {
                throw new Exception("Failed to update session status: " . $stmt->error);
            }
            $stmt->close();
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to delete session: ' . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

$conn->close();
