<?php
// Suppress warnings and notices in output to prevent HTML in JSON response
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once "../../config/database.php";

$response = ["status" => "error", "message" => "Unknown error"];

try {
    $database = new Database();
    $pdo = $database->getConnection();

    if ($pdo === null) {
        throw new Exception("Database connection failed");
    }
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new Exception("Invalid request method");
    }

    // Check if request is multipart/form-data (file upload)
    if (strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        // Handle multipart/form-data request
        $id = $_POST['id'] ?? '';
        if (!$id) {
            throw new Exception("Missing required fields");
        }

        // Check if official exists
        $stmt = $pdo->prepare("SELECT * FROM villagelink_officials WHERE official_id = ?");
        $stmt->execute([$id]);
        $official = $stmt->fetch();

        if (!$official) {
            throw new Exception("Official not found");
        }

        $updateFields = [];
        $params = [];

        // Handle avatar file upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = "../officials/uploads/";
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $imageName = time() . "_" . basename($_FILES['image']['name']);
            $targetPath = $uploadDir . $imageName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $avatarPath = "uploads/" . $imageName;
            $updateFields[] = "avatar = ?";
            $params[] = $avatarPath;
        } else {
            throw new Exception("Failed to move uploaded file");
        }
        }

        // Other fields
        $fieldsMap = ['full_name' => 'name', 'position' => 'role', 'off_contact' => 'contact'];
        foreach ($fieldsMap as $dbField => $postField) {
            if (isset($_POST[$postField])) {
                $updateFields[] = "$dbField = ?";
                $params[] = $_POST[$postField];
            }
        }

        // Handle avatar if sent as string (no new file upload)
        if (isset($_POST['avatar']) && !isset($_FILES['image'])) {
            $updateFields[] = "avatar = ?";
            $params[] = $_POST['avatar'];
        }

        if (count($updateFields) > 0) {
            $params[] = $id;
            $sql = "UPDATE villagelink_officials SET " . implode(', ', $updateFields) . " WHERE official_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Fetch updated official
        $stmt = $pdo->prepare("SELECT official_id AS id, full_name AS name, position AS role, avatar, off_contact AS contact, updated_at AS updated_at FROM villagelink_officials WHERE official_id = ?");
        $stmt->execute([$id]);
        $updatedOfficial = $stmt->fetch();

        $response = ["status" => "success", "message" => "Official updated", "official" => $updatedOfficial];
    } else {
        // Handle JSON request (existing logic)
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['id'])) {
            throw new Exception("Missing required fields");
        }

        // Check if official exists
        $stmt = $pdo->prepare("SELECT * FROM villagelink_officials WHERE official_id = ?");
        $stmt->execute([$input['id']]);
        $official = $stmt->fetch();

        if (!$official) {
            throw new Exception("Official not found");
        }

        // Update fields
        $fields = ['full_name' => 'name', 'position' => 'role', 'avatar' => 'avatar', 'off_contact' => 'contact', 'update_timestamp' => 'updated_at'];
        $updateFields = [];
        $params = [];

        foreach ($fields as $dbField => $inputField) {
            if (isset($input[$inputField])) {
                $updateFields[] = "$dbField = ?";
                $params[] = $input[$inputField];
            }
        }

        if (count($updateFields) > 0) {
            $params[] = $input['id'];
            $sql = "UPDATE villagelink_officials SET " . implode(', ', $updateFields) . " WHERE official_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // Fetch updated official
        $stmt = $pdo->prepare("SELECT official_id AS id, full_name AS name, position AS role, avatar, off_contact AS contact, update_timestamp AS updated_at FROM villagelink_officials WHERE official_id = ?");
        $stmt->execute([$input['id']]);
        $updatedOfficial = $stmt->fetch();

        $response = ["status" => "success", "message" => "Official updated", "official" => $updatedOfficial];
    }

} catch (Exception $e) {
    $response = ["status" => "error", "message" => $e->getMessage()];
}

echo json_encode($response);
