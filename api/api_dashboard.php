<?php
// api_dashboard.php
session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']);
if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

try {
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    $response = [];
    $userRole = $_SESSION['user_role'] ?? 'User - Committee';
    $userId = $_SESSION['user_id'] ?? 0;
    if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0) && strcasecmp($userRole, 'Staff') !== 0) {
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM sessions s JOIN session_assignments sa ON s.session_id = sa.session_id WHERE s.status = 'Scheduled' AND sa.user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $res = $stmt->get_result();
    } else {
        $sql = "SELECT COUNT(*) as total FROM sessions WHERE status = 'Scheduled'";
        $res = $conn->query($sql);
    }

    if (!$res) {
        throw new Exception('Error querying sessions: ' . $conn->error);
    }
    $row = $res->fetch_assoc();
    $response['active_sessions'] = $row['total'] ?? 0;

    // 2. Tasks/Deadlines Stats (Pending)
    if ((strcasecmp($userRole, 'Super Admin') === 0 || strcasecmp($userRole, 'Admin') === 0)) {
        // Admin sees all pending deadlines
        $sql = "SELECT COUNT(*) as total FROM deadlines WHERE status = 'Pending' OR status = 'In Progress'";
        $res = $conn->query($sql);
        $row = $res->fetch_assoc();
        $response['pending_tasks'] = $row['total'] ?? 0;

        // Admin sees all reminder batches
        $sql = "SELECT COUNT(*) as total FROM reminder_batches WHERE status = 'Scheduled'";
        $res = $conn->query($sql);
        $row = $res->fetch_assoc();
        $response['total_reminders'] = $row['total'] ?? 0;
    } else {
        // Staff/User sees only their assigned unread notifications
        // We use reminder_recipients for personal notifications
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM reminder_recipients WHERE user_id = ? AND status = 'Pending'");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $response['pending_tasks'] = $row['total'] ?? 0;
        $response['total_reminders'] = $row['total'] ?? 0;
    }

    // 3. Document Count (Session Docs + AI Docs)
    $sql1 = "SELECT COUNT(*) as total FROM session_documents sd JOIN sessions s ON sd.session_id = s.session_id WHERE s.status != 'Inactive'";
    $res1 = $conn->query($sql1);
    if (!$res1)
        throw new Exception('Error querying session documents: ' . $conn->error);
    $row1 = $res1->fetch_assoc();
    $sessionDocs = $row1['total'] ?? 0;

    $sql2 = "SELECT COUNT(*) as total FROM ai_documents";
    $res2 = $conn->query($sql2);
    if (!$res2)
        throw new Exception('Error querying ai documents: ' . $conn->error);
    $row2 = $res2->fetch_assoc();
    $aiDocs = $row2['total'] ?? 0;

    $response['docs_processed'] = $sessionDocs + $aiDocs;

    // 3.1 Total Agendas (Active Sessions only)
    $sql = "SELECT COUNT(*) as total FROM agendas a JOIN sessions s ON a.session_id = s.session_id WHERE s.status != 'Inactive'";
    $res = $conn->query($sql);
    if (!$res)
        throw new Exception('Error querying agendas: ' . $conn->error);
    $row = $res->fetch_assoc();
    $response['total_agendas'] = $row['total'] ?? 0;

    // 3.2 Active Users
    $sql = "SELECT COUNT(*) as total FROM users WHERE status = 'Active'";
    $res = $conn->query($sql);
    if (!$res)
        throw new Exception('Error querying users: ' . $conn->error);
    $row = $res->fetch_assoc();
    $response['active_users'] = $row['total'] ?? 0;

    // 4. Recent Activities - same for all roles
    $sql = "SELECT l.action, u.user_name, l.created_at FROM audit_logs l LEFT JOIN users u ON l.user_id = u.user_id";
    $sql .= " ORDER BY l.created_at DESC LIMIT 5";

    $res = $conn->query($sql);
    if (!$res) {
        throw new Exception('Error querying audit logs: ' . $conn->error);
    }
    $activities = [];
    while ($row = $res->fetch_assoc()) {
        $activities[] = $row;
    }
    $response['recent_activities'] = $activities;

    // 5. Upcoming Sessions (For Sidebar)
    if ((strcasecmp($userRole, 'Super Admin') !== 0 && strcasecmp($userRole, 'Admin') !== 0) && strcasecmp($userRole, 'Staff') !== 0) {
        $sql = "SELECT s.*, u.user_name as creator_name FROM sessions s JOIN session_assignments sa ON s.session_id = sa.session_id LEFT JOIN users u ON s.created_by = u.user_id WHERE s.status = 'Scheduled' AND sa.user_id = ? ORDER BY s.session_date ASC LIMIT 3";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $res = $stmt->get_result();
    } else {
        $sql = "SELECT s.*, u.user_name as creator_name FROM sessions s LEFT JOIN users u ON s.created_by = u.user_id WHERE s.status = 'Scheduled' ORDER BY s.session_date ASC LIMIT 3";
        $res = $conn->query($sql);
    }

    if (!$res) {
        throw new Exception('Error querying upcoming sessions: ' . $conn->error);
    }
    $upcoming = [];
    while ($row = $res->fetch_assoc()) {
        $row['day'] = date('d', strtotime($row['session_date']));
        $row['month'] = date('M', strtotime($row['session_date']));
        // Format time from actual_start_time if available
        if (isset($row['actual_start_time']) && $row['actual_start_time']) {
            $row['time_formatted'] = date('g:i A', strtotime($row['actual_start_time']));
        } else {
            $row['time_formatted'] = 'TBD';
        }
        // Get assigned staff for dashboard
        $staffDashStmt = $conn->prepare("
            SELECT u.user_id, u.user_name 
            FROM session_assignments sa 
            JOIN users u ON sa.user_id = u.user_id 
            WHERE sa.session_id = ? AND u.user_role = 'User'
        ");
        $staffDashStmt->bind_param("i", $row['session_id']);
        $staffDashStmt->execute();
        $staffDashResult = $staffDashStmt->get_result();
        $assignedStaff = [];
        while ($staffRow = $staffDashResult->fetch_assoc()) {
            $assignedStaff[] = $staffRow;
        }
        $row['assigned_staff'] = $assignedStaff;
        $row['assigned_staff_names'] = array_column($assignedStaff, 'user_name');
        $staffDashStmt->close();

        $upcoming[] = $row;
    }
    $response['upcoming_sessions'] = $upcoming;

    // 6. Chart Data
    $response['session_frequency'] = [4, 6, 5, 8, 6, 9];

    echo json_encode(['success' => true, 'data' => $response]);
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    if (isset($conn)) {
        $conn->close();
    }
}
?>