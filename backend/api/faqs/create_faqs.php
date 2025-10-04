<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$servername = "localhost";
$username = "u503753529_pewwo"; // Updated for Hostinger
$password = "Pewwo@666"; // Updated for Hostinger
$dbname = "u503753529_villagelink_db"; // Updated for Hostinger

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['question']) || !isset($data['answer'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing question or answer"]);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO villagelink_faqs (question, answer, created_at, updated_at) VALUES (:question, :answer, NOW(), NOW())");
    $stmt->bindParam(':question', $data['question']);
    $stmt->bindParam(':answer', $data['answer']);
    $stmt->execute();

    $inserted_id = $pdo->lastInsertId();

    $result = [
        "faq_id" => $inserted_id,
        "question" => $data['question'],
        "answer" => $data['answer'],
        "created_at" => date("Y-m-d H:i:s"),
        "updated_at" => date("Y-m-d H:i:s")
    ];
    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
}
?>
