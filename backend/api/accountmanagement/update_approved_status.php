<?php
// Disable error display to avoid corrupting JSON output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: PUT, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Start output buffering to prevent unwanted output
ob_start();

include_once(__DIR__ . "/../../config/database.php");

// Connect to DB
$database = new Database();
$db = $database->getConnection();

// Get PUT data
$data = json_decode(file_get_contents("php://input"));

if ($db && !empty($data->acc_id) && isset($data->approved_status)) {
    try {
        // Validate approved_status
        $approved_status = trim($data->approved_status);
        if (!in_array($approved_status, ['Approved', 'Unapproved'])) {
            throw new Exception("Invalid approved_status value. Must be 'Approved' or 'Unapproved'");
        }

        // Prepare update query
        $query = "UPDATE villagelink_users SET approved_status = :approved_status WHERE acc_id = :acc_id";
        $stmt = $db->prepare($query);

        // Bind parameters
        $stmt->bindParam(":approved_status", $approved_status);
        $stmt->bindParam(":acc_id", $data->acc_id);

        if ($stmt->execute()) {
            ob_end_clean();
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Approved status updated successfully"
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            error_log("DEBUG: Update failed. SQLSTATE: " . $errorInfo[0] . ", Error Code: " . $errorInfo[1] . ", Message: " . $errorInfo[2]);
            ob_end_clean();
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to update approved status"
            ]);
        }

    } catch(Exception $exception) {
        ob_end_clean();
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $exception->getMessage()
        ]);
    } catch(PDOException $exception) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $exception->getMessage()
        ]);
    }
} else {
    ob_end_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data or database connection failed"
    ]);
}
?>
