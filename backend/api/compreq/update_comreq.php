<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/database.php";
$database = new Database();
$pdo = $database->getConnection(); 

$response = ["status" => "error", "message" => "Unknown error"];

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    // Read POST input
    $comreq_id = $_POST['comreq_id'] ?? '';
    $status = $_POST['status'] ?? '';
    $remarks = $_POST['remarks'] ?? '';

    if (!$comreq_id || !$status) {
        throw new Exception("Missing required fields");
    }

    // Update the request/complaint
    $stmt = $pdo->prepare("UPDATE villagelink_comreqs SET status = ?, remarks = ? WHERE comreq_id = ?");
    $success = $stmt->execute([$status, $remarks, $comreq_id]);

    if ($success) {
        $response = ["status" => "success", "message" => "Request/Complaint updated"];
    } else {
        throw new Exception("Failed to update");
    }

} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

echo json_encode($response);
