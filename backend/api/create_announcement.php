<?php
header("Access-Control-Allow-Origin: *"); // Allow requests from any origin
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow specific methods
header("Access-Control-Allow-Headers: Content-Type"); // Allow specific headers
header("Content-Type: application/json; charset=UTF-8");

require_once "../config/database.php"; // Ensure this is included
$database = new Database();
$pdo = $database->getConnection(); // Establish the connection

$response = ["success" => false, "message" => "Unknown error"];

try {
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    $acc_id   = $_POST["acc_id"] ?? null;
    $title    = $_POST["title"] ?? null;
    $content  = $_POST["content"] ?? null;
    $category = $_POST["category"] ?? null;

    if (!$acc_id || !$title || !$content || !$category) {
        throw new Exception("Missing required fields");
    }

    // Handle file upload (if image sent)
    $imagePath = null;
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "../uploads/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $imageName = time() . "_" . basename($_FILES["image"]["name"]);
        $targetPath = $uploadDir . $imageName;
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $targetPath)) {
            $imagePath = "uploads/" . $imageName;
        }
    }

    // Insert into DB
    $stmt = $pdo->prepare("INSERT INTO villagelink_announcements (acc_id, title, content, category, image)
                           VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$acc_id, $title, $content, $category, $imagePath]);
    $announcementId = $pdo->lastInsertId();

    // Emit socket event for realtime update
    $socketData = [
        'ann_id' => $announcementId,
        'acc_id' => $acc_id,
        'title' => $title,
        'content' => $content,
        'category' => $category,
        'image' => $imagePath,
        'created_at' => date('Y-m-d H:i:s')
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/emit');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'table' => 'announcement',
        'action' => 'new',
        'data' => $socketData
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);

    $response = ["success" => true, "message" => "Announcement created"];
    error_log("Announcement created: " . json_encode([$acc_id, $title, $content, $category, $imagePath])); // Log the created announcement details
} catch (Exception $e) {
    $response = ["success" => false, "message" => $e->getMessage()];
}

echo json_encode($response);
