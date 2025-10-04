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

    $acc_id = $_POST["acc_id"] ?? null;
    $feedback_context = $_POST["feedback_context"] ?? null;
    $rating = $_POST["rating"] ?? null;

    if (!$acc_id || !$feedback_context || $rating === null) {
        throw new Exception("Missing required fields");
    }

    // Insert into DB
    $stmt = $pdo->prepare("INSERT INTO villagelink_feedback (acc_id, feedback_context, rating) VALUES (?, ?, ?)");
    $stmt->execute([$acc_id, $feedback_context, $rating]);
    $feedbackId = $pdo->lastInsertId();

    // Emit socket event for realtime update
    $socketData = [
        'feedback_id' => $feedbackId,
        'acc_id' => $acc_id,
        'feedback_context' => $feedback_context,
        'rating' => $rating,
        'submitted_at' => date('Y-m-d H:i:s')
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/emit');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'table' => 'feedback',
        'action' => 'new',
        'data' => $socketData
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);

    $response = ["success" => true, "message" => "Feedback submitted"];
    error_log("Feedback submitted: " . json_encode([$acc_id, $feedback_context, $rating])); // Log the feedback details
} catch (Exception $e) {
    $response = ["success" => false, "message" => $e->getMessage()];
}

echo json_encode($response);
