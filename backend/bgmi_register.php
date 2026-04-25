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
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Invalid request method');
}

// Accept both JSON body and form-urlencoded
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!$input) {
    $input = $_POST;
}

$required = ['squadName', 'leaderName', 'contactNumber', 'email', 'collegeName'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSON(false, "Missing: $field");
    }
}

$squadName     = htmlspecialchars(trim($input['squadName']));
$leaderName    = htmlspecialchars(trim($input['leaderName']));
$contactNumber = preg_replace('/\D/', '', $input['contactNumber']);
$email         = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$collegeName   = htmlspecialchars(trim($input['collegeName']));

if (!$email)                        sendJSON(false, 'Invalid email');
if (strlen($contactNumber) < 10)    sendJSON(false, 'Invalid phone number');

// teamMembers arrives as a JSON string from the frontend
$teamMembers = '[]';
if (!empty($input['teamMembers'])) {
    $decoded = json_decode($input['teamMembers'], true);
    $teamMembers = is_array($decoded) ? json_encode($decoded) : '[]';
}

$amount = 1000; // BGMI registration fee (paise will be calculated at order creation)

$conn = getDBConnection();
if (!$conn) sendJSON(false, 'DB connection failed');

$stmt = $conn->prepare("SELECT id FROM bgmi_registrations WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendJSON(false, 'This email is already registered for BGMI');
}

$stmt = $conn->prepare(
    "INSERT INTO bgmi_registrations
     (squadName, leaderName, contactNumber, email, collegeName, teamMembers, amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
);

if ($stmt->execute([$squadName, $leaderName, $contactNumber, $email, $collegeName, $teamMembers, $amount])) {
    $ref_id = (int)$conn->lastInsertId();
    sendJSON(true, 'BGMI details saved. Proceed to payment.', ['ref_id' => $ref_id, 'amount' => $amount]);
} else {
    sendJSON(false, 'Registration failed — please try again');
}
?>
