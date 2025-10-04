<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once(__DIR__ . "/../../config/database.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

try {
    // Prepare query to get all non-admin users
    $query = "SELECT acc_id, first_name, middle_name, last_name, email, role, blk, lot, ph, street, subd, province, phone_number, coordinates, profile_picture, approved_status FROM villagelink_users WHERE role != 'admin' ORDER BY acc_id ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
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
            // Remove any surrounding quotes from coordinates string
            $coords_str = trim($row['coordinates'], "\"'");
            $coords = explode(',', $coords_str);
            if (count($coords) === 2) {
                $latitude = trim($coords[0]);
                $longitude = trim($coords[1]);
            }
        }

        $users[] = [
            "id" => $row['acc_id'],
            "name" => $full_name,
            "first_name" => $row['first_name'] ?: '',
            "middle_name" => $row['middle_name'] ?: '',
            "last_name" => $row['last_name'] ?: '',
            "phone" => $row['phone_number'] ?: '',
            "address" => $address,
            "status" => "Active",
            "role" => $row['role'] ?: 'Resident',
            "email" => $row['email'],
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
            "profile_picture" => $row['profile_picture'] ?: '',
            "approve_status" => $row['approved_status'] ?: ''
        ];
    }

    if (empty($users)) {
        error_log("No users found in get_users.php");
    }

    echo json_encode([
        "status" => "success",
        "data" => $users,
        "count" => count($users)
    ]);
} catch (PDOException $e) {
    error_log("Database error in get_users.php: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
