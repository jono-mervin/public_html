<?php
// api_agendas.php
// Handle agendas CRUD operations

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

$method = $_SERVER['REQUEST_METHOD'];

try {
    $conn = getDBConnection();
    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    /**
     * Session visibility / edit rule:
     * - If a session is inactive (session_status = 'Inactive') OR its execution status is locked
     *   (Missed / Completed / Cancelled / Postponed), agenda/items/documents become read-only.
     *   Only Sessions module can change or restore such sessions.
     */
    $isSessionInactiveById = function (int $sessionId) use ($conn): bool {
        $stmt = $conn->prepare("SELECT session_status, status FROM sessions WHERE session_id = ? LIMIT 1");
        $stmt->bind_param("i", $sessionId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) return false;
        $visibilityStatus = $row['session_status'] ?? 'Active';
        $execStatus = strtolower($row['status'] ?? '');
        $lockedExecStatuses = ['missed', 'completed', 'cancelled', 'canceled', 'postponed'];
        return $visibilityStatus === 'Inactive' || in_array($execStatus, $lockedExecStatuses, true);
    };

    $getSessionIdByAgendaId = function (int $agendaId) use ($conn): int {
        $stmt = $conn->prepare("SELECT session_id FROM agendas WHERE agenda_id = ? LIMIT 1");
        $stmt->bind_param("i", $agendaId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ? intval($row['session_id']) : 0;
    };

    $getSessionIdByItemId = function (int $itemId) use ($conn): int {
        $stmt = $conn->prepare("SELECT session_id FROM agenda_items WHERE agenda_item_id = ? LIMIT 1");
        $stmt->bind_param("i", $itemId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $row ? intval($row['session_id']) : 0;
    };

    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? null;

            if ($action === 'get_motions') {
                $stmt = $conn->prepare("SELECT * FROM action_types ORDER BY id ASC");
                $stmt->execute();
                $result = $stmt->get_result();
                $motions = [];
                while ($row = $result->fetch_assoc()) {
                    $motions[] = $row;
                }
                echo json_encode(['success' => true, 'motions' => $motions]);
                $stmt->close();
                exit;
            }

            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            $currentUserId = $_SESSION['user_id'] ?? 0;
            $agendaId = isset($_GET['id']) ? intval($_GET['id']) : null;
            $sessionId = isset($_GET['session_id']) ? intval($_GET['session_id']) : null;

            if ($agendaId) {
                // Get single agenda with items
                $sql = "
                    SELECT a.*, s.title as session_title, s.session_date, s.actual_start_time, s.actual_end_time, 
                           s.session_type, s.status as session_status, s.venue
                    FROM agendas a
                    INNER JOIN sessions s ON a.session_id = s.session_id
                    WHERE a.agenda_id = ? AND s.session_status != 'Inactive' ";
                
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $agendaId);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows === 1) {
                    $agenda = $result->fetch_assoc();

                    // Format for frontend
                    $agenda['id'] = $agenda['agenda_id'];
                    $agenda['title'] = "Agenda - " . date('M d, Y', strtotime($agenda['session_date'])) . " " . str_replace(' Session', '', $agenda['session_type']);
                    $agenda['sessionDate'] = date('M d, Y', strtotime($agenda['session_date']));
                    $agenda['sessionTime'] = $agenda['actual_start_time'] ? date('g:i A', strtotime($agenda['actual_start_time'])) : 'TBD';
                    $agenda['type'] = str_replace(' Session', '', $agenda['session_type']);
                    // Add compatibility fields
                    if ($agenda['actual_start_time'] && $agenda['actual_end_time']) {
                        $agenda['start_time'] = date('H:i:s', strtotime($agenda['actual_start_time']));
                        $agenda['end_time'] = date('H:i:s', strtotime($agenda['actual_end_time']));
                    }
                    $agenda['status'] = $agenda['status'] ?? 'Published';
                    $agenda['lastModified'] = date('M d, Y g:i A', strtotime($agenda['created_at']));
                    $agenda['agenda_description'] = $agenda['agenda_description'] ?? '';
                    $agenda['sessionRawDate'] = $agenda['session_date'];

                    // Get agenda items
                    $itemsStmt = $conn->prepare("
                        SELECT ai.*, u.user_name as assigned_user_name, c.user_name as creator_name
                        FROM agenda_items ai 
                        LEFT JOIN users u ON ai.assigned_to = u.user_id 
                        LEFT JOIN users c ON ai.created_by = c.user_id
                        WHERE ai.agenda_id = ? 
                        ORDER BY ai.created_at ASC
                    ");
                    $itemsStmt->bind_param("i", $agendaId);
                    $itemsStmt->execute();
                    $itemsResult = $itemsStmt->get_result();
                    $items = [];
                    while ($item = $itemsResult->fetch_assoc()) {
                        // Map fields for frontend compatibility
                        $item['title'] = $item['item_title'];
                        $item['description'] = $item['item_description'];

                        // Fetch documents for this item
                        $docStmt = $conn->prepare("SELECT d.*, u.user_name as uploader_name FROM agenda_item_documents d LEFT JOIN users u ON d.uploaded_by = u.user_id WHERE d.agenda_item_id = ? ORDER BY d.uploaded_at DESC");
                        $docStmt->bind_param("i", $item['agenda_item_id']);
                        $docStmt->execute();
                        $docResult = $docStmt->get_result();
                        $docs = [];
                        while ($doc = $docResult->fetch_assoc()) {
                            $docs[] = $doc;
                        }
                        $docStmt->close();
                        $item['documents'] = $docs;

                        $items[] = $item;
                    }
                    $agenda['items'] = $items;

                    echo json_encode(['success' => true, 'agenda' => $agenda]);
                    $stmt->close();
                    exit;
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Agenda not found']);
                    $stmt->close();
                    exit;
                }
            } else if ($sessionId) {
                // Get all agendas for a specific session
                $userRole = $_SESSION['user_role'] ?? 'User - Committee';
                $currentUserId = $_SESSION['user_id'] ?? 0;

                if ($userRole === 'User - Committee') {
                    $stmt = $conn->prepare("
                    SELECT a.*, s.title as session_title, s.session_date, s.actual_start_time, s.actual_end_time, 
                           s.session_type, s.status as session_status, s.venue
                    FROM agendas a
                    INNER JOIN sessions s ON a.session_id = s.session_id
                    INNER JOIN session_assignments sa ON s.session_id = sa.session_id
                    WHERE a.session_id = ? AND sa.user_id = ? AND s.session_status != 'Inactive'
                    ORDER BY a.created_at ASC
                ");
                    $stmt->bind_param("ii", $sessionId, $currentUserId);
                } else {
                    $sql = "
                        SELECT a.*, s.title as session_title, s.session_date, s.actual_start_time, s.actual_end_time, 
                               s.session_type, s.status as session_status, s.venue
                        FROM agendas a
                        INNER JOIN sessions s ON a.session_id = s.session_id
                        WHERE a.session_id = ? AND s.session_status != 'Inactive' ";
                    
                    $sql .= " ORDER BY a.created_at ASC";
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $sessionId);
                }
                $stmt->execute();
                $result = $stmt->get_result();
                $agendas = [];

                while ($row = $result->fetch_assoc()) {
                    // Format title like "Agenda - Dec 15, 2025 Regular Session"
                    $formattedTitle = "Agenda - " . date('M d, Y', strtotime($row['session_date'])) . " " . str_replace(' Session', '', $row['session_type']);

                    $status = $row['status'] ?? 'Draft';

                    $agenda = [
                        'id' => $row['agenda_id'],
                        'title' => $formattedTitle,
                        'sessionDate' => date('M d, Y', strtotime($row['session_date'])),
                        'sessionRawDate' => $row['session_date'], // Added for date validation
                        'sessionTime' => $row['actual_start_time'] ? date('g:i A', strtotime($row['actual_start_time'])) : 'TBD',
                        'type' => str_replace(' Session', '', $row['session_type']),
                        'status' => $status,
                        'lastModified' => date('M d, Y g:i A', strtotime($row['created_at'])),
                        'created_at' => $row['created_at'], // Raw timestamp for table display
                        'items' => [], // Empty items array for now
                        'session_title' => $row['session_title'],
                        'agenda_title' => $row['agenda_title'],
                        'agenda_description' => $row['agenda_description'] ?? '',
                        'session_id' => $row['session_id']
                    ];

                    $agendas[] = $agenda;
                }

                echo json_encode(['success' => true, 'agendas' => $agendas]);
                $stmt->close();
                exit;
            }



            // Get all agendas
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            $currentUserId = $_SESSION['user_id'] ?? 0;

            if ($userRole === 'User - Committee') {
                $sql = "SELECT a.*, s.title as session_title, s.session_date, s.actual_start_time, s.actual_end_time, 
                           s.session_type, s.status as session_status, s.venue
                    FROM agendas a
                    INNER JOIN sessions s ON a.session_id = s.session_id
                    INNER JOIN session_assignments sa ON s.session_id = sa.session_id
                    WHERE sa.user_id = ? AND s.session_status != 'Inactive'";
                $sql .= " ORDER BY s.session_date DESC, a.created_at DESC";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $currentUserId);
            } else {
                $sql = "SELECT a.*, s.title as session_title, s.session_date, s.actual_start_time, s.actual_end_time, 
                           s.session_type, s.status as session_status, s.venue
                    FROM agendas a
                    INNER JOIN sessions s ON a.session_id = s.session_id";
                $sql .= " WHERE s.session_status != 'Inactive'";
                $sql .= " ORDER BY s.session_date DESC, a.created_at DESC";
                $stmt = $conn->prepare($sql);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $agendas = [];

            while ($row = $result->fetch_assoc()) {
                $formattedTitle = "Agenda - " . date('M d, Y', strtotime($row['session_date'])) . " " . str_replace(' Session', '', $row['session_type']);
                $status = $row['status'] ?? 'Draft';

                $agenda = [
                    'id' => $row['agenda_id'],
                    'agenda_id' => $row['agenda_id'],
                    'title' => $formattedTitle,
                    'sessionDate' => date('M d, Y', strtotime($row['session_date'])),
                    'sessionTime' => $row['actual_start_time'] ? date('g:i A', strtotime($row['actual_start_time'])) : 'TBD',
                    'type' => str_replace(' Session', '', $row['session_type']),
                    'status' => $status,
                    'lastModified' => date('M d, Y g:i A', strtotime($row['created_at'])),
                    'created_at' => $row['created_at'],
                    'items' => [],
                    'session_title' => $row['session_title'],
                    'agenda_title' => $row['agenda_title'],
                    'session_id' => $row['session_id']
                ];

                $agendas[] = $agenda;
            }

            // Also get all sessions for the frontend
            if ($userRole === 'User - Committee') {
                $sessionsSql = "SELECT s.* FROM sessions s 
                            INNER JOIN session_assignments sa ON s.session_id = sa.session_id 
                            WHERE sa.user_id = ? AND s.session_status != 'Inactive' 
                            ORDER BY s.session_date DESC";
                $sessionsStmt = $conn->prepare($sessionsSql);
                $sessionsStmt->bind_param("i", $currentUserId);
            } else {
                $sessionsSql = "SELECT * FROM sessions WHERE session_status != 'Inactive' ORDER BY session_date DESC";
                $sessionsStmt = $conn->prepare($sessionsSql);
            }
            $sessionsStmt->execute();
            $sessionsResult = $sessionsStmt->get_result();
            $sessions = [];
            while ($sessionRow = $sessionsResult->fetch_assoc()) {
                // Format time fields for compatibility
                if ($sessionRow['actual_start_time'] && $sessionRow['actual_end_time']) {
                    $sessionRow['time'] = date('g:i A', strtotime($sessionRow['actual_start_time'])) . ' - ' . date('g:i A', strtotime($sessionRow['actual_end_time']));
                    $sessionRow['start_time'] = date('H:i:s', strtotime($sessionRow['actual_start_time']));
                    $sessionRow['end_time'] = date('H:i:s', strtotime($sessionRow['actual_end_time']));
                } else {
                    $sessionRow['time'] = 'TBD';
                    $sessionRow['start_time'] = null;
                    $sessionRow['end_time'] = null;
                }
                $sessions[] = $sessionRow;
            }

            echo json_encode(['success' => true, 'agendas' => $agendas, 'sessions' => $sessions]);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $_GET['action'] ?? null;

            if ($action === 'upload_item_document') {
                // When using FormData (file upload), data comes via $_POST not JSON body
                $itemId = intval($_POST['item_id'] ?? $input['item_id'] ?? 0);

                if (!$itemId) {
                    echo json_encode(['success' => false, 'message' => 'Item ID is required']);
                    exit;
                }

                $sessionIdForItem = $getSessionIdByItemId($itemId);
                if ($sessionIdForItem && $isSessionInactiveById($sessionIdForItem)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to upload documents.']);
                    exit;
                }

                if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
                    exit;
                }

                $uploadDir = '../uploads/agenda_documents/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $origName = $_FILES['file']['name'];
                $tmpName = $_FILES['file']['tmp_name'];
                $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
                $allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'txt'];

                if (!in_array($ext, $allowedExts)) {
                    echo json_encode(['success' => false, 'message' => 'File type not allowed']);
                    exit;
                }

                $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $origName);
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($tmpName, $targetPath)) {
                    $uploadedBy = $_SESSION['user_id'] ?? null;
                    $stmt = $conn->prepare("INSERT INTO agenda_item_documents (agenda_item_id, file_name, file_type, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?)");
                    $stmt->bind_param("isssi", $itemId, $origName, $ext, $targetPath, $uploadedBy);

                    if ($stmt->execute()) {
                        $docId = $conn->insert_id;
                        // Log
                        try {
                            $sIdStmt = $conn->prepare("SELECT session_id, item_title FROM agenda_items WHERE agenda_item_id = ?");
                            $sIdStmt->bind_param("i", $itemId);
                            $sIdStmt->execute();
                            $sIdRow = $sIdStmt->get_result()->fetch_assoc();
                            $sessionId = $sIdRow ? $sIdRow['session_id'] : 0;
                            $itemTitle = $sIdRow ? $sIdRow['item_title'] : '';
                            $sIdStmt->close();

                            $log_uid = $_SESSION['user_id'] ?? 0;
                            $log_act = "Upload Document";
                            $log_desc = "Uploaded '$origName' for agenda item '$itemTitle'";
                            $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                            $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        } catch (Exception $e) {}

                        echo json_encode(['success' => true, 'message' => 'Document uploaded successfully', 'document' => [
                            'document_id' => $docId,
                            'file_name' => $origName,
                            'file_type' => $ext,
                            'file_path' => $targetPath,
                            'uploaded_at' => date('Y-m-d H:i:s'),
                            'uploaded_by' => $uploadedBy,
                            'uploader_name' => $_SESSION['user_name'] ?? 'You'
                        ]]);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to save document record']);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
                }
                exit;
            }

            if ($action === 'delete_item_document') {
                $docId = intval($input['document_id'] ?? 0);
                if (!$docId) {
                    echo json_encode(['success' => false, 'message' => 'Document ID required']);
                    exit;
                }

                $currentUserId = $_SESSION['user_id'] ?? 0;
                $userRole = $_SESSION['user_role'] ?? 'User - Committee';
                $isAdminOrStaff = ($userRole === 'Super Admin' && $userRole !== 'Admin' || $userRole === 'Staff');

                // Get file path and uploader before deletion
                $pathStmt = $conn->prepare("SELECT file_path, uploaded_by FROM agenda_item_documents WHERE document_id = ?");
                $pathStmt->bind_param("i", $docId);
                $pathStmt->execute();
                $pathRow = $pathStmt->get_result()->fetch_assoc();
                $pathStmt->close();

                // Block delete when linked session is inactive
                try {
                    $sidStmt = $conn->prepare("
                        SELECT ai.session_id
                        FROM agenda_item_documents d
                        INNER JOIN agenda_items ai ON d.agenda_item_id = ai.agenda_item_id
                        WHERE d.document_id = ?
                        LIMIT 1
                    ");
                    $sidStmt->bind_param("i", $docId);
                    $sidStmt->execute();
                    $sidRow = $sidStmt->get_result()->fetch_assoc();
                    $sidStmt->close();
                    $linkedSessionId = $sidRow ? intval($sidRow['session_id']) : 0;
                    if ($linkedSessionId && $isSessionInactiveById($linkedSessionId)) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to delete documents.']);
                        exit;
                    }
                } catch (Exception $e) {}

                // Allow if admin/staff OR if the user uploaded the document themselves
                if (!$isAdminOrStaff && (!$pathRow || $pathRow['uploaded_by'] != $currentUserId)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'You are not authorized to delete this document']);
                    exit;
                }

                $stmt = $conn->prepare("DELETE FROM agenda_item_documents WHERE document_id = ?");
                $stmt->bind_param("i", $docId);
                if ($stmt->execute()) {
                    // Try to remove physical file
                    if ($pathRow && file_exists($pathRow['file_path'])) {
                        @unlink($pathRow['file_path']);
                    }
                    echo json_encode(['success' => true, 'message' => 'Document deleted successfully']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete document']);
                }
                $stmt->close();
                exit;
            }

            if ($action === 'update_document_permission') {
                $docId = intval($input['document_id'] ?? 0);
                $permState = $input['permission_state'] ?? 'Public view';
                $stmt = $conn->prepare("UPDATE agenda_item_documents SET permission_state = ? WHERE document_id = ?");
                if ($stmt) {
                    $stmt->bind_param("si", $permState, $docId);
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Permission updated']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to update permission']);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['success' => false, 'message' => 'Database error']);
                }
                exit;
            }

            if ($action === 'add_motion') {
                $name = isset($input['name']) ? trim($input['name']) : null;
                if (!$name) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Motion name is required']);
                    exit;
                }

                $stmt = $conn->prepare("INSERT INTO action_types (name) VALUES (?)");
                $stmt->bind_param("s", $name);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Motion added successfully', 'id' => $conn->insert_id]);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to add motion']);
                }
                $stmt->close();
                exit;
            }
            if ($action === 'delete_motion') {
                $userRole = $_SESSION['user_role'] ?? 'User - Committee';
                if ($userRole !== 'Super Admin' && $userRole !== 'Admin' && $userRole !== 'Staff') {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                    exit;
                }

                $name = isset($input['name']) ? trim($input['name']) : null;
                if (!$name) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Motion name is required']);
                    exit;
                }

                $stmt = $conn->prepare("DELETE FROM action_types WHERE name = ?");
                $stmt->bind_param("s", $name);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Motion deleted successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to delete motion']);
                }
                $stmt->close();
                exit;
            }

            // Security checks will be handled per action below
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            $currentUserId = $_SESSION['user_id'] ?? 0;

            if (isset($_GET['action']) && $_GET['action'] === 'update_agenda') {
                $agendaId = isset($input['agenda_id']) ? intval($input['agenda_id']) : null;
                $agendaTitle = isset($input['agenda_title']) ? trim($input['agenda_title']) : null;
                $agendaDescription = isset($input['agenda_description']) ? trim($input['agenda_description']) : '';

                if ($userRole !== 'Super Admin' && $userRole !== 'Admin' && $userRole !== 'Staff') {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only administrators and staff can update agenda structure']);
                    exit;
                }

                if (!$agendaId) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Agenda ID is required']);
                    exit;
                }

                $sid = $getSessionIdByAgendaId($agendaId);
                if ($sid && $isSessionInactiveById($sid)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to update agendas.']);
                    exit;
                }

                $conn->begin_transaction();
                try {
                    // Update Agenda Details
                    $stmt = $conn->prepare("UPDATE agendas SET agenda_title = ?, agenda_description = ? WHERE agenda_id = ?");
                    $stmt->bind_param("ssi", $agendaTitle, $agendaDescription, $agendaId);
                    $stmt->execute();
                    $stmt->close();

                    // If items logic is needed in future, it can go here. 
                    // Current requirement is simplified agenda update.
                    
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Agenda updated successfully']);
                } catch (Exception $e) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to update agenda: ' . $e->getMessage()]);
                }
                exit;
            }
            if (isset($_GET['action']) && $_GET['action'] === 'update_item') {
                // Update Agenda Item
                if (!isset($input['item_id']) || !isset($input['item_title'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Item ID and title are required']);
                    exit;
                }

                $itemId = intval($input['item_id']);

                $sid = $getSessionIdByItemId($itemId);
                if ($sid && $isSessionInactiveById($sid)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to update agenda items.']);
                    exit;
                }

                // Authorization Check: Admin, Staff, or Assigned User
                $isAdminOrStaff = (strcasecmp($userRole, 'Super Admin' && $userRole !== 'Admin') === 0 || strcasecmp($userRole, 'Admin') === 0 || strcasecmp($userRole, 'Staff') === 0);
                $isAuthorized = $isAdminOrStaff;
                if (!$isAuthorized) {
                    $checkStmt = $conn->prepare("SELECT assigned_to FROM agenda_items WHERE agenda_item_id = ?");
                    $checkStmt->bind_param("i", $itemId);
                    $checkStmt->execute();
                    $checkRow = $checkStmt->get_result()->fetch_assoc();
                    if ($checkRow && $checkRow['assigned_to'] == $currentUserId) {
                        $isAuthorized = true;
                    }
                    $checkStmt->close();
                }

                if (!$isAuthorized) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'You are not authorized to edit this item']);
                    exit;
                }

                $title = isset($input['item_title']) ? trim($input['item_title']) : null;
                $description = isset($input['item_description']) ? trim($input['item_description']) : null;
                $deadline = isset($input['deadline']) && !empty($input['deadline']) ? $input['deadline'] : null;
                $assignedTo = isset($input['assigned_to']) ? intval($input['assigned_to']) : null;
                $purpose = isset($input['item_purpose']) ? trim($input['item_purpose']) : null;
                $recommendation = isset($input['item_recommendation']) ? trim($input['item_recommendation']) : null;

                // FIX: Column name is agenda_item_id
                $stmt = $conn->prepare("UPDATE agenda_items SET item_title = ?, item_purpose = ?, item_description = ?, item_recommendation = ?, deadline = ?, assigned_to = ? WHERE agenda_item_id = ?");
                $stmt->bind_param("sssssii", $title, $purpose, $description, $recommendation, $deadline, $assignedTo, $itemId);

                if ($stmt->execute()) {
                    // Log Activity
                    try {
                        $sIdStmt = $conn->prepare("SELECT session_id FROM agenda_items WHERE agenda_item_id = ?");
                        $sIdStmt->bind_param("i", $itemId);
                        $sIdStmt->execute();
                        $sIdRow = $sIdStmt->get_result()->fetch_assoc();
                        $sessionId = $sIdRow ? $sIdRow['session_id'] : 0;
                        $sIdStmt->close();

                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Update Agenda Item";
                        $log_desc = "Updated item: " . $title;
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Agenda item updated successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to update agenda item']);
                }
                $stmt->close();
                exit;
            }

            if (isset($_GET['action']) && $_GET['action'] === 'delete_item') {
                // Delete Agenda Item
                if (!isset($input['item_id'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Item ID is required. Debug: ' . json_encode($input)]);
                    exit;
                }

                $itemId = intval($input['item_id']);

                $sid = $getSessionIdByItemId($itemId);
                if ($sid && $isSessionInactiveById($sid)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to delete agenda items.']);
                    exit;
                }

                // FIX: Also delete any associated deadlines and reminders
                // 1. Delete from manual deadlines table
                // Note: Deadlines are linked by string description pattern: "(Linked to Agenda Item ID: X)"
                $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                $delDeadlineStmt = $conn->prepare("DELETE FROM deadlines WHERE description LIKE ?");
                $delDeadlineStmt->bind_param("s", $deadlineSearch);
                $delDeadlineStmt->execute();
                $delDeadlineStmt->close();

                // 2. Delete from reminder_batches
                try {
                    $remBatchStmt = $conn->prepare("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id = ?");
                    $remBatchStmt->bind_param("i", $itemId);
                    $remBatchStmt->execute();
                    $remBatchStmt->close();
                } catch (Exception $e) {}

                // Get session_id before deletion for logging
                $sessionId = 0;
                $itemTitleText = "ID: " . $itemId;
                try {
                    $sIdStmt = $conn->prepare("SELECT session_id, item_title FROM agenda_items WHERE agenda_item_id = ?");
                    $sIdStmt->bind_param("i", $itemId);
                    $sIdStmt->execute();
                    $sIdRow = $sIdStmt->get_result()->fetch_assoc();
                    if ($sIdRow) {
                        $sessionId = $sIdRow['session_id'];
                        $itemTitleText = $sIdRow['item_title'];
                    }
                    $sIdStmt->close();
                } catch (Exception $e) {}

                // FIX: Column name is agenda_item_id
                $stmt = $conn->prepare("DELETE FROM agenda_items WHERE agenda_item_id = ?");
                $stmt->bind_param("i", $itemId);
 
                if ($stmt->execute()) {
                    // Log Activity
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Delete Agenda Item";
                        $log_desc = "Deleted item: " . $itemTitleText;
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Agenda item deleted successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to delete agenda item']);
                }
                $stmt->close();
                exit;
            }

            if (isset($_GET['action']) && $_GET['action'] === 'reorder_items') {
                // Reorder Agenda Items
                if (!isset($input['items']) || !is_array($input['items'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Items array is required']);
                    exit;
                }

                // If any item belongs to an inactive session, block reorder
                foreach ($input['items'] as $it) {
                    $sid = $getSessionIdByItemId(intval($it));
                    if ($sid && $isSessionInactiveById($sid)) {
                        http_response_code(403);
                        echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to reorder items.']);
                        exit;
                    }
                }

                $conn->begin_transaction();
                try {
                    // FIX: Column name is agenda_item_id
                    $stmt = $conn->prepare("UPDATE agenda_items SET order_index = ? WHERE agenda_item_id = ?");
                    foreach ($input['items'] as $index => $itemId) {
                        $orderIndex = $index + 1;
                        $stmt->bind_param("ii", $orderIndex, $itemId);
                        $stmt->execute();
                    }
                    $stmt->close();
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Items reordered successfully']);
                } catch (Exception $e) {
                    $conn->rollback();
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to reorder items']);
                }
                exit;
            }

            if (isset($_GET['action']) && $_GET['action'] === 'update_item_status') {
                if (!isset($input['item_id']) || !isset($input['status'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Item ID and status are required']);
                    exit;
                }

                if ($userRole !== 'Super Admin' && $userRole !== 'Admin' && $userRole !== 'Staff') {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Only administrators and staff can update item status']);
                    exit;
                }

                $itemId = intval($input['item_id']);
                $status = $input['status'];
                $remarks = $input['remarks'] ?? null;

                $sid = $getSessionIdByItemId($itemId);
                if ($sid && $isSessionInactiveById($sid)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to update item status.']);
                    exit;
                }

                // If Approved, also mark as Completed and set timestamp
                if ($status === 'Approved') {
                    $status = 'Completed';
                }

                $completedAt = ($status === 'Completed') ? date('Y-m-d H:i:s') : null;

                $stmt = $conn->prepare("UPDATE agenda_items SET status = ?, revision_remarks = ?, completed_at = ? WHERE agenda_item_id = ?");
                $stmt->bind_param("sssi", $status, $remarks, $completedAt, $itemId);

                if ($stmt->execute()) {
                    // Also update linked deadline status if completed
                    if ($status === 'Completed') {
                        try {
                            $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                            $deadlineStmt = $conn->prepare("UPDATE deadlines SET status = 'Completed' WHERE description LIKE ? AND status != 'Completed'");
                            $deadlineStmt->bind_param("s", $deadlineSearch);
                            $deadlineStmt->execute();
                            $deadlineStmt->close();
                        } catch (Exception $e) {}
                    }

                    // Log Activity
                    try {
                        $sIdStmt = $conn->prepare("SELECT session_id, item_title, assigned_to FROM agenda_items WHERE agenda_item_id = ?");
                        $sIdStmt->bind_param("i", $itemId);
                        $sIdStmt->execute();
                        $sIdRow = $sIdStmt->get_result()->fetch_assoc();
                        $sessionId = $sIdRow ? $sIdRow['session_id'] : 0;
                        $title = $sIdRow ? $sIdRow['item_title'] : 'Unknown';
                        $assignedTo = $sIdRow ? $sIdRow['assigned_to'] : null;
                        $sIdStmt->close();

                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Update Status";
                        $log_desc = "Changed status of '$title' to $status";
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();

                        // Send Notification to assigned user
                        if ($assignedTo && $assignedTo != $log_uid) {
                            // Only notify if assigned user is Active
                            $uStmt = $conn->prepare("SELECT status FROM users WHERE user_id = ?");
                            $uStmt->bind_param("i", $assignedTo);
                            $uStmt->execute();
                            $uRes = $uStmt->get_result();
                            $uRow = $uRes->fetch_assoc();
                            $uStmt->close();

                            if ($uRow && ($uRow['status'] ?? 'Active') === 'Active') {
                            $notifType = 'Agenda Item Status';
                            $notifMsg = "";
                            if ($status === 'Completed') {
                                $notifMsg = "Your agenda item '$title' has been approved and marked as completed.";
                            } else if ($status === 'Revision Needed') {
                                $notifMsg = "Revision requested for your agenda item '$title'. Please check the remarks.";
                            }

                            if ($notifMsg) {
                                $notifLink = "agendas"; // Can be more specific if front-end supports it
                                $nstmt = $conn->prepare("INSERT INTO notifications (user_id, type, message, link, is_read, created_at) VALUES (?, ?, ?, ?, 0, NOW())");
                                $nstmt->bind_param("isss", $assignedTo, $notifType, $notifMsg, $notifLink);
                                $nstmt->execute();
                                $nstmt->close();
                                }
                            }
                        }
                    } catch (Exception $e) {}

                    echo json_encode(['success' => true, 'message' => 'Status updated successfully']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to update status']);
                }
                $stmt->close();
                exit;
            }
            if (isset($_GET['action']) && $_GET['action'] === 'add_item') {
                // Create Agenda Item
                if (!isset($input['agenda_id']) || !isset($input['item_title'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Agenda ID and item title are required']);
                    exit;
                }

                $agendaId = intval($input['agenda_id']);
                $sessionId = isset($input['session_id']) ? intval($input['session_id']) : null;

                // Use agenda lookup as canonical if session_id not provided
                $sid = $sessionId ? $sessionId : $getSessionIdByAgendaId($agendaId);
                if ($sid && $isSessionInactiveById($sid)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to add items.']);
                    exit;
                }
                $title = trim($input['item_title']);
                $purpose = isset($input['item_purpose']) ? trim($input['item_purpose']) : null;
                $description = isset($input['item_description']) ? trim($input['item_description']) : null;
                $recommendation = isset($input['item_recommendation']) ? trim($input['item_recommendation']) : null;
                $dueDate = isset($input['due_date']) ? $input['due_date'] : null;
                $assignedTo = isset($input['assigned_to']) ? intval($input['assigned_to']) : null;
                // Ensure NOT NULL action_type column is populated
                $actionType = isset($input['action_type']) && trim($input['action_type']) !== ''
                    ? trim($input['action_type'])
                    : 'For Action';
                $createdBy = $_SESSION['user_id'] ?? 0;

                $stmt = $conn->prepare("INSERT INTO agenda_items (agenda_id, session_id, item_title, item_purpose, item_description, item_recommendation, action_type, deadline, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("iissssssii", $agendaId, $sessionId, $title, $purpose, $description, $recommendation, $actionType, $dueDate, $assignedTo, $createdBy);

                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Agenda item created successfully', 'item_id' => $conn->insert_id]);

                    // Track activity
                    try {
                        // If sessionId is null, try to get it from the agenda
                        if (!$sessionId) {
                            $sIdStmt = $conn->prepare("SELECT session_id FROM agendas WHERE agenda_id = ?");
                            $sIdStmt->bind_param("i", $agendaId);
                            $sIdStmt->execute();
                            $sIdRow = $sIdStmt->get_result()->fetch_assoc();
                            $sessionId = $sIdRow ? $sIdRow['session_id'] : 0;
                            $sIdStmt->close();
                        }

                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Add Agenda Item";
                        $log_desc = "Added item '" . $title . "' to agenda ID: " . $agendaId;
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        if ($lstmt) {
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        }
                    } catch (Exception $e) {
                    }

                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'Failed to add agenda item']);
                }
                $stmt->close();
                break;
            }

            if (isset($input['items']) && is_array($input['items'])) {
                // Multi-Item Merged Flow: Create Agenda (if missing) + Add Multiple Items
                $sessionId = isset($input['session_id']) ? intval($input['session_id']) : 0;

                if ($sessionId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Session ID is required to create an agenda.']);
                    exit;
                }

                if ($sessionId && $isSessionInactiveById($sessionId)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to create agendas/items.']);
                    exit;
                }
               
                // 1. Always create a NEW agenda for this request (allow multiple agendas per session)
                    $agendaTitle = isset($input['agenda_title']) ? trim($input['agenda_title']) : "New Agenda";
                    $agendaDescription = isset($input['agenda_description']) ? trim($input['agenda_description']) : "";

                    $iStmt = $conn->prepare("INSERT INTO agendas (session_id, agenda_title, agenda_description) VALUES (?, ?, ?)");
                    $iStmt->bind_param("iss", $sessionId, $agendaTitle, $agendaDescription);
                    $iStmt->execute();
                    $agendaId = $conn->insert_id;
                    $iStmt->close();

                    // Log Agenda Creation
                    try {
                        $log_uid = $_SESSION['user_id'] ?? 0;
                        $log_act = "Create Agenda";
                    $log_desc = "Created agenda: " . $agendaTitle;
                        $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                        $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    } catch (Exception $e) {}

                // 2. Insert Agenda Items
                $createdBy = $_SESSION['user_id'] ?? 0;
                $createdItems = [];
                $errorCount = 0;

                foreach ($input['items'] as $item) {
                    $itemTitle = trim($item['item_title'] ?? '');
                    if (empty($itemTitle)) continue;

                    $itemDescription = isset($item['item_description']) ? trim($item['item_description']) : '';
                    $dueDate = isset($item['due_date']) ? $item['due_date'] : null;
                    $assignedTo = isset($item['assigned_to']) ? intval($item['assigned_to']) : null;
                    $recommendation = isset($item['item_recommendation']) ? trim($item['item_recommendation']) : null;
                    $purpose = isset($item['item_purpose']) ? trim($item['item_purpose']) : null;
                    // Ensure NOT NULL action_type column is populated
                    $actionType = isset($item['action_type']) && trim($item['action_type']) !== ''
                        ? trim($item['action_type'])
                        : 'For Action';

                    $stmt = $conn->prepare("INSERT INTO agenda_items (agenda_id, session_id, item_title, item_purpose, item_description, item_recommendation, action_type, deadline, assigned_to, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("iissssssii", $agendaId, $sessionId, $itemTitle, $purpose, $itemDescription, $recommendation, $actionType, $dueDate, $assignedTo, $createdBy);

                    if ($stmt->execute()) {
                        $itemId = $conn->insert_id;
                        $createdItems[] = ['item_id' => $itemId, 'title' => $itemTitle, 'assigned_to' => $assignedTo, 'due_date' => $dueDate, 'item_description' => $itemDescription];

                        // Log Item Creation
                        try {
                            $log_uid = $_SESSION['user_id'] ?? 0;
                            $log_act = "Add Agenda Item";
                            $log_desc = "Added item '" . $itemTitle . "' to " . $agendaTitle;
                            $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                            $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                            $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                            $lstmt->execute();
                            $lstmt->close();
                        } catch (Exception $e) {}
                    } else {
                        $errorCount++;
                    }
                    $stmt->close();
                }

                if (count($input['items']) > 0) {
                    if (count($createdItems) > 0) {
                        echo json_encode([
                            'success' => true, 
                            'message' => 'Agenda and ' . count($createdItems) . ' items created successfully', 
                            'agenda_id' => $agendaId,
                            'created_items' => $createdItems
                        ]);
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'Failed to add any agenda items']);
                    }
                    break;
                } else {
                    // Items array was present but empty - we've already ensured/created the agenda
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Agenda created successfully', 
                        'agenda_id' => $agendaId
                    ]);
                    break;
                }
            }


            if (!isset($input['session_id']) || !isset($input['agenda_title'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Session ID and agenda title are required']);
                exit;
            }

            $sessionId = intval($input['session_id']);
            $agendaTitle = trim($input['agenda_title']);
            $agendaDescription = isset($input['agenda_description']) ? trim($input['agenda_description']) : "";

            if ($sessionId && $isSessionInactiveById($sessionId)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'This session is inactive. Restore the session to create agendas.']);
                exit;
            }

            $stmt = $conn->prepare("INSERT INTO agendas (session_id, agenda_title, agenda_description) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $sessionId, $agendaTitle, $agendaDescription);

            if ($stmt->execute()) {
                $agendaId = $conn->insert_id;
                echo json_encode(['success' => true, 'message' => 'Agenda created successfully', 'agenda_id' => $agendaId]);

                // Log Activity
                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Create Agenda";
                    $log_desc = "Created agenda: " . $agendaTitle;
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                    $lstmt->execute();
                    $lstmt->close();
                } catch (Exception $e) {}
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to create agenda']);
            }
            $stmt->close();
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);

            if (!isset($input['agenda_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Agenda ID is required']);
                exit;
            }

            $agendaId = intval($input['agenda_id']);
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';

            // If Staff, they can only update status
            // Administrator and Staff can update agendas
            if ($userRole !== 'Super Admin' && $userRole !== 'Admin' && $userRole !== 'Staff') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Unauthorized to update agendas']);
                exit;
            }

            $agendaTitle = isset($input['agenda_title']) ? trim($input['agenda_title']) : null;
            $agendaDescription = isset($input['agenda_description']) ? trim($input['agenda_description']) : null;
            $sessionIdInput = isset($input['session_id']) ? intval($input['session_id']) : null;
            $status = isset($input['status']) ? $input['status'] : null;

            $updates = [];
            $params = [];
            $types = '';

            if ($agendaTitle !== null) {
                $updates[] = "agenda_title = ?";
                $params[] = $agendaTitle;
                $types .= 's';
            }
            if ($agendaDescription !== null) {
                $updates[] = "agenda_description = ?";
                $params[] = $agendaDescription;
                $types .= 's';
            }
            if ($sessionIdInput !== null) {
                $updates[] = "session_id = ?";
                $params[] = $sessionIdInput;
                $types .= 'i';
            }
            if ($status !== null) {
                $updates[] = "status = ?";
                $params[] = $status;
                $types .= 's';
            }


            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                exit;
            }

            $types .= 'i';
            $params[] = $agendaId;

            $sql = "UPDATE agendas SET " . implode(', ', $updates) . " WHERE agenda_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);

            if ($stmt->execute()) {
                // Log Activity
                try {
                    // Try to get session_id for logging
                    $sStmt = $conn->prepare("SELECT session_id FROM agendas WHERE agenda_id = ?");
                    $sStmt->bind_param("i", $agendaId);
                    $sStmt->execute();
                    $sRow = $sStmt->get_result()->fetch_assoc();
                    $sessionId = $sRow ? $sRow['session_id'] : 0;
                    $sStmt->close();

                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Update Agenda";
                    $log_desc = "Updated agenda ID: " . $agendaId;
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                echo json_encode(['success' => true, 'message' => 'Agenda updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to update agenda']);
            }
            $stmt->close();
            break;

        case 'DELETE':
            $input = json_decode(file_get_contents('php://input'), true);

            // Administrator and Staff can delete agendas
            $userRole = $_SESSION['user_role'] ?? 'User - Committee';
            if ($userRole !== 'Super Admin' && $userRole !== 'Admin' && $userRole !== 'Staff') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Only administrators and staff can delete agendas']);
                exit;
            }

            if (!isset($input['agenda_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Agenda ID is required']);
                exit;
            }

            $agendaId = intval($input['agenda_id']);
            
            // 1. Get session_id before deletion for logging
            $sessionId = 0;
            try {
                $sStmt = $conn->prepare("SELECT session_id FROM agendas WHERE agenda_id = ?");
                $sStmt->bind_param("i", $agendaId);
                $sStmt->execute();
                $sRow = $sStmt->get_result()->fetch_assoc();
                $sessionId = $sRow ? $sRow['session_id'] : 0;
                $sStmt->close();
            } catch (Exception $e) {}

            // 2. Clean up reminders for the agenda itself
            try {
                $remStmt = $conn->prepare("DELETE FROM reminder_batches WHERE related_type = 'Agenda' AND related_id = ?");
                $remStmt->bind_param("i", $agendaId);
                $remStmt->execute();
                $remStmt->close();
            } catch (Exception $e) {}

            // 3. Clean up reminders and deadlines for all items in this agenda
            try {
                // Get all item IDs first
                $itemsRes = $conn->query("SELECT agenda_item_id FROM agenda_items WHERE agenda_id = $agendaId");
                while ($itemRow = $itemsRes->fetch_assoc()) {
                    $itemId = $itemRow['agenda_item_id'];
                    
                    // Delete item reminders
                    $remItemStmt = $conn->prepare("DELETE FROM reminder_batches WHERE related_type = 'AgendaItem' AND related_id = ?");
                    $remItemStmt->bind_param("i", $itemId);
                    $remItemStmt->execute();
                    $remItemStmt->close();
                    
                    // Delete item deadlines
                    $deadlineSearch = "%(Linked to Agenda Item ID: " . $itemId . ")";
                    $delDeadlineStmt = $conn->prepare("DELETE FROM deadlines WHERE description LIKE ?");
                    $delDeadlineStmt->bind_param("s", $deadlineSearch);
                    $delDeadlineStmt->execute();
                    $delDeadlineStmt->close();
                }
            } catch (Exception $e) {}

            // 4. Delete all agenda_items rows (to satisfy FK constraint) then delete the agenda
            try {
                $delItemsStmt = $conn->prepare("DELETE FROM agenda_items WHERE agenda_id = ?");
                if ($delItemsStmt) {
                    $delItemsStmt->bind_param("i", $agendaId);
                    $delItemsStmt->execute();
                    $delItemsStmt->close();
                }
            } catch (Exception $e) {}

            // 5. Finally delete the agenda itself
            $stmt = $conn->prepare("DELETE FROM agendas WHERE agenda_id = ?");
            $stmt->bind_param("i", $agendaId);

            if ($stmt->execute()) {
                // Log Activity
                try {
                    $log_uid = $_SESSION['user_id'] ?? 0;
                    $log_act = "Delete Agenda";
                    $log_desc = "Deleted agenda ID: " . $agendaId;
                    $log_ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
                    $lstmt = $conn->prepare("INSERT INTO audit_logs (user_id, action, description, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, 'Session', ?)");
                    if ($lstmt) {
                        $lstmt->bind_param("isssi", $log_uid, $log_act, $log_desc, $log_ip, $sessionId);
                        $lstmt->execute();
                        $lstmt->close();
                    }
                } catch (Exception $e) {}

                echo json_encode(['success' => true, 'message' => 'Agenda deleted successfully along with related reminders']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to delete agenda']);
            }
            $stmt->close();
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }

    if (isset($conn)) {
        $conn->close();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    if (isset($conn)) {
        $conn->close();
    }
}
?>
