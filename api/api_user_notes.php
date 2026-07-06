<?php
// api_user_notes.php
// Handle user notes CRUD operations

session_start();
require_once '../config/config.php';

header('Content-Type: application/json');

// Check if user is logged in
$isAuthenticated = (isset($_SESSION['is_logged_in']) && $_SESSION['is_logged_in']) ||
    (isset($_SESSION['user_id']) && !empty($_SESSION['user_id']));

if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

ob_start();

// Enable error reporting for debugging
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception("Could not connect to database");
    }
    $userId = $_SESSION['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];

    // Ensure table exists and has note_date column
    $conn->query("CREATE TABLE IF NOT EXISTS `user_notes` (
        `note_id` int(11) NOT NULL AUTO_INCREMENT,
        `user_id` int(11) NOT NULL,
        `note_date` date NOT NULL,
        `note` text NOT NULL,
        `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
        `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
        PRIMARY KEY (`note_id`),
        KEY `user_id` (`user_id`),
        KEY `note_date` (`note_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

    // Check if note_date column exists (in case table existed without it)
    $res = $conn->query("SHOW COLUMNS FROM `user_notes` LIKE 'note_date'");
    if ($res && $res->num_rows == 0) {
        $conn->query("ALTER TABLE `user_notes` ADD COLUMN `note_date` date NOT NULL AFTER `user_id` ");
        $conn->query("ALTER TABLE `user_notes` ADD INDEX (`note_date`) ");
    }
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit;
}

// Clear any accidental output (like warnings) before starting response
ob_clean();

switch ($method) {
    case 'GET':
        // Fetch notes for the user
        $stmt = $conn->prepare("SELECT note_id, DATE_FORMAT(note_date, '%Y-%m-%d') as note_date, note FROM user_notes WHERE user_id = ? ORDER BY note_date ASC, created_at ASC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $notes = [];
        while ($row = $result->fetch_assoc()) {
            $notes[] = $row;
        }
        echo json_encode(['success' => true, 'notes' => $notes]);
        $stmt->close();
        break;

    case 'POST':
        // Save or update a note
        $data = json_decode(file_get_contents('php://input'), true);
        $noteId = $data['note_id'] ?? null;
        $noteDate = $data['note_date'] ?? null;
        $noteText = $data['note'] ?? '';
        $action = $data['action'] ?? 'save'; // 'save', 'delete'

        if ($action === 'delete' && $noteId) {
            $stmt = $conn->prepare("DELETE FROM user_notes WHERE note_id = ? AND user_id = ?");
            $stmt->bind_param("ii", $noteId, $userId);
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'Note deleted']);
            $stmt->close();
            exit;
        }

        if (!$noteDate) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing date']);
            exit;
        }

        if ($noteId) {
            // Update existing
            $stmt = $conn->prepare("UPDATE user_notes SET note = ?, note_date = ? WHERE note_id = ? AND user_id = ?");
            $stmt->bind_param("ssii", $noteText, $noteDate, $noteId, $userId);
            $stmt->execute();
            echo json_encode(['success' => true, 'message' => 'Note updated']);
            $stmt->close();
        } else {
            // Insert new
            if (!empty($noteText)) {
                $stmt = $conn->prepare("INSERT INTO user_notes (user_id, note_date, note) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $userId, $noteDate, $noteText);
                $stmt->execute();
                echo json_encode(['success' => true, 'message' => 'Note created', 'note_id' => $stmt->insert_id]);
                $stmt->close();
            } else {
                echo json_encode(['success' => true, 'message' => 'Empty note ignored']);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

$conn->close();
ob_end_flush();
?>
