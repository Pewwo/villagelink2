<?php
error_reporting(0); // Suppress warnings and notices to avoid corrupting JSON output
ob_start(); // Start output buffering to prevent premature output

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../../config/database.php");

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

try {
    $sql = "
    SELECT
        e.emergency_id,
        e.acc_id,
        e.realtime_coords,
        e.sos_remarks,
        e.sos_status,
        e.created_at,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.blk,
        u.lot,
        u.ph,
        u.street,
        u.subd,
        u.province,
        u.profile_picture

    FROM villagelink_emergencies e
    JOIN villagelink_users u ON e.acc_id = u.acc_id
    ORDER BY e.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    $emergencies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format the data as requested
    $formatted_emergencies = array();
    foreach ($emergencies as $emergency) {
        $addressParts = array_filter([
            "Blk " . $emergency['blk'] . ', ',
            "Lot " . $emergency['lot'] . ', ',
            "Ph " . $emergency['ph'] . ', ',
            $emergency['street'] . ', ',
            $emergency['subd'] . ', ',
            $emergency['province']
        ]);
        $fullAddress = implode(' ', $addressParts);

        $formatted_emergencies[] = array(
            "emergency_id" => $emergency['emergency_id'],
            "acc_id" => $emergency['acc_id'],
            "name" => $emergency['last_name'] . ', ' . $emergency['first_name'],
            "phone_number" => $emergency['phone_number'],
            "address" => $fullAddress,
            "realtime_coords" => $emergency['realtime_coords'],
            "sos_remarks" => $emergency['sos_remarks'],
            "sos_status" => $emergency['sos_status'],
            "created_at" => $emergency['created_at'],
            "date" => date('m/d/Y', strtotime($emergency['created_at'])),
            "time" => date('H:i', strtotime($emergency['created_at'])),
            "profile_picture" => $emergency['profile_picture']
        );
    }
    ob_end_clean();
    flush();

    // Return the JSON response
    echo json_encode(["status" => "success", "data" => $formatted_emergencies]);
    
} catch (PDOException $e) {
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
