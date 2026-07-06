<?php
// cron/send_reminders.php
// Run this script via Cron/Task Scheduler every 5-10 minutes.

// 1. Setup Environment
// Fix relative path if run from root or cron folder
if (file_exists(__DIR__ . '/../config/config.php')) {
    require_once __DIR__ . '/../config/config.php';
} else {
    die("Error: Config file not found.\n");
}

// Disable HTML errors for CLI
ini_set('display_errors', 1); // Show in CLI
error_reporting(E_ALL);
date_default_timezone_set('Asia/Manila');

echo "Starting Reminder Check: " . date('Y-m-d H:i:s') . "\n";

$conn = getDBConnection();

// 2. Fetch Scheduled Sessions that might need reminders
// logic:
// - Status must be 'Scheduled'
// - Combined start time must be in the future (or very recently past if we missed it nearby)
// - limit to sessions starting in the next ~26 hours to catch both 24h and 1h windows comfortably.

$sql = "
    SELECT 
        session_id, 
        title, 
        session_date, 
        actual_start_time, 
        reminder_24h_sent, 
        reminder_1h_sent 
    FROM sessions 
    WHERE status = 'Scheduled' 
    AND CONCAT(session_date, ' ', actual_start_time) > NOW() -- Future sessions only
    AND CONCAT(session_date, ' ', actual_start_time) <= DATE_ADD(NOW(), INTERVAL 26 HOUR) -- Optimization
";

$result = $conn->query($sql);

if (!$result) {
    die("Error querying sessions: " . $conn->error . "\n");
}

$sessionsCheckCount = $result->num_rows;
echo "Found $sessionsCheckCount scheduled sessions in range.\n";

$remindersSent = 0;

while ($session = $result->fetch_assoc()) {
    $sessionId = $session['session_id'];
    $title = $session['title'];
    $startDateTimeStr = $session['session_date'] . ' ' . $session['actual_start_time'];
    $startTimestamp = strtotime($startDateTimeStr);
    $nowTimestamp = time();
    $secondsUntilStart = $startTimestamp - $nowTimestamp;
    $hoursUntilStart = $secondsUntilStart / 3600;

    echo "Checking Session ID {$sessionId}: Starts in " . round($hoursUntilStart, 2) . " hours ({$startDateTimeStr})\n";

    // --- Check 24 Hour Reminder ---
    // Send if within 24 hours (e.g., 23.9 hours left) AND not sent yet
    // We add a lower bound (e.g., > 1 hour) to distinguish? No, 24h reminder is about "Tomorrow".
    // If it's starting in 5 minutes and we never sent 24h reminder, should we send it? 
    // Usually "Reminder: Session starts in 24h" makes no sense if it starts in 5 mins.
    // Let's say window is: 23 hrs <= X <= 25 hrs?
    // User request: "automatic reminder when it 1day before ... and 1hr before"
    // Interpretation: 
    // - Approx 24 hours before.
    // - Approx 1 hour before.
    
    // Logic for 24H: roughly between 23h and 25h? Or just "Less than 24h"?
    // If we run cron every 10 mins:
    // If we just say "< 24h", then if valid for 1h reminder, it is ALSO < 24h.
    // We don't want to spam both at once if the script was down for a day.
    // Valid Window for 24h reminder: between 23 hours and 25 hours?
    // Let's try: If time_left <= 24 hours AND time_left > 2 hours AND not sent.
    
    // Logic for 24H: User wants "1 day before". 
    // We send this if it's roughly 21-25 hours away. 
    // If it's sooner (e.g. 2 hours), we shouldn't send a "starts in 24h" message.
    $sent24 = false;
    if ($hoursUntilStart <= 25 && $hoursUntilStart >= 21 && $session['reminder_24h_sent'] == 0) {
        $sent24 = sendSessionReminder($conn, $sessionId, $title, $startDateTimeStr, '24_hour');
        if ($sent24) {
            $conn->query("UPDATE sessions SET reminder_24h_sent = 1 WHERE session_id = $sessionId");
            echo "  -> Sent 24h reminder.\n";
            $remindersSent++;
        }
    }

    // --- Check 1 Hour Reminder ---
    // Send if within 1.5 hours.
    $sent1 = false;
    if ($hoursUntilStart <= 1.5 && $session['reminder_1h_sent'] == 0) {
        $sent1 = sendSessionReminder($conn, $sessionId, $title, $startDateTimeStr, '1_hour');
        if ($sent1) {
            $conn->query("UPDATE sessions SET reminder_1h_sent = 1 WHERE session_id = $sessionId");
            echo "  -> Sent 1h reminder.\n";
            $remindersSent++;
        }
    }
}

echo "Done. Total reminders batches sent: $remindersSent\n";
$conn->close();


/**
 * Helper to send notifications
 */
/**
 * Helper to send notifications
 */
function sendSessionReminder($conn, $sessionId, $title, $startDateTime, $type) {
    // 1. Get Recipients (Assigned Staff)
    $sql = "SELECT user_id FROM session_assignments WHERE session_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $sessionId);
    $stmt->execute();
    $res = $stmt->get_result();
    
    $recipients = [];
    while ($row = $res->fetch_assoc()) {
        $recipients[] = $row['user_id'];
    }
    $stmt->close();

    if (empty($recipients)) {
        echo "  -> No assigned staff to notify for Session $sessionId.\n";
        return true; 
    }

    // 2. Prepare Message
    $friendlyDate = date('F j, Y g:i A', strtotime($startDateTime));
    if ($type === '24_hour') {
        $msg = "Reminder: Session '$title' starts in 24 hours ($friendlyDate).";
        $batchTitle = "Upcoming Session Reminder (24h)";
    } else {
        $msg = "Urgent: Session '$title' starts in 1 hour ($friendlyDate).";
        $batchTitle = "Urgent Session Reminder (1h)";
    }

    // 3. Insert into reminder_batches (The table used by api_reminders.php)
    // We attribute it to System (User 1 usually Admin)
    $systemUserId = 1; 
    $relatedType = 'Session';
    $status = 'Sent';
    $targetRoles = 'Staff,User'; 
    $reminderDate = date('Y-m-d H:i:s'); // Sent NOW.
    
    $batchStmt = $conn->prepare("INSERT INTO reminder_batches (created_by, title, message, related_type, related_id, target_roles, reminder_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $batchStmt->bind_param("isssisss", $systemUserId, $batchTitle, $msg, $relatedType, $sessionId, $targetRoles, $reminderDate, $status);
    
    if (!$batchStmt->execute()) {
        echo "  -> Failed to create reminder batch: " . $batchStmt->error . "\n";
        return false;
    }
    $batchId = $conn->insert_id;
    $batchStmt->close();

    // 4. Insert into reminder_recipients
    $recipStmt = $conn->prepare("INSERT INTO reminder_recipients (batch_id, user_id, status) VALUES (?, ?, 'Pending')");
    $count = 0;
    foreach ($recipients as $uid) {
        $recipStmt->bind_param("ii", $batchId, $uid);
        if ($recipStmt->execute()) {
            $count++;
        }
    }
    $recipStmt->close();
    
    // 5. Also Insert into notifications (Legacy/Backup)
    $link = "/admin/sessions/$sessionId"; 
    $notifType = 'session_reminder';
    $insertStmt = $conn->prepare("INSERT INTO notifications (user_id, type, message, link, created_at) VALUES (?, ?, ?, ?, NOW())");
    foreach ($recipients as $uid) {
        $insertStmt->bind_param("isss", $uid, $notifType, $msg, $link);
        $insertStmt->execute();
    }
    $insertStmt->close();

    return $count > 0;
}
?>
