<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../../config/database.php";
$database = new Database();
$pdo = $database->getConnection(); 

$response = ["status" => "error", "message" => "Unknown error"];

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    // Read POST input
    $acc_id   = $_POST['acc_id'] ?? '';
    $category = $_POST['category'] ?? '';
    $content  = $_POST['content'] ?? '';

    if (!$acc_id || !$category || !$content) {
        throw new Exception("Missing required fields");
    }

    // Handle file uploads
    $uploadDir = "../comreqs_upload/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $filePaths = [];
    if (isset($_FILES['files'])) {
        foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
            if ($_FILES['files']['error'][$key] === UPLOAD_ERR_OK) {
                $fileName = time() . "_" . basename($_FILES['files']['name'][$key]);
                $targetPath = $uploadDir . $fileName;
                if (move_uploaded_file($tmpName, $targetPath)) {
                    $filePaths[] = "comreqs_upload/" . $fileName;
                }
            }
        }
    }

    // Convert file paths to a comma-separated string
    $filePathsString = implode(',', $filePaths);

    // Insert into comreqs
    $stmt = $pdo->prepare("INSERT INTO villagelink_comreqs (acc_id, category, description, comreqs_upload, status) VALUES (?, ?, ?, ?, 'Pending')");
    $success = $stmt->execute([$acc_id, $category, $content, $filePathsString]);

    if ($success) {
        $response = ["status" => "success", "message" => "Request/Complaint saved"];
    } else {
        throw new Exception("Failed to save");
    }

} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

echo json_encode($response);
