<?php
class Database {
    private $host = "localhost";
    private $db_name = "u503753529_villagelink_db"; // Updated for Hostinger
    private $username = "u503753529_pewwo"; // Updated for Hostinger
    private $password = "Pewwo@666";     // Updated for Hostinger
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                                  $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            // Log error instead of echoing to avoid corrupting JSON output
            error_log("Database connection error: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
?>
