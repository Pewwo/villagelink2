<?php
// Disable error display to avoid corrupting JSON output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Start output buffering to prevent unwanted output
ob_start();

include_once(__DIR__ . "/../../config/database.php");

// connect to DB
$database = new Database();
$db = $database->getConnection();

// get DELETE data
$data = json_decode(file_get_contents("php://input"));

if ($db && !empty($data->acc_id)) {
    try {
        // Validate that user exists and is not an admin
        $checkQuery = "SELECT role FROM villagelink_users WHERE acc_id = :acc_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":acc_id", $data->acc_id);
        $checkStmt->execute();

        if ($checkStmt->rowCount() === 0) {
            ob_end_clean();
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "User not found"
            ]);
            exit();
        }

        $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
        if ($user['role'] === 'admin') {
            ob_end_clean();
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Cannot delete admin users"
            ]);
            exit();
        }

        // Delete the user
        $deleteQuery = "DELETE FROM villagelink_users WHERE acc_id = :acc_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(":acc_id", $data->acc_id);

        if ($deleteStmt->execute()) {
            if ($deleteStmt->rowCount() > 0) {
                ob_end_clean();
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "User deleted successfully"
                ]);
            } else {
                ob_end_clean();
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "User not found"
                ]);
            }
        } else {
            $errorInfo = $deleteStmt->errorInfo();
            error_log("DEBUG: Delete failed. SQLSTATE: " . $errorInfo[0] . ", Error Code: " . $errorInfo[1] . ", Message: " . $errorInfo[2]);
            ob_end_clean();
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to delete user"
            ]);
        }

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
