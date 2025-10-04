<?php
// Enable error logging but do not print to client
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . "/../php-error.log");

ob_start(); // buffer output to catch anything unexpected

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Database connection
require_once("C:/xampp/htdocs/villagelink-backend/backend/config/database.php");

# Removed websocket_server require to remove socket implementation
// require_once("C:/xampp/htdocs/villagelink-backend/backend/websocket_server.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST/PUT
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// Parse JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Invalid or missing JSON body"]);
    exit;
}

// Validate required fields
if (!isset($input['emergency_id']) || !isset($input['sos_status'])) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Missing required fields: emergency_id and sos_status are required"]);
    exit;
}

$emergency_id = (int)$input['emergency_id'];
$sos_status = trim($input['sos_status']);
$sos_remarks = isset($input['sos_remarks']) ? trim($input['sos_remarks']) : null;

// Validate status
$sos_status_lower = strtolower($sos_status);
if (!in_array($sos_status_lower, ['ongoing', 'resolved'])) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Invalid sos_status. Must be 'Ongoing' or 'Resolved'"]);
    exit;
}

try {
    // Update DB
    $sql = "UPDATE villagelink_emergencies 
            SET sos_status = :sos_status, sos_remarks = :sos_remarks 
            WHERE emergency_id = :emergency_id";
    $stmt = $pdo->prepare($sql);

    $stmt->bindParam(':emergency_id', $emergency_id, PDO::PARAM_INT);
    $stmt->bindParam(':sos_status', $sos_status, PDO::PARAM_STR);
    $stmt->bindParam(':sos_remarks', $sos_remarks, PDO::PARAM_STR);

    if ($stmt->execute()) {
        if ($stmt->rowCount() > 0) {
            // Emit socket event for realtime update
            $socketData = [
                'emergency_id' => $emergency_id,
                'sos_status' => $sos_status,
                'sos_remarks' => $sos_remarks,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/emit');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'table' => 'emergency',
                'action' => 'update',
                'data' => $socketData
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_exec($ch);
            curl_close($ch);

            ob_end_clean();
            echo json_encode([
                "status" => "success",
                "message" => "Emergency status updated successfully",
                "updated_fields" => [
                    "emergency_id" => $emergency_id,
                    "sos_status" => $sos_status,
                    "sos_remarks" => $sos_remarks
                ]
            ]);
        } else {
            ob_end_clean();
            echo json_encode(["status" => "error", "message" => "No emergency record found with the provided ID"]);
        }
    } else {
        ob_end_clean();
        echo json_encode(["status" => "error", "message" => "Failed to update emergency status"]);
    }

} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
