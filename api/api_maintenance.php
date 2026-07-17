<?php
// api/api_maintenance.php

session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

// Check Login and Admin Role
if (!isset($_SESSION['is_logged_in']) || $_SESSION['is_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['user_role'] ?? 'User - Committee';
$isRealAdmin = (strcasecmp($role, 'Super Admin') === 0 || strcasecmp($role, 'Admin') === 0 || strcasecmp($role, 'Administrator') === 0);

if (!$isRealAdmin) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$maintenance_file = '../config/maintenance_mode.json';
$current_time = date('Y-m-d H:i:s');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Read status
    $status = false;
    $last_updated = null;
    $updated_by = null;
    
    if (file_exists($maintenance_file)) {
        $config = json_decode(file_get_contents($maintenance_file), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $status = $config['maintenance_mode'] ?? false;
            $last_updated = $config['last_updated'] ?? null;
            $updated_by = $config['updated_by'] ?? null;
        }
    }
    
    echo json_encode([
        'success' => true,
        'maintenance_mode' => $status,
        'info' => [
            'last_updated' => $last_updated,
            'updated_by' => $updated_by
        ]
    ]);
    exit;
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update status
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['active'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Active status required']);
        exit;
    }
    
    $active = (bool) $input['active'];
    
    $data = [
        'maintenance_mode' => $active,
        'last_updated' => $current_time,
        'updated_by' => $_SESSION['user_name'] ?? 'Admin'
    ];
    
    if (file_put_contents($maintenance_file, json_encode($data, JSON_PRETTY_PRINT))) {
        
        // Log the action
        // Assuming api_logs logic here, but for simplicity I wont verify the logs table structure unless needed.
        // It's good practice, so I'll try a simple insert if I can.
        
        // Simulating log via file for now or minimal DB insert if desired.
        // Let's stick to just the file update success.
        
        echo json_encode([
            'success' => true,
            'message' => 'Maintenance mode ' . ($active ? 'ENABLED' : 'DISABLED'),
            'maintenance_mode' => $active
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update configuration']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
?>
