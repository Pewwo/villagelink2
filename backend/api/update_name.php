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

    if (!isset($input['first_name']) || !isset($input['last_name'])) {
        echo json_encode(["status" => "error", "message" => "First name and last name are required"]);
        exit;
    }

    $sql = "UPDATE villagelink_users SET first_name = :first_name, middle_name = :middle_name, last_name = :last_name WHERE acc_id = :acc_id";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':first_name', $input['first_name'], PDO::PARAM_STR);
    $stmt->bindValue(':middle_name', $input['middle_name'], PDO::PARAM_STR);
    $stmt->bindValue(':last_name', $input['last_name'], PDO::PARAM_STR);
    $stmt->bindValue(':acc_id', $userId, PDO::PARAM_INT);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Name updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Update failed"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
