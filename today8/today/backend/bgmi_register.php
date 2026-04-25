<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // For frontend
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

$required = ['squadName', 'leaderName', 'contactNumber', 'email', 'collegeName'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendJSONResponse(false, "Missing: $field");
    }
}

$squadName = htmlspecialchars(trim($input['squadName']));
$leaderName = htmlspecialchars(trim($input['leaderName']));
$contactNumber = preg_replace('/\D/', '', $input['contactNumber']); // Normalize phone
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$collegeName = htmlspecialchars(trim($input['collegeName']));

if (!$email) sendJSONResponse(false, 'Invalid email');
if (strlen($contactNumber) < 10) sendJSONResponse(false, 'Invalid phone');

$teamMembers = isset($input['teamMembers']) && $input['teamMembers'] !== '' 
    ? json_encode(explode(',', trim($input['teamMembers']))) 
    : '[]';
$amount = 1000;
$payment_status = 'Pending';

$conn = getDBConnection();
if (!$conn) {
    sendJSONResponse(false, 'DB connection failed');
}

// Check duplicate email
$stmt = $conn->prepare("SELECT id FROM bgmi_registrations WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    sendJSONResponse(false, 'Email already registered for BGMI');
}

$stmt = $conn->prepare("
    INSERT INTO bgmi_registrations 
    (squadName, leaderName, contactNumber, email, collegeName, teamMembers, amount, payment_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");
if ($stmt->execute([$squadName, $leaderName, $contactNumber, $email, $collegeName, $teamMembers, $amount, $payment_status])) {
    sendJSONResponse(true, 'BGMI registration success!');
} else {
    sendJSONResponse(false, 'Insert failed');
}
?>

