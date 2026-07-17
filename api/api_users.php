<?php
// api_users.php
// Disable error display to prevent HTML output breaking JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once '../config/config.php';
header('Content-Type: application/json');

// Auth Check (Admin only for most ops, but self-read allowed)
$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $userId = isset($_GET['id']) ? intval($_GET['id']) : null;
        if ($userId) {
            $stmt = $conn->prepare("SELECT user_id, username, user_name, user_role, email, avatar_url, last_login, status FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                echo json_encode(['success' => true, 'user' => $row]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
            }
        } else {
            // List all users (admin only ideally, or restricted fields)
            $result = $conn->query("SELECT user_id, username, user_name, user_role, email, avatar_url, last_login, status FROM users ORDER BY user_name");
            $users = [];
            while ($row = $result->fetch_assoc()) {
                $users[] = $row;
            }
            echo json_encode(['success' => true, 'users' => $users]);
        }
        break;

    case 'POST':
        $action = isset($_GET['action']) ? $_GET['action'] : '';
        $input = json_decode(file_get_contents('php://input'), true);

        if ($action === 'update_profile') {
            if (empty($input['name']) || empty($input['email']) || empty($input['current_pass'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Name, Email, and Password are required']);
                exit;
            }

            $userId = $_SESSION['user_id'];

            // First verify password
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }

            $is_valid = false;
            if (password_verify($input['current_pass'], $user['password_hash'])) {
                $is_valid = true;
            } else if ($input['current_pass'] === $user['password_hash']) {
                $is_valid = true;
            }

            if (!$is_valid) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Incorrect current password']);
                exit;
            }

            // Proceed with update
            $stmt = $conn->prepare("UPDATE users SET user_name = ?, email = ? WHERE user_id = ?");
            $stmt->bind_param("ssi", $input['name'], $input['email'], $userId);

            if ($stmt->execute()) {
                // Update session data
                $_SESSION['user_name'] = $input['name'];
                $_SESSION['email'] = $input['email'];
                echo json_encode(['success' => true, 'message' => 'Profile updated']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Update failed: ' . $conn->error]);
            }
        } else if ($action === 'change_password') {
            if (empty($input['current_pass']) || empty($input['new_pass'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'All password fields are required']);
                exit;
            }

            $userId = $_SESSION['user_id'];
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }

            // Verify current password (supporting both hashed and plain text fallback)
            $is_valid = false;
            if (password_verify($input['current_pass'], $user['password_hash'])) {
                $is_valid = true;
            } else if ($input['current_pass'] === $user['password_hash']) {
                $is_valid = true;
            }

            if (!$is_valid) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Incorrect current password']);
                exit;
            }

            // Password Complexity Validation
            $complexity = getSystemSetting('password_complexity', 'Low');
            $newPass = $input['new_pass'];
            $isValidComplex = true;
            $complexMsg = "";

            if ($complexity === 'Medium') {
                if (strlen($newPass) < 8 || !preg_match('/[A-Z]/', $newPass) || !preg_match('/[a-z]/', $newPass) || !preg_match('/[0-9]/', $newPass)) {
                    $isValidComplex = false;
                    $complexMsg = "Policy: Medium. Password must be at least 8 characters and include uppercase, lowercase, and numbers.";
                }
            } else if ($complexity === 'High') {
                if (strlen($newPass) < 10 || !preg_match('/[A-Z]/', $newPass) || !preg_match('/[a-z]/', $newPass) || !preg_match('/[0-9]/', $newPass) || !preg_match('/[^A-Za-z0-9]/', $newPass)) {
                    $isValidComplex = false;
                    $complexMsg = "Policy: Strict. Password must be at least 10 characters and include uppercase, lowercase, numbers, and special characters.";
                }
            } else {
                if (strlen($newPass) < 6) {
                    $isValidComplex = false;
                    $complexMsg = "Policy: Standard. Password must be at least 6 characters.";
                }
            }

            if (!$isValidComplex) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => $complexMsg]);
                exit;
            }

            // Hash new password and update
            $newHash = password_hash($input['new_pass'], PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
            $updateStmt->bind_param("si", $newHash, $userId);

            if ($updateStmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update password']);
            }
        } else {
            // Default Create User logic (Ideally Admin Only)
            if ($_SESSION['user_role'] !== 'Super Admin' && $_SESSION['user_role'] !== 'Admin' && $_SESSION['user_role'] !== 'Administrator') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Only Admins can create users']);
                exit;
            }

            if (empty($input['username']) || empty($input['email']) || empty($input['password']) || empty($input['user_name']) || empty($input['role'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Missing required fields']);
                exit;
            }

            $stmt = $conn->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
            $stmt->bind_param("ss", $input['username'], $input['email']);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Username or Email already exists']);
                exit;
            }

            $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users (username, password_hash, user_name, user_role, email, status) VALUES (?, ?, ?, ?, ?, 'Active')");
            $stmt->bind_param("sssss", $input['username'], $hashedPassword, $input['user_name'], $input['role'], $input['email']);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'User created', 'user_id' => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
            }
        }
        break;

    case 'PUT':
        // Update User
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }

        // Build dynamic update (simplified)
        $updates = [];
        $params = [];
        $types = "";

        if (isset($input['user_name'])) {
            $updates[] = "user_name = ?";
            $params[] = $input['user_name'];
            $types .= "s";
        }
        if (isset($input['role'])) {
            $updates[] = "user_role = ?";
            $params[] = $input['role'];
            $types .= "s";
        }
        if (isset($input['status'])) {
            $updates[] = "status = ?";
            $params[] = $input['status'];
            $types .= "s";
        }
        if (!empty($input['email'])) {
            $updates[] = "email = ?";
            $params[] = $input['email'];
            $types .= "s";
        }
        if (!empty($input['username'])) {
            $updates[] = "username = ?";
            $params[] = $input['username'];
            $types .= "s";
        }
        if (!empty($input['password'])) {
            $updates[] = "password_hash = ?";
            $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
            $types .= "s";
        }
        // Add more fields as needed

        if (empty($updates)) {
            echo json_encode(['success' => true, 'message' => 'No changes']);
            exit;
        }

        $params[] = $input['user_id'];
        $types .= "i";

        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'User updated']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Update failed']);
        }
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['user_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID required']);
            exit;
        }

        $userId = intval($input['user_id']);

        // Prevent self-deletion
        if ($userId === intval($_SESSION['user_id'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You cannot delete your own account while logged in.']);
            exit;
        }

        // Check for dependencies before deleting
        // We check if this user is a creator or assigned to anything critical
        $checkQueries = [
            'sessions' => 'SELECT COUNT(*) as count FROM sessions WHERE created_by = ?',
            'deadlines' => 'SELECT COUNT(*) as count FROM deadlines WHERE created_by = ? OR assigned_to = ?',
            'audit_logs' => 'SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?'
        ];

        foreach ($checkQueries as $table => $sql) {
            $stmt = $conn->prepare($sql);
            if ($table === 'deadlines') {
                $stmt->bind_param("ii", $userId, $userId);
            } else {
                $stmt->bind_param("i", $userId);
            }
            $stmt->execute();
            $res = $stmt->get_result()->fetch_assoc();
            if ($res['count'] > 0 && $table !== 'audit_logs') { // We allow deleting users with logs usually, or logs should stay
                 echo json_encode(['success' => false, 'message' => "Cannot delete user: They have active records in $table. Please reassign or remove those records first or deactivate the account instead."]);
                 exit;
            }
        }

        $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        
        try {
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            } else {
                throw new Exception($conn->error);
            }
        } catch (Exception $e) {
            http_response_code(500);
            $msg = 'Delete failed: This user may have active assignments or related records that prevent deletion.';
            if (strpos($e->getMessage(), 'foreign key') !== false) {
                $msg = 'Cannot delete user: They have existing assignments or records linked to their account. Try deactivating them instead.';
            }
            echo json_encode(['success' => false, 'message' => $msg]);
        }
        break;
}
$conn->close();