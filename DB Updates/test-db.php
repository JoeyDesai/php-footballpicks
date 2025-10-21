<?php
echo "Testing database connection...\n";

# Include database setup
$CurYear = 2025;
require_once '../sql.inc';

echo "Database connection successful!\n";
echo "Current year: $CurYear\n";

# Test a simple query
$result = dbquery("SELECT COUNT(*) as count FROM pickers");
echo "Number of pickers: " . $result[0]['count'] . "\n";

echo "Database test completed successfully!\n";
?>
