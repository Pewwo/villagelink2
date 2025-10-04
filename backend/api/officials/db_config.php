<?php
// Database configuration for PDO
define('DB_HOST', 'localhost');
define('DB_NAME', 'u503753529_villagelink_db'); // Updated for Hostinger
define('DB_USER', 'u503753529_pewwo'); // Updated for Hostinger
define('DB_PASS', 'Pewwo@666'); // Updated for Hostinger

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
?>
