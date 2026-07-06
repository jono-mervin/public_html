<?php
require_once 'config/config.php';

$conn = getDBConnection();

$queries = [
    "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS otp_expiry_minutes INT DEFAULT 2 AFTER setting_value;",
    "ALTER TABLE agenda_item_documents ADD COLUMN IF NOT EXISTS permission_state VARCHAR(20) DEFAULT 'Public view' AFTER uploaded_by;",
    "DROP TABLE IF EXISTS ai_documents;"
];

foreach ($queries as $q) {
    if ($conn->query($q)) {
        echo "Success: $q\n";
    } else {
        echo "Error on $q: " . $conn->error . "\n";
    }
}
echo "Done.";
?>
