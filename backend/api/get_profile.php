<?php
header("Content-Type: application/json");
// Allow CORS from localhost:5173 (your frontend dev server)
header("Access-Control-Allow-Origin: http://localhost:5173"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once(__DIR__ . "/../../config/database.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Get user ID from query parameter
$userId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid or missing user ID"]);
    exit;
}

try {
// Prepare query to get user by ID
$query = "SELECT acc_id, first_name, middle_name, last_name, email, password, role, blk, lot, ph, street, subd, province, phone_number, coordinates, profile_picture
          FROM villagelink_users
          WHERE acc_id = :id LIMIT 1";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':id', $userId, PDO::PARAM_INT);
$stmt->execute();

$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(["status" => "error", "message" => "User not found"]);
    exit;
}

    // Compose full name
    $full_name = trim($row['first_name'] . ' ' . ($row['middle_name'] ? $row['middle_name'] . ' ' : '') . $row['last_name']);

    // Format address
    if (!empty($row['blk']) && !empty($row['lot']) && !empty($row['ph']) && $row['blk'] !== '0' && $row['lot'] !== '0' && $row['ph'] !== '0') {
        $address = 'blk ' . $row['blk'] . ', lot ' . $row['lot'] . ', ph ' . $row['ph'] . ', ' . ($row['street'] ?: '') . (!empty($row['street']) ? ', ' : '') . ($row['subd'] ?: 'N/A') . ', ' . ($row['province'] ?: 'N/A');
    } else {
        $address = trim($row['blk'] . ' ' . $row['lot'] . ' ' . $row['ph'] . ' ' . $row['street'] . ', ' . $row['subd'] . ', ' . $row['province']);
    }

    // Parse coordinates into latitude and longitude
    $latitude = '';
    $longitude = '';
    if (!empty($row['coordinates'])) {
        $coords_str = trim($row['coordinates'], "\"'");
        $coords = explode(',', $coords_str);
        if (count($coords) === 2) {
            $latitude = trim($coords[0]);
            $longitude = trim($coords[1]);
        }
    }

$user = [
    "id" => $row['acc_id'],
    "name" => $full_name,
    "phone" => $row['phone_number'] ?: '',
    "address" => $address,
    "status" => "Active",
    "role" => $row['role'] ?: 'Resident',
    "email" => $row['email'],
    "password" => $row['password'],
    "features" => ['Announcements', 'Complaints', 'Logs'],
    "blk" => $row['blk'] ?: '',
    "lot" => $row['lot'] ?: '',
    "ph" => $row['ph'] ?: '',
    "street" => $row['street'] ?: '',
    "subdivision" => $row['subd'] ?: 'Residencia De Muzon',
    "province" => $row['province'] ?: 'City of San Jose Del Monte, Bulacan',
    "coordinates" => $row['coordinates'] ?: '',
    "latitude" => $latitude,
    "longitude" => $longitude,
    "profile_picture" => $row['profile_picture'] ?: ''
];

echo json_encode([
    "status" => "success",
    "data" => $user
]);
} catch (PDOException $e) {
    error_log("Database error in get_profile.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
