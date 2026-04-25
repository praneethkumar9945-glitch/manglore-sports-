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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) $input = $_POST;

$order_id   = isset($input['razorpay_order_id'])   ? trim($input['razorpay_order_id'])   : '';
$payment_id = isset($input['razorpay_payment_id']) ? trim($input['razorpay_payment_id']) : '';
$signature  = isset($input['razorpay_signature'])  ? trim($input['razorpay_signature'])  : '';
$type       = isset($input['type'])                ? trim($input['type'])                : '';
$ref_id     = isset($input['ref_id'])              ? (int)$input['ref_id']              : 0;

if (empty($order_id) || empty($payment_id) || empty($signature) || empty($type) || $ref_id <= 0) {
    sendJSON(false, 'Missing payment verification parameters');
}

$key_secret = getenv('RAZORPAY_KEY_SECRET');
if (empty($key_secret)) sendJSON(false, 'Payment gateway not configured');

// HMAC-SHA256 signature verification
$expected = hash_hmac('sha256', $order_id . '|' . $payment_id, $key_secret);
if (!hash_equals($expected, $signature)) {
    error_log("Razorpay signature mismatch. order_id=$order_id payment_id=$payment_id");
    sendJSON(false, 'Payment verification failed — invalid signature');
}

$conn = getDBConnection();
if (!$conn) sendJSON(false, 'DB connection failed');

// --- Mark paid + assign registration number + fetch row for email ---
if ($type === 'bgmi') {
    $reg_number = generateRegistrationNumber('BGMI', $ref_id);
    $stmt = $conn->prepare(
        "UPDATE bgmi_registrations
         SET payment_status='paid', razorpay_payment_id=?, registration_number=?
         WHERE id=? AND razorpay_order_id=?"
    );
    $stmt->execute([$payment_id, $reg_number, $ref_id, $order_id]);

    if ($stmt->rowCount() === 0) {
        error_log("verify_payment: no row updated. type=$type ref_id=$ref_id");
        sendJSON(false, 'Could not update payment record');
    }

    $row = $conn->prepare("SELECT * FROM bgmi_registrations WHERE id=?");
    $row->execute([$ref_id]);
    $reg = $row->fetch(PDO::FETCH_ASSOC);

    $team = json_decode($reg['teamMembers'] ?? '[]', true);
    $players_html = '';
    if (is_array($team)) {
        $players_html = "<tr><td colspan='2' style='padding:8px 0;'><p style='margin:0 0 6px;font-size:13px;font-weight:700;color:#9ca3af;'>Squad Members</p>";
        foreach ($team as $p) {
            $ign  = htmlspecialchars($p['ign']    ?? '');
            $bid  = htmlspecialchars($p['bgmiId'] ?? '');
            $lead = !empty($p['isLeader']) ? ' (Leader)' : '';
            $players_html .= "<p style='margin:0 0 4px;font-size:14px;color:#e5e7eb;'>$ign — ID: $bid$lead</p>";
        }
        $players_html .= "</td></tr>";
    }

    sendRegistrationEmail($reg['email'], $reg['leaderName'], [
        'type'                => 'bgmi',
        'registration_number' => $reg_number,
        'payment_id'          => $payment_id,
        'amount'              => $reg['amount'],
        'squad_name'          => $reg['squadName'],
        'college'             => $reg['collegeName'],
        'players_html'        => $players_html,
    ]);

} elseif ($type === 'marathon') {
    $reg_number = generateRegistrationNumber('MAR', $ref_id);
    $stmt = $conn->prepare(
        "UPDATE marathon_registrations
         SET payment_status='paid', razorpay_payment_id=?, registration_number=?
         WHERE id=? AND razorpay_order_id=?"
    );
    $stmt->execute([$payment_id, $reg_number, $ref_id, $order_id]);

    if ($stmt->rowCount() === 0) {
        error_log("verify_payment: no row updated. type=$type ref_id=$ref_id");
        sendJSON(false, 'Could not update payment record');
    }

    $row = $conn->prepare("SELECT * FROM marathon_registrations WHERE id=?");
    $row->execute([$ref_id]);
    $reg = $row->fetch(PDO::FETCH_ASSOC);

    sendRegistrationEmail($reg['email'], $reg['full_name'], [
        'type'                => 'marathon',
        'registration_number' => $reg_number,
        'payment_id'          => $payment_id,
        'amount'              => $reg['amount'],
        'college'             => $reg['college_name'],
        'category_label'      => getCategoryLabel($reg['category']),
    ]);

} elseif ($type === 'sport') {
    $reg_number = generateRegistrationNumber('SPT', $ref_id);
    $stmt = $conn->prepare(
        "UPDATE sports_registrations
         SET payment_status='paid', razorpay_payment_id=?, registration_number=?
         WHERE id=? AND razorpay_order_id=?"
    );
    $stmt->execute([$payment_id, $reg_number, $ref_id, $order_id]);

    if ($stmt->rowCount() === 0) {
        error_log("verify_payment: no row updated. type=$type ref_id=$ref_id");
        sendJSON(false, 'Could not update payment record');
    }

    $row = $conn->prepare("SELECT * FROM sports_registrations WHERE id=?");
    $row->execute([$ref_id]);
    $reg = $row->fetch(PDO::FETCH_ASSOC);

    sendRegistrationEmail($reg['email'], $reg['college_name'], [
        'type'                => 'sport',
        'registration_number' => $reg_number,
        'payment_id'          => $payment_id,
        'amount'              => $reg['amount'],
        'college'             => $reg['college_name'],
        'sport_label'         => getSportLabel($reg['sport']),
        'players_html'        => buildPlayersHtml($reg['player_names'] ?? '[]'),
    ]);

} else {
    sendJSON(false, 'Invalid type');
}

sendJSON(true, 'Payment verified successfully', [
    'payment_id'          => $payment_id,
    'order_id'            => $order_id,
    'registration_number' => $reg_number,
]);
?>
