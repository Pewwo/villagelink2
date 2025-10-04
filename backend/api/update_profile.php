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

    if (!isset($input['current_password']) || !isset($input['new_password'])) {
        echo json_encode(["status" => "error", "message" => "Current password and new password are required"]);
        exit;
    }

    $currentPassword = $input['current_password'];
    $newPassword = $input['new_password'];

    // First, get the current hashed password from the database
    $stmt = $pdo->prepare("SELECT password FROM villagelink_users WHERE acc_id = :acc_id LIMIT 1");
    $stmt->bindValue(':acc_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit;
    }

    // Verify the current password
    if (!password_verify($currentPassword, $user['password'])) {
        echo json_encode(["status" => "error", "message" => "Current password is incorrect"]);
        exit;
    }

    // Hash the new password
    $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update the password in the database
    $updateStmt = $pdo->prepare("UPDATE villagelink_users SET password = :password, profile_picture = :profile_picture WHERE acc_id = :acc_id");
    $updateStmt->bindValue(':password', $hashedNewPassword, PDO::PARAM_STR);
    $updateStmt->bindValue(':profile_picture', isset($input['profile_picture']) ? $input['profile_picture'] : null, PDO::PARAM_STR);
    $updateStmt->bindValue(':acc_id', $userId, PDO::PARAM_INT);

    if ($updateStmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Password and profile picture updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update password and profile picture"]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
