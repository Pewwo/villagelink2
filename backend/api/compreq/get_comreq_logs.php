<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("C:/xampp/htdocs/villagelink-backend/backend/config/database.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

try {
    $sql = " 
    SELECT 
        c.comreq_id,
        c.category,
        c.status,
        c.description AS content,
        c.comreqs_upload,
        c.created_at,
        c.remarks,
        u.acc_id,
        CONCAT(u.first_name, ', ', u.last_name) AS name,
        CONCAT('Blk ', u.blk, ', ', 
        ' Lot ', ', ',u.lot, ' 
        ', u.street, ', ',
        ' Ph ', u.ph, ', ',
        ' ', u.subd, ', ',
        ' ', u.province) AS address,
        u.phone_number,
        u.coordinates,
        u.profile_picture
    FROM villagelink_comreqs c
    JOIN villagelink_users u ON c.acc_id = u.acc_id
    ORDER BY c.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Debugging: Log the fetched data with more detail
    error_log("Fetched logs: " . print_r($logs, true)); // Log the raw data for debugging

    // Return the JSON response
    echo json_encode(["status" => "success", "data" => $logs]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
