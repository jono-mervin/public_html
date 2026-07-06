<?php
// mail_config.php
// Centralized configuration for PHPMailer SMTP settings

// These should be updated by the administrator
define('SMTP_HOST', 'smtp.gmail.com');          // SMTP server
define('SMTP_PORT', 587);                       // SMTP port (587 for TLS, 465 for SSL)
define('SMTP_USER', 'lacsspval@gmail.com');    // SMTP username
define('SMTP_PASS', 'nweh buko kixu jref');       // SMTP password (use App Password for Gmail)
define('SMTP_FROM', 'lacsspval@gmail.com');    // Form email address
define('SMTP_NAME', 'LACS-SPVALENZUELA');           // From name

// PHPMailer File Paths
require_once __DIR__ . '/../vendor/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/SMTP.php';
require_once __DIR__ . '/../vendor/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Creates and returns a configured PHPMailer instance
 * @return PHPMailer
 */
function getMailer()
{
    $mail = new PHPMailer(true);

    // Server settings
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;

    // Fix for local SSL verification issues (XAMPP/Windows)
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    $mail->setFrom(SMTP_FROM, SMTP_NAME);

    return $mail;
}
?>