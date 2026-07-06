<?php
// api_logs.php
// Disable error display to prevent HTML output breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once '../config/config.php';
header('Content-Type: application/json');

$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']);
if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}

$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Parameters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 100;
    if ($limit > 500)
        $limit = 500; // Cap limit

    $whereSQL = "WHERE 1=1";
    $params = [];
    $types = "";

    if (!empty($search)) {
        $whereSQL .= " AND (u.user_name LIKE ? OR l.action LIKE ? OR l.description LIKE ?)";
        $searchTerm = "%$search%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }

    // Entity filters
    if (isset($_GET['entity_type']) && !empty($_GET['entity_type'])) {
        $whereSQL .= " AND l.entity_type = ?";
        $params[] = $_GET['entity_type'];
        $types .= "s";
    }

    if (isset($_GET['entity_id']) && !empty($_GET['entity_id'])) {
        $whereSQL .= " AND l.entity_id = ?";
        $params[] = $_GET['entity_id'];
        $types .= "i";
    }

    $sql = "SELECT l.*, u.user_name 
            FROM audit_logs l 
            LEFT JOIN users u ON l.user_id = u.user_id 
            $whereSQL
            ORDER BY l.created_at DESC LIMIT ?";

    $params[] = $limit;
    $types .= "i";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            // Rename 'id' to 'log_id' if needed, or keeping usage consistent
            // Frontend uses log.id (Wait, structure says log_id). 
            // admin-modules.js uses log.id in viewLogDetails(${log.id}).
            // But table has log_id. I should map it or ensure frontend uses log_id.
            $row['id'] = $row['log_id']; // Alias for convenience
            $data[] = $row;
        }

        echo json_encode(['success' => true, 'data' => $data]);
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Query preparation failed']);
    }
}
$conn->close();