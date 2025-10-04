<?php
// Disable error display to avoid corrupting JSON output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Start output buffering to prevent unwanted output
ob_start();

include_once(__DIR__ . "/../../config/database.php");

// connect to DB
$database = new Database();
$db = $database->getConnection();

// get POST data
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->email) &&
    !empty($data->password)
) {
    // prepare query
    $query = "SELECT * FROM villagelink_users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $data->email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // verify password
        if (password_verify($data->password, $user['password'])) {
            ob_end_clean();
            http_response_code(200);
            echo json_encode([
                "message" => "Login successful",
                "user" => [
                    "acc_id" => $user['acc_id'],
                    "first_name" => $user['first_name'],
                    "last_name" => $user['last_name'],
                    "middle_name" => $user['middle_name'],
                    "email" => $user['email'],
                    "role" => $user['role'],
                    "blk" => $user['blk'],
                    "lot" => $user['lot'],
                    "ph" => $user['ph'],
                    "coordinates" => $user['coordinates'],
                    "approve_status" => $user['approved_status']
                ]
            ]);
        } else {
            ob_end_clean();
            http_response_code(401);
            echo json_encode(["message" => "Invalid password."]);
        }
    } else {
        ob_end_clean();
        http_response_code(404);
        echo json_encode(["message" => "User not found."]);
    }
} else {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["message" => "Email and password are required."]);
}
?>
