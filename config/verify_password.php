<?php
// verify_password.php
// Simple endpoint to verify the currently logged-in user's password

session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['password']) || trim($input['password']) === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password is required']);
    exit;
}

$password = $input['password'];
$userId = (int) $_SESSION['user_id'];

// Database connection
$conn = getDBConnection();

try {
    $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("i", $userId);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();
    if ($result->num_rows !== 1) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $user = $result->fetch_assoc();
    $hash = $user['password_hash'];

    $isValid = false;
    if (password_verify($password, $hash)) {
        $isValid = true;
    } elseif ($password === $hash) {
        // Legacy/plaintext fallback (matches auth_login.php behaviour)
        $isValid = true;
    }

    if ($isValid) {
        echo json_encode(['success' => true, 'message' => 'Password verified']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Incorrect password']);
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>

