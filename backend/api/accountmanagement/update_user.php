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

// connect to DB
$database = new Database();
$db = $database->getConnection();

// get PUT data
$data = json_decode(file_get_contents("php://input"));

if ($db && !empty($data->acc_id)) {
    try {
        // Validate input data
        if (!isset($data->first_name) || !isset($data->last_name) || !isset($data->email)) {
            throw new Exception("Required fields missing: first_name, last_name, or email");
        }

        // Use provided fields directly
        $first_name = trim($data->first_name);
        $middle_name = isset($data->middle_name) ? trim($data->middle_name) : '';
        $last_name = trim($data->last_name);
        $email = trim($data->email);
        $role = isset($data->role) ? trim($data->role) : 'resident';
        $blk = isset($data->blk) ? $data->blk : null;
        $lot = isset($data->lot) ? $data->lot : null;
        $ph = isset($data->ph) ? $data->ph : null;
        $street = isset($data->street) ? trim($data->street) : null;
        $phone_number = isset($data->phone_number) ? trim($data->phone_number) : null;
        $coordinates = isset($data->coordinates) ? trim($data->coordinates) : null;

        // Handle approved_status - validate enum values
        $approved_status = 'Unapproved'; // default value
        if (isset($data->approved_status)) {
            $status_value = trim($data->approved_status);
            if (in_array($status_value, ['Unapproved', 'Approved'])) {
                $approved_status = $status_value;
            } else {
                throw new Exception("Invalid approved_status value. Must be 'Unapproved' or 'Approved'");
            }
        }

        error_log("DEBUG: Coordinates to update: " . var_export($coordinates, true));
        error_log("DEBUG: Approved status to update: " . var_export($approved_status, true));

        // prepare update query
        $query = "UPDATE villagelink_users SET
                  first_name = :first_name,
                  middle_name = :middle_name,
                  last_name = :last_name,
                  email = :email,
                  role = :role,
                  blk = :blk,
                  lot = :lot,
                  ph = :ph,
                  street = :street,
                  phone_number = :phone_number,
                  coordinates = :coordinates,
                  approved_status = :approved_status
                  WHERE acc_id = :acc_id";

        $stmt = $db->prepare($query);

        // bind parameters
        $stmt->bindParam(":first_name", $first_name);
        $stmt->bindParam(":middle_name", $middle_name);
        $stmt->bindParam(":last_name", $last_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":blk", $blk);
        $stmt->bindParam(":lot", $lot);
        $stmt->bindParam(":ph", $ph);
        $stmt->bindParam(":street", $street);
        $stmt->bindParam(":phone_number", $phone_number);
        $stmt->bindParam(":coordinates", $coordinates);
        $stmt->bindParam(":approved_status", $approved_status);
        $stmt->bindParam(":acc_id", $data->acc_id);

        if ($stmt->execute()) {
            error_log("DEBUG: Update executed successfully.");
            ob_end_clean();
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "User updated successfully"
            ]);
        } else {
            $errorInfo = $stmt->errorInfo();
            error_log("DEBUG: Update failed. SQLSTATE: " . $errorInfo[0] . ", Error Code: " . $errorInfo[1] . ", Message: " . $errorInfo[2]);
            ob_end_clean();
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to update user"
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
