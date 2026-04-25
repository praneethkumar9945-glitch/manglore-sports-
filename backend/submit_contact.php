<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db_config.php';

function sendJSON(bool $success, string $message, $data = null): void {
    echo json_encode(['success' => $success, 'status' => $success ? 'success' : 'error', 'message' => $message, 'data' => $data]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Invalid request method');
}

$input = $_POST;
if (empty($input)) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
}

$required = ['name', 'email', 'message'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSON(false, "Missing: $field");
    }
}

$name    = htmlspecialchars(trim($input['name']));
$email   = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$phone   = !empty($input['phone'])   ? preg_replace('/\D/', '', $input['phone']) : null;
$subject = !empty($input['subject']) ? htmlspecialchars(trim($input['subject'])) : null;
$message = htmlspecialchars(trim($input['message']));

if (!$email) sendJSON(false, 'Invalid email address');
if (strlen($message) < 5) sendJSON(false, 'Message too short');

$conn = getDBConnection();
if (!$conn) sendJSON(false, 'DB connection failed');

$stmt = $conn->prepare(
    "INSERT INTO contacts (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)"
);

if ($stmt->execute([$name, $email, $phone, $subject, $message])) {
    sendJSON(true, 'Message sent! We will get back to you shortly.');
} else {
    sendJSON(false, 'Failed to save message');
}
?>
