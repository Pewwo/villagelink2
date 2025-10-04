<?php
// Disable error display to avoid corrupting JSON output
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Start output buffering to prevent unwanted output
ob_start();

// Database connection details
$host = "localhost";
$db_name = "u503753529_villagelink_db"; // Updated for Hostinger
$username = "u503753529_pewwo"; // Updated for Hostinger
$password = "Pewwo@666"; // Updated for Hostinger

try {
    $dsn = "mysql:host=$host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get the POSTed JSON data
$data = json_decode(file_get_contents("php://input"), true);

if (
    !isset($data['first_name']) || empty($data['first_name']) ||
    !isset($data['last_name']) || empty($data['last_name']) ||
    !isset($data['email']) || empty($data['email']) ||
    !isset($data['password']) || empty($data['password'])
) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields"]);
    exit();
}

// Sanitize inputs
$first_name = trim($data['first_name']);
$middle_name = isset($data['middle_name']) ? trim($data['middle_name']) : null;
$last_name = trim($data['last_name']);
$email = trim($data['email']);
$password = $data['password'];
$role = isset($data['role']) ? trim($data['role']) : 'Resident';
$blk = isset($data['blk']) ? (int)$data['blk'] : null;
$lot = isset($data['lot']) ? (int)$data['lot'] : null;
$ph = isset($data['ph']) ? (int)$data['ph'] : null;
$phone_number = isset($data['phone_number']) ? trim($data['phone_number']) : null;
$coordinates = isset($data['coordinates']) ? trim($data['coordinates']) : null;

// Check if email already exists
try {
    $stmt = $pdo->prepare("SELECT acc_id FROM villagelink_users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        ob_end_clean();
        http_response_code(409);
        echo json_encode(["message" => "Email already registered"]);
        exit();
    }
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    exit();
}

// Hash the password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert user data
try {
    $stmt = $pdo->prepare("INSERT INTO villagelink_users (first_name, middle_name, last_name, email, password, role, blk, lot, street, subd, province, ph, phone_number, coordinates) VALUES (:first_name, :middle_name, :last_name, :email, :password, :role, :blk, :lot, :street, :subd, :province, :ph, :phone_number, :coordinates)");
    $stmt->execute([
        ':first_name' => $first_name,
        ':middle_name' => $middle_name,
        ':last_name' => $last_name,
        ':email' => $email,
        ':password' => $hashed_password,
        ':role' => $role,
        ':blk' => $blk,
        ':lot' => $lot,
        ':street' => isset($data['street']) ? trim($data['street']) : null,
        ':subd' => isset($data['subdivision']) ? trim($data['subdivision']) : null,
        ':province' => isset($data['province']) ? trim($data['province']) : null,
        ':ph' => $ph,
        ':phone_number' => $phone_number,
        ':coordinates' => $coordinates,
    ]);
    ob_end_clean();
    http_response_code(201);
    echo json_encode(["message" => "User registered successfully"]);
} catch (PDOException $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(["message" => "Failed to register user: " . $e->getMessage()]);
}
?>
