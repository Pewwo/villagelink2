<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once("../config/database.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode([]);
    exit;
}

try {
$sql = "SELECT * FROM villagelink_announcements ORDER BY created_at DESC";
    $stmt = $pdo->query($sql);
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($announcements);
} catch (PDOException $e) {
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
