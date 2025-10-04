<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/database.php";
$database = new Database();
$pdo = $database->getConnection();

try {
    $stmt = $pdo->prepare("
        SELECT CONCAT(u.first_name, ' ', u.last_name) AS resident_name, f.feedback_context, f.submitted_at, f.rating, u.profile_picture, u.email
        FROM villagelink_feedback f
        JOIN villagelink_users u ON f.acc_id = u.acc_id
        ORDER BY f.submitted_at DESC
    ");
    $stmt->execute();
    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "data" => $feedbacks]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
