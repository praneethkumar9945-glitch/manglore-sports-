<?php
function getDBConnection() {
    $host = 'localhost';  // Update with your host
    $dbname = 'sports_fest';  // Update with your DB name
    $username = 'root';  // Update with your username
    $password = '';  // Update with your password
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        error_log("DB Connection failed: " . $e->getMessage());
        return false;
    }
}
?>

