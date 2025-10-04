<?php
error_reporting(0); // Suppress warnings and notices to avoid corrupting JSON output
ob_start(); // Start output buffering to prevent premature output

header("Access-Control-Allow-Origin: * ");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Removed WebSocket server require to remove socket implementation
// require_once __DIR__ . '/../websocket_server.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection parameters
$host = "localhost";
$db_name = "u503753529_villagelink_db";  // Updated for Hostinger
$username = "u503753529_pewwo";            // Updated for Hostinger
$password = "Pewwo@666";                // Updated for Hostinger

// Create connection
$conn = new mysqli($host, $username, $password, $db_name);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    ob_end_clean();
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    ob_end_clean();
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Retrieve POST data
$acc_id = isset($_POST['acc_id']) ? $conn->real_escape_string($_POST['acc_id']) : null;
$realtime_coords = isset($_POST['realtime_coords']) ? $conn->real_escape_string($_POST['realtime_coords']) : null;
$sos_remarks = isset($_POST['sos_remarks']) ? $conn->real_escape_string($_POST['sos_remarks']) : '';
$sos_status = isset($_POST['sos_status']) ? $conn->real_escape_string($_POST['sos_status']) : 'ongoing';

// Validate required fields
if (!$acc_id || !$realtime_coords) {
    http_response_code(400);
    ob_end_clean();
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit();
}

// Prepare SQL insert statement
$sql = "INSERT INTO villagelink_emergencies (acc_id, realtime_coords, sos_remarks, sos_status, created_at) VALUES (?, ?, ?, ?, NOW())";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    ob_end_clean();
    echo json_encode(["success" => false, "message" => "Failed to prepare statement: " . $conn->error]);
    exit();
}

$stmt->bind_param("ssss", $acc_id, $realtime_coords, $sos_remarks, $sos_status);

if ($stmt->execute()) {
    $emergencyId = $stmt->insert_id;

    // Emit socket event for realtime update
    $socketData = [
        'emergency_id' => $emergencyId,
        'acc_id' => $acc_id,
        'realtime_coords' => $realtime_coords,
        'sos_remarks' => $sos_remarks,
        'sos_status' => $sos_status,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/emit');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'table' => 'emergency',
        'action' => 'new',
        'data' => $socketData
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);

    ob_end_clean();
    echo json_encode(["success" => true, "message" => "Emergency record created successfully"]);
} else {
    http_response_code(500);
    ob_end_clean();
    echo json_encode(["success" => false, "message" => "Failed to create emergency record: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
