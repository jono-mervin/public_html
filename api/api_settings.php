<?php
// api_settings.php
session_start();
require_once '../config/config.php';
header('Content-Type: application/json');

$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']);
$role = $_SESSION['user_role'] ?? 'User - Committee';
$isAdmin = (strcasecmp($role, 'Super Admin') === 0 || strcasecmp($role, 'Admin') === 0);

// Allow 'ping' action for any authenticated user to keep session alive
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'ping') {
    if ($isAuthenticated) {
        echo json_encode(['success' => true]);
        exit;
    }
}

if (!$isAuthenticated || !$isAdmin) {
    http_response_code($isAuthenticated ? 403 : 401);
    echo json_encode(['success' => false, 'message' => $isAuthenticated ? 'Forbidden' : 'Unauthorized']);
    exit;
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Return all settings grouped
        $result = $conn->query("SELECT * FROM system_settings");
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        echo json_encode(['success' => true, 'settings' => $settings]);
        break;

    case 'POST':
        // Update settings (Admin only ideally)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!empty($input['settings']) && is_array($input['settings'])) {
            $stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value, group_name) VALUES (?, ?, 'general') ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

            foreach ($input['settings'] as $key => $value) {
                // Determine group based on key prefix or manual map (simplified here)
                $stmt->bind_param("ss", $key, $value);
                $stmt->execute();
            }
            echo json_encode(['success' => true, 'message' => 'Settings saved']);
        } else {
            echo json_encode(['success' => false, 'message' => 'No settings provided']);
        }
        break;
}
$conn->close();
?>