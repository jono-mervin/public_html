<?php
// api_automate_deadlines.php
// Handle automated creation of deadlines from other modules
session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

// Check auth
$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate required fields
    if (empty($input['title']) || empty($input['due_date'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title and Due Date are required']);
        exit;
    }

    $title = $input['title'];
    $description = $input['description'] ?? '';
    // Append context to description if from agenda
    if (!empty($input['agenda_id'])) {
        $description .= "\n\n(Linked to Agenda Item ID: " . $input['agenda_id'] . ")";
    }

    $dueDate = $input['due_date'];
    $assignedTo = !empty($input['assigned_to']) ? intval($input['assigned_to']) : null;
    $priority = $input['priority'] ?? 'Medium';
    $status = 'Pending';

    // Insert into deadlines table
    $sql = "INSERT INTO deadlines (title, description, due_date, assigned_to, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }

    $stmt->bind_param("sssiss", $title, $description, $dueDate, $assignedTo, $priority, $status);

    if ($stmt->execute()) {
        $deadlineId = $conn->insert_id;
        echo json_encode([
            'success' => true,
            'message' => 'Deadline created successfully',
            'deadline_id' => $deadlineId
        ]);

        // TODO: Add notification logic here if assignedTo is set
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create deadline: ' . $stmt->error]);
    }

    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>