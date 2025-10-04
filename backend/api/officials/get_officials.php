<?php
// Start output buffering at the very top
ob_start();

// Enable error display temporarily for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../../config/database.php"; // Corrected path to database.php

try {
    $database = new Database();
    $pdo = $database->getConnection();

    if ($pdo === null) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit();
    }

    // Prepare and execute query with error handling
    $stmt = $pdo->prepare("SELECT official_id AS id, full_name AS name, position AS role, avatar, off_contact AS contact, updated_at FROM villagelink_officials ORDER BY official_id");
    if (!$stmt->execute()) {
        $errorInfo = $stmt->errorInfo();
        http_response_code(500);
        echo json_encode(['error' => 'Query execution failed: ' . $errorInfo[2]]);
        exit();
    }
    $officials = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Prepend base URL to avatar paths
    $baseUrl = 'http://localhost/villagelink-backend/backend/api/officials/uploads';
    foreach ($officials as &$official) {
        if (!empty($official['avatar'])) {
            $official['avatar'] = $baseUrl . '/' . basename($official['avatar']);
        }
    }

    ob_end_clean(); // Clear any buffered output before sending JSON
    echo json_encode($officials);

} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
// Removed closing PHP tag to prevent accidental whitespace output
