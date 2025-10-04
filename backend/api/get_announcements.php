<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../config/database.php");

// check if ann_id is provided
if (!isset($_GET['ann_id'])) {
    echo json_encode(["success" => false, "message" => "Missing announcement ID"]);
    exit;
}

$ann_id = intval($_GET['ann_id']);

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

try {
    // query announcement with author name
    $sql = "SELECT a.ann_id, a.acc_id, CONCAT(u.first_name, ' ', u.last_name) AS author, a.title, a.content, a.category, a.image, a.created_at
            FROM announcements a
            LEFT JOIN users u ON a.acc_id = u.acc_id
            WHERE a.ann_id = :ann_id
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':ann_id', $ann_id, PDO::PARAM_INT);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        if (!$row['author']) {
            $row['author'] = "Community Board";
        }

        echo json_encode(["success" => true, "announcement" => $row]);
    } else {
        echo json_encode(["success" => false, "message" => "Announcement not found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
