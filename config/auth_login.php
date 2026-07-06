<?php
// auth_login.php
// Handle login authentication via AJAX

session_start();
require_once 'config.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];

// Database connection
$conn = getDBConnection();

try {
    // Fetch security settings
    $maxAttempts = (int) getSystemSetting('max_login_attempts', 5);
    $lockoutMins = (int) getSystemSetting('lockout_duration', 15);

    // Prepare statement to prevent SQL injection
    $stmt = $conn->prepare("SELECT user_id, username, password_hash, user_name, user_role, email, failed_attempts, lockout_until, last_login FROM users WHERE username = ? OR email = ?");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ss", $email, $email);

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        // Check for account lockout
        $isAdminRole = (strcasecmp($user['user_role'], 'Admin') === 0 || strcasecmp($user['user_role'], 'Administrator') === 0);

        if ($user['lockout_until'] && strtotime($user['lockout_until']) > time()) {
            $remaining = ceil((strtotime($user['lockout_until']) - time()) / 60);
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => "Account locked due to multiple failed attempts. Please try again in $remaining minute(s)."]);
            exit;
        }

        // Verify password
        $is_valid = false;
        if (password_verify($password, $user['password_hash'])) {
            $is_valid = true;
        } else if ($password === $user['password_hash']) {
            $is_valid = true;
        }


        if ($is_valid) {
            // Check for first-time user agreement
            $isFirstTime = ($user['last_login'] === NULL);
            $hasAgreed = isset($input['agreed']) && $input['agreed'] === true;

            if ($isFirstTime && !$hasAgreed) {
                echo json_encode([
                    'success' => true,
                    'agreement_required' => true,
                    'message' => 'Legal agreement required for first-time login.'
                ]);
                exit;
            }

            // Update last_login if it was the first time
            if ($isFirstTime && $hasAgreed) {
                $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
                $updateStmt->bind_param("i", $user['user_id']);
                $updateStmt->execute();
                $updateStmt->close();
            }


            // SUCCESSFUL LOGIN: Reset failed attempts
            $resetStmt = $conn->prepare("UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE user_id = ?");
            $resetStmt->bind_param("i", $user['user_id']);
            $resetStmt->execute();

            // MAINTENANCE MODE CHECK
            $maintenance_file = __DIR__ . '/maintenance_mode.json';

            if (file_exists($maintenance_file)) {
                $content = file_get_contents($maintenance_file);
                $m_config = json_decode($content, true);

                if (is_array($m_config) && isset($m_config['maintenance_mode']) && $m_config['maintenance_mode'] == true) {
                    // Only legitimate Admins can login
                    $isRealAdmin = (strcasecmp($user['user_role'], 'Admin') === 0 || strcasecmp($user['user_role'], 'Administrator') === 0);

                    if (!$isRealAdmin) {
                        http_response_code(503); // Service Unavailable
                        echo json_encode(['success' => false, 'message' => 'System is currently under maintenance. Only administrators can log in.']);
                        exit;
                    }
                }
            }

            // Require OTP for all roles
            $_SESSION['temp_user_id'] = $user['user_id'];
            $_SESSION['is_logged_in'] = false; // Still false until OTP verified

            // Return success with OTP flag
            echo json_encode([
                'success' => true,
                'otp_required' => true,
                'message' => 'Credentials verified. Verification code required.',
                'user' => [
                    'id' => $user['user_id'],
                    'email' => $user['email'],
                    'name' => $user['user_name']
                ]
            ]);
        } else {
            // INVALID PASSWORD: Track failure
            $newAttempts = (int) $user['failed_attempts'] + 1;
            $lockoutUpdate = "";
            $msg = "Invalid email or password.";

            if ($newAttempts >= $maxAttempts) {
                $lockoutUntil = date('Y-m-d H:i:s', time() + ($lockoutMins * 60));
                $lockoutUpdate = ", lockout_until = '$lockoutUntil'";
                $msg = "Maximum login attempts reached. Account locked for $lockoutMins minute(s).";
            } else {
                $remaining = $maxAttempts - $newAttempts;
                $msg .= " $remaining attempt(s) remaining before lockout.";
            }

            $updateAttemptStmt = $conn->prepare("UPDATE users SET failed_attempts = ? $lockoutUpdate WHERE user_id = ?");
            $updateAttemptStmt->bind_param("ii", $newAttempts, $user['user_id']);
            $updateAttemptStmt->execute();

            http_response_code(401);
            echo json_encode(['success' => false, 'message' => $msg]);
        }
    } else {
        // User not found
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

$conn->close();
?>