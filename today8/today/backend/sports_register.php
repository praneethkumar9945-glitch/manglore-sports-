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

$required = ['college_name', 'email', 'phone', 'gender', 'sport', 'address'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSONResponse(false, "Missing: $field");
    }
}

$college_name = htmlspecialchars(trim($input['college_name']));
$phone = preg_replace('/\D/', '', $input['phone']);
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$gender = htmlspecialchars(trim($input['gender']));
$sport = htmlspecialchars(trim($input['sport']));
$player_names = isset($input['player_names']) ? json_encode(json_decode($input['player_names'], true)) : '[]';
$emergency_contact = !empty($input['emergency_contact']) ? htmlspecialchars(trim($input['emergency_contact'])) : null;
$address = htmlspecialchars(trim($input['address']));

if (!$email) sendJSONResponse(false, 'Invalid email');
if (strlen($phone) < 10) sendJSONResponse(false, 'Invalid phone');
if (!in_array($gender, ['male', 'female', 'other'])) sendJSONResponse(false, 'Invalid gender');

$conn = getDBConnection();
if (!$conn) {
    sendJSONResponse(false, 'DB connection failed');
}

// Duplicate check
$stmt = $conn->prepare("SELECT id FROM sports_registrations WHERE email = ? AND sport = ?");
$stmt->execute([$email, $sport]);
if ($stmt->fetch()) {
    sendJSONResponse(false, "Already registered for $sport");
}

$stmt = $conn->prepare("
    INSERT INTO sports_registrations 
    (college_name, email, phone, gender, sport, player_names, emergency_contact, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

if ($stmt->execute([
    $college_name, $email, $phone, $gender, $sport, 
    $player_names, $emergency_contact, $address
])) {
    // Return sport for payment calculation
    sendJSONResponse(true, 'Sports registration success!', ['sport' => $sport]);
} else {
    sendJSONResponse(false, 'Insert failed');
}
?>

