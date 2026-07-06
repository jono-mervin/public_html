<?php
// api_venues.php
// Handle venues CRUD operations

session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    switch ($method) {
        case 'GET':
            // Get all active venues
            $status = isset($_GET['status']) ? $_GET['status'] : 'Active';
            $stmt = $conn->prepare("SELECT id, venue_name, address, venue_type, capacity, status FROM venues WHERE status = ? ORDER BY venue_name");
            $stmt->bind_param("s", $status);
            $stmt->execute();
            $result = $stmt->get_result();
            $venues = [];
            while ($row = $result->fetch_assoc()) {
                $venues[] = $row;
            }
            $stmt->close();
            echo json_encode(['success' => true, 'venues' => $venues]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
