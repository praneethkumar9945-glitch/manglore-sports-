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
require_once __DIR__ . '/email_helper.php';

function sendJSON(bool $success, string $message, $data = null): void {
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(false, 'Invalid request method');
}

$input = $_POST;
if (empty($input)) {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
}

$required = ['college_name', 'email', 'phone', 'gender', 'sport', 'address'];
foreach ($required as $field) {
    if (empty($input[$field])) sendJSON(false, "Missing: $field");
}

$college_name      = htmlspecialchars(trim($input['college_name']));
$phone             = preg_replace('/\D/', '', $input['phone']);
$email             = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$gender            = htmlspecialchars(trim($input['gender']));
$sport             = htmlspecialchars(trim($input['sport']));
$player_names_raw  = $input['player_names'] ?? '[]';
$player_names      = json_encode(json_decode($player_names_raw, true) ?: []);
$emergency_contact = !empty($input['emergency_contact']) ? htmlspecialchars(trim($input['emergency_contact'])) : null;
$address           = htmlspecialchars(trim($input['address']));

$SPORT_FEES = [
    '100meter' => 0, '200meter' => 0, '400meter' => 0, '800meter' => 0, 'relay400' => 0,
    'volleyball' => 1000, 'kabbadi' => 1000, 'badminton' => 1000, 'tugofwar' => 1000,
    'longjump' => 0, 'shotput' => 0, 'discthrow' => 0,
    'chess' => 400, 'carrom' => 400,
];

if (!$email)                                         sendJSON(false, 'Invalid email address');
if (strlen($phone) < 10)                             sendJSON(false, 'Invalid phone number');
if (!in_array($gender, ['male', 'female', 'other'])) sendJSON(false, 'Invalid gender');
if (!array_key_exists($sport, $SPORT_FEES))          sendJSON(false, 'Invalid sport selected');

$amount = $SPORT_FEES[$sport];
$initial_status = $amount === 0 ? 'paid' : 'pending';

$conn = getDBConnection();
if (!$conn) sendJSON(false, 'DB connection failed');

$stmt = $conn->prepare("SELECT id FROM sports_registrations WHERE email = ? AND sport = ?");
$stmt->execute([$email, $sport]);
if ($stmt->fetch()) sendJSON(false, "This email is already registered for $sport");

$stmt = $conn->prepare(
    "INSERT INTO sports_registrations
     (college_name, email, phone, gender, sport, player_names, emergency_contact, address, amount, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

if ($stmt->execute([$college_name, $email, $phone, $gender, $sport, $player_names, $emergency_contact, $address, $amount, $initial_status])) {
    $ref_id = (int)$conn->lastInsertId();

    // Free sports — assign registration number + send email immediately
    if ($amount === 0) {
        $reg_number = generateRegistrationNumber($sport, $ref_id);
        $conn->prepare("UPDATE sports_registrations SET registration_number=? WHERE id=?")
             ->execute([$reg_number, $ref_id]);

        sendRegistrationEmail($email, $college_name, [
            'type'                => 'sport',
            'registration_number' => $reg_number,
            'payment_id'          => '',
            'amount'              => 0,
            'college'             => $college_name,
            'sport_label'         => getSportLabel($sport),
            'players_html'        => buildPlayersHtml($player_names),
        ]);

        sendJSON(true, 'Registration details saved.', [
            'ref_id'              => $ref_id,
            'amount'              => $amount,
            'sport'               => $sport,
            'registration_number' => $reg_number,
        ]);
    }

    sendJSON(true, 'Registration details saved.', ['ref_id' => $ref_id, 'amount' => $amount, 'sport' => $sport]);
} else {
    sendJSON(false, 'Registration failed — please try again');
}
?>
