<?php
// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "../config/database.php"; // Ensure this is included

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$requiredFields = ['name', 'role', 'avatar', 'contact'];
foreach ($requiredFields as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Field '$field' is required"]);
        exit;
    }
}

try {
    // Insert new official
    $stmt = $pdo->prepare("INSERT INTO villagelink_officials (full_name, position, avatar, off_contact) VALUES (?, ?, ?, ?)");
    $stmt->execute([
        $input['name'],
        $input['role'],
        $input['avatar'],
        $input['contact']
    ]);

    // Get the inserted official
    $newId = $pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT official_id AS id, full_name AS name, position AS role, avatar, off_contact AS contact FROM villagelink_officials WHERE official_id = ?");
    $stmt->execute([$newId]);
    $newOfficial = $stmt->fetch();

    echo json_encode(['success' => true, 'official' => $newOfficial]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
