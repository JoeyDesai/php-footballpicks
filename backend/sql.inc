<?php 
#dl ('pgsql.so');
require_once 'config/database.php';

// Use centralized database configuration
$conn = getDbConnection();