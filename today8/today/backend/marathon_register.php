<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'db_config.php';

function sendJSONResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$input = $_POST;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSONResponse(false, 'Invalid request method');
}

$required = ['full_name', 'college_name', 'email', 'phone', 'category', 'address'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSONResponse(false, "Missing: $field");
    }
}

$full_name = htmlspecialchars(trim($input['full_name']));
$college_name = htmlspecialchars(trim($input['college_name']));
$phone = preg_replace('/\D/', '', $input['phone']);
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$category = htmlspecialchars(trim($input['category']));
$tshirt_size = !empty($input['tshirt_size']) ? htmlspecialchars(trim($input['tshirt_size'])) : null;
$dob = !empty($input['dob']) ? $input['dob'] : null;
$emergency_contact = !empty($input['emergency_contact']) ? htmlspecialchars(trim($input['emergency_contact'])) : null;
$address = htmlspecialchars(trim($input['address']));

if (!$email) sendJSONResponse(false, 'Invalid email');
if (strlen($phone) < 10) sendJSONResponse(false, 'Invalid phone');
if (!in_array($category, ['mb40', 'ma40', 'wb40', 'wa40'])) sendJSONResponse(false, 'Invalid category');

$conn = getDBConnection();
if (!$conn) {
    sendJSONResponse(false, 'DB connection failed');
}

// Duplicate check
$stmt = $conn->prepare("SELECT id FROM marathon_registrations WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendJSONResponse(false, 'Email already registered for marathon');
}

$stmt = $conn->prepare("
    INSERT INTO marathon_registrations 
    (full_name, college_name, email, phone, category, tshirt_size, dob, emergency_contact, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if ($stmt->execute([
    $full_name, $college_name, $email, $phone, $category,
    $tshirt_size, $dob, $emergency_contact, $address
])) {
    sendJSONResponse(true, 'Marathon registration success!');
} else {
    sendJSONResponse(false, 'Insert failed');
}
?>

