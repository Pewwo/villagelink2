<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid input or missing user ID"]);
    exit;
}

$userId = intval($input['id']);

$servername = "localhost";
$username = "u503753529_pewwo"; // Updated for Hostinger
$password = "Pewwo@666"; // Updated for Hostinger
$dbname = "u503753529_villagelink_db"; // Updated for Hostinger

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $allowedFields = ["blk", "lot", "ph", "street", "subd", "province", "coordinates"];

    $fields = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }

    if (count($fields) === 0) {
        echo json_encode(["status" => "error", "message" => "No address fields to update"]);
        exit;
    }

    $sql = "UPDATE villagelink_users SET " . implode(", ", $fields) . " WHERE acc_id = :acc_id";
    $stmt = $pdo->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':acc_id', $userId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Address information updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Update failed"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
