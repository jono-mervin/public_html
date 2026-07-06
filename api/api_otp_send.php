<?php
// api_otp_send.php
// Generates and sends a 6-digit OTP to the user's email

session_start();
require_once '../config/config.php';
require_once '../config/mail_config.php';

header('Content-Type: application/json');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['user_id'] ?? ($_SESSION['temp_user_id'] ?? null);

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'User identity required']);
    exit;
}

$conn = getDBConnection();

try {
    // 1. Fetch user email
    $stmt = $conn->prepare("SELECT email, user_name FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || empty($user['email'])) {
        throw new Exception("User email not found");
    }

    $email = $user['email'];
    $name = $user['user_name'];

    // 2. Generate 6-digit OTP
    $otp = sprintf("%06d", mt_rand(0, 999999));

    // 3. Store OTP in database (create table if not exists - better to do in init but here for safety)
    $conn->query("CREATE TABLE IF NOT EXISTS user_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_verified TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (otp_code)
    )");

    // Invalidate previous OTPs
    $stmt = $conn->prepare("UPDATE user_otps SET is_verified = 1 WHERE user_id = ? AND is_verified = 0");
    $stmt->bind_param("i", $userId);
    $stmt->execute();

    // Insert new OTP with dynamic expiry using DB time
    $expiryMinutes = (int)getSystemSetting('otp_expiry_minutes', '2');
    if ($expiryMinutes <= 0) $expiryMinutes = 2; // Fallback
    $stmt = $conn->prepare("INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))");
    $stmt->bind_param("isi", $userId, $otp, $expiryMinutes);
    $stmt->execute();

    // 4. Send Email via PHPMailer
    $mail = getMailer();
    $mail->addAddress($email, $name);
    $mail->isHTML(true);
    $mail->Subject = 'Your Verification Code - LACS';

    $mail->Body = "
        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px; text-align: center;'>
            <h2 style='color: #dc2626; margin-bottom: 24px;'>Login Verification</h2>
            <p style='color: #4b5563; font-size: 16px; line-height: 1.5;'>To complete your login, please enter the following verification code:</p>
            <div style='background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 20px; margin: 30px 0;'>
                <span style='font-size: 32px; font-weight: 800; color: #dc2626; letter-spacing: 12px;'>{$otp}</span>
            </div>
            <p style='color: #9ca3af; font-size: 12px;'>This code will expire in {$expiryMinutes} minutes. If you did not request this, please ignore this email.</p>
        </div>
    ";

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'OTP sent successfully to your registered email'
    ]);

} catch (Exception $e) {
    error_log("OTP Send Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send OTP: ' . $e->getMessage()]);
}

$conn->close();
?>