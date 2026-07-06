<?php
// api_otp_verify.php
// Verifies the 6-digit OTP and authenticates the user session

session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? ($_SESSION['temp_user_id'] ?? null);
$otp = $input['otp'] ?? '';

if (!$userId || !$otp) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User identity and OTP are required']);
    exit;
}

$conn = getDBConnection();

try {
    // 1. Check if OTP matches and is not expired/already used
    $stmt = $conn->prepare("SELECT id FROM user_otps 
                            WHERE user_id = ? AND otp_code = ? 
                            AND is_verified = 0 AND expires_at > NOW() 
                            ORDER BY created_at DESC LIMIT 1");
    $stmt->bind_param("is", $userId, $otp);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $otpRow = $result->fetch_assoc();

        // 2. Mark OTP as verified
        $stmt = $conn->prepare("UPDATE user_otps SET is_verified = 1 WHERE id = ?");
        $stmt->bind_param("i", $otpRow['id']);
        $stmt->execute();

        // 3. Finalize Login Session
        // Fetch user data including the PREVIOUS last_login before updating it
        $stmt = $conn->prepare("SELECT user_id, username, user_name, user_role, email, last_login FROM users WHERE user_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        // 4. Update last_login to NOW() for NEXT time
        $updateStmt = $conn->prepare("UPDATE users SET last_login = NOW() WHERE user_id = ?");
        $updateStmt->bind_param("i", $userId);
        $updateStmt->execute();

        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['user_name'] = $user['user_name'];
        $_SESSION['user_role'] = $user['user_role'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['last_login'] = $user['last_login'];
        $_SESSION['is_logged_in'] = true;

        // Clear temp data
        unset($_SESSION['temp_user_id']);

        echo json_encode([
            'success' => true,
            'message' => 'Verification successful',
            'user' => [
                'id' => $user['user_id'],
                'email' => $user['email'],
                'name' => $user['user_name'],
                'role' => $user['user_role'],
                'last_login' => $user['last_login']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired code. Please try again.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Verification error: ' . $e->getMessage()]);
}

$conn->close();
?>