<?php
// api_forgot_password.php
// Handle forgot password requests by generating a new temp password and emailing it via PHPMailer

// Load config (DB) first
require_once '../config/config.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

$log_file = __DIR__ . '/../debug_forgot.log';
file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] API Entry: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email']) || empty(trim($input['email']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username or Email is required']);
    exit;
}

$identifier = trim($input['email']);

// Database connection
$conn = getDBConnection();
file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] DB connected successfully\n", FILE_APPEND);

try {
    // Check if user exists (by email or username)
    $stmt = $conn->prepare("SELECT user_id, user_name, email FROM users WHERE username = ? OR email = ?");
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        $user_id = $user['user_id'];
        $user_name = $user['user_name'];
        $user_email = $user['email'];

        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] User found: " . $user_name . " (" . $user_email . ")\n", FILE_APPEND);

        if (empty($user_email)) {
            file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] ERROR: User has no email address set\n", FILE_APPEND);
            echo json_encode([
                'success' => false,
                'message' => 'No email address is associated with this account. Please contact an administrator.'
            ]);
            exit;
        }

        // Generate a random temporary password (10 characters)
        $temp_password = bin2hex(random_bytes(5));
        $hashed_password = password_hash($temp_password, PASSWORD_DEFAULT);

        // Update the password in the database
        $update_stmt = $conn->prepare("UPDATE users SET password_hash = ? WHERE user_id = ?");
        if (!$update_stmt) {
            throw new Exception("Update prepare failed: " . $conn->error);
        }

        $update_stmt->bind_param("si", $hashed_password, $user_id);
        if (!$update_stmt->execute()) {
            throw new Exception("Update execution failed: " . $update_stmt->error);
        }

        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] Password updated in DB for user_id: " . $user_id . "\n", FILE_APPEND);

        // --- PHPMailer Integration ---
        // mail_config.php handles all require_once and use statements for PHPMailer
        require_once '../config/mail_config.php';

        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] mail_config.php loaded, attempting to send email...\n", FILE_APPEND);

        try {
            // Get configured PHPMailer instance from centralized config
            $mail = getMailer();

            // Recipients
            $mail->addAddress($user_email, $user_name);

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Your LACS Temporary Password';

            $body = "
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;'>
                <h2 style='color: #111827;'>Hello $user_name,</h2>
                <p style='color: #4b5563; line-height: 1.5;'>We received a request to reset your password for the Legislative Agenda and Calendar System (LACS).</p>
                <div style='background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                    <p style='color: #6b7280; font-size: 0.875rem; margin-bottom: 8px;'>Your temporary password is:</p>
                    <strong style='font-size: 1.5rem; color: #DC2626; letter-spacing: 0.05em;'>$temp_password</strong>
                </div>
                <p style='color: #4b5563; line-height: 1.5;'>Please log in using this temporary password and change it immediately for security.</p>
                <hr style='border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;'>
                <p style='color: #9ca3af; font-size: 0.75rem;'>Regards,<br><strong>LACS System Admin</strong></p>
            </div>";

            $mail->Body = $body;
            $mail->AltBody = "Hello $user_name,\n\nYour temporary password is: $temp_password\n\nPlease log in and change it immediately.";

            $mail->send();
            file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] Email sent successfully to: " . $user_email . "\n", FILE_APPEND);

            echo json_encode([
                'success' => true,
                'message' => 'A temporary password has been sent to your email address (' . maskEmail($user_email) . ').'
            ]);
        } catch (Exception $e) {
            file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] PHPMailer Error: " . $mail->ErrorInfo . "\n", FILE_APPEND);
            file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] Exception: " . $e->getMessage() . "\n", FILE_APPEND);

            // Return failure so user knows the email didn't go through
            echo json_encode([
                'success' => false,
                'message' => 'Password was reset but email could not be sent. Please contact an administrator.'
            ]);
        }

        $update_stmt->close();
    } else {
        // User not found - security best practice: same success message
        file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] User not found: " . $identifier . "\n", FILE_APPEND);
        echo json_encode([
            'success' => true,
            'message' => 'If an account exists with this credential, you will receive password reset instructions shortly.'
        ]);
    }

    $stmt->close();
} catch (Exception $e) {
    file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] Exception: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}

$conn->close();

/**
 * Mask email for security display
 */
function maskEmail($email)
{
    $parts = explode("@", $email);
    if (count($parts) < 2)
        return $email;
    $name = $parts[0];
    $domain = $parts[1];
    $len = strlen($name);
    if ($len <= 2)
        return $email;
    return substr($name, 0, 1) . str_repeat("*", $len - 2) . substr($name, -1) . "@" . $domain;
}
?>