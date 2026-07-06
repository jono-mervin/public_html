<?php
require_once 'config.php';
header('Content-Type: application/json');
$conn = getDBConnection();

$result = $conn->query("SHOW TABLES LIKE 'reminders'");
$tableExists = $result->num_rows > 0;

$columns = [];
if ($tableExists) {
    $res = $conn->query("DESCRIBE reminders");
    while ($row = $res->fetch_assoc()) {
        $columns[] = $row;
    }
}

echo json_encode([
    'table_exists' => $tableExists,
    'columns' => $columns
]);
$conn->close();
?>