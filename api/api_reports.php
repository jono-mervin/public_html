<?php
// api_reports.php
error_reporting(0);
ini_set('display_errors', 0);

session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']);
if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$response = [];

try {
    // 1. Total Users
    $res = $conn->query("SELECT COUNT(*) as total FROM users");
    $row = $res->fetch_assoc();
    $response['total_users'] = (int) $row['total'];

    // 2. Sessions Stats
    $res = $conn->query("SELECT status, COUNT(*) as count FROM sessions WHERE status != 'Inactive' GROUP BY status");
    $sessions_by_status = [];
    $total_sessions = 0;
    while ($row = $res->fetch_assoc()) {
        $sessions_by_status[$row['status']] = (int) $row['count'];
        $total_sessions += (int) $row['count'];
    }
    $response['sessions_completed'] = $sessions_by_status['Completed'] ?? 0;
    $response['total_sessions'] = $total_sessions;
    $response['completion_rate'] = $total_sessions > 0 ? round(($response['sessions_completed'] / $total_sessions) * 100) : 0;
    $response['distribution'] = $sessions_by_status;

    // 3. Document Count (Active Sessions only)
    $res = $conn->query("SELECT COUNT(*) as total FROM session_documents sd JOIN sessions s ON sd.session_id = s.session_id WHERE s.status != 'Inactive'");
    $row = $res->fetch_assoc();
    $response['docs_processed'] = (int) $row['total'];

    // 4. Monthly Activity (Last 6 months)
    $sql = "SELECT 
                DATE_FORMAT(session_date, '%b') as month, 
                COUNT(*) as count 
            FROM sessions 
            WHERE session_date >= DATE_SUB(LAST_DAY(NOW()), INTERVAL 6 MONTH) AND status != 'Inactive'
            GROUP BY DATE_FORMAT(session_date, '%m')
            ORDER BY session_date ASC";
    $res = $conn->query($sql);
    $monthly_activity = [
        'labels' => [],
        'data' => []
    ];
    while ($row = $res->fetch_assoc()) {
        $monthly_activity['labels'][] = $row['month'];
        $monthly_activity['data'][] = (int) $row['count'];
    }

    // Fill in placeholders if data is sparse to make the chart look better
    if (empty($monthly_activity['labels'])) {
        $monthly_activity = [
            'labels' => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'data' => [0, 0, 0, 0, 0, 0]
        ];
    }

    $response['monthly_activity'] = $monthly_activity;

    echo json_encode(['success' => true, 'data' => $response]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
