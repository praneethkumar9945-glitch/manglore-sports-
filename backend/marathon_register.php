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

$required = ['full_name', 'college_name', 'email', 'phone', 'category', 'address'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSON(false, "Missing: $field");
    }
}

$full_name        = htmlspecialchars(trim($input['full_name']));
$college_name     = htmlspecialchars(trim($input['college_name']));
$phone            = preg_replace('/\D/', '', $input['phone']);
$email            = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$category         = htmlspecialchars(trim($input['category']));
$tshirt_size      = !empty($input['tshirt_size'])      ? htmlspecialchars(trim($input['tshirt_size']))      : null;
$dob              = !empty($input['dob'])              ? $input['dob']                                      : null;
$emergency_contact = !empty($input['emergency_contact']) ? htmlspecialchars(trim($input['emergency_contact'])) : null;
$address          = htmlspecialchars(trim($input['address']));
$amount           = 400; // Marathon registration fee

if (!$email)                     sendJSON(false, 'Invalid email address');
if (strlen($phone) < 10)         sendJSON(false, 'Invalid phone number');
if (!in_array($category, ['mb40', 'ma40', 'wb40', 'wa40'])) {
    sendJSON(false, 'Invalid category selected');
}

$conn = getDBConnection();
if (!$conn) sendJSON(false, 'DB connection failed');

$stmt = $conn->prepare("SELECT id FROM marathon_registrations WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendJSON(false, 'This email is already registered for the marathon');
}

$stmt = $conn->prepare(
    "INSERT INTO marathon_registrations
     (full_name, college_name, email, phone, category, tshirt_size, dob, emergency_contact, address, amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
);

if ($stmt->execute([$full_name, $college_name, $email, $phone, $category, $tshirt_size, $dob, $emergency_contact, $address, $amount])) {
    $ref_id = (int)$conn->lastInsertId();
    sendJSON(true, 'Details saved. Proceed to payment.', ['ref_id' => $ref_id, 'amount' => $amount]);
} else {
    sendJSON(false, 'Registration failed — please try again');
}
?>
