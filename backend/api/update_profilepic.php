<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

$servername = "localhost";
$username = "u503753529_pewwo"; // Updated for Hostinger
$password = "Pewwo@666"; // Updated for Hostinger
$dbname = "u503753529_villagelink_db"; // Updated for Hostinger

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    $userId = intval($_POST['id'] ?? 0);
    if (!$userId) {
        throw new Exception("Missing user ID");
    }

    // Handle file upload
    $imagePath = null;
    if (isset($_FILES["profilePic"]) && $_FILES["profilePic"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "../uploads/profile_pics/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $imageName = time() . "_" . basename($_FILES["profilePic"]["name"]);
        $targetPath = $uploadDir . $imageName;
        if (move_uploaded_file($_FILES["profilePic"]["tmp_name"], $targetPath)) {
            $imagePath = "uploads/profile_pics/" . $imageName;
        } else {
            throw new Exception("Failed to upload image");
        }
    } else {
        throw new Exception("No image file provided or upload error");
    }

    // Update the profile_picture column in the database
    $updateStmt = $pdo->prepare("UPDATE villagelink_users SET profile_picture = :profile_picture WHERE acc_id = :acc_id");
    $updateStmt->bindValue(':profile_picture', $imagePath, PDO::PARAM_STR);
    $updateStmt->bindValue(':acc_id', $userId, PDO::PARAM_INT);

    if ($updateStmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Profile picture updated successfully", "imageUrl" => $imagePath]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update profile picture"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
