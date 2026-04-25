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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$order_id   = isset($input['razorpay_order_id'])   ? trim($input['razorpay_order_id'])   : '';
$payment_id = isset($input['razorpay_payment_id']) ? trim($input['razorpay_payment_id']) : '';
$signature  = isset($input['razorpay_signature'])  ? trim($input['razorpay_signature'])  : '';
$type       = isset($input['type'])                ? trim($input['type'])                : '';
$ref_id     = isset($input['ref_id'])              ? (int)$input['ref_id']              : 0;

if (empty($order_id) || empty($payment_id) || empty($signature) || empty($type) || $ref_id <= 0) {
    sendJSON(false, 'Missing payment verification parameters');
}

$key_secret = getenv('RAZORPAY_KEY_SECRET');
if (empty($key_secret)) {
    sendJSON(false, 'Payment gateway not configured');
}

// --- HMAC-SHA256 signature verification ---
// Razorpay signs: order_id + "|" + payment_id  with your key_secret
$expected_signature = hash_hmac('sha256', $order_id . '|' . $payment_id, $key_secret);

if (!hash_equals($expected_signature, $signature)) {
    error_log("Razorpay signature mismatch. order_id=$order_id payment_id=$payment_id");
    sendJSON(false, 'Payment verification failed — invalid signature');
}

// Signature is valid — mark as paid in DB
$conn = getDBConnection();
if (!$conn) {
    sendJSON(false, 'DB connection failed');
}

if ($type === 'bgmi') {
    $stmt = $conn->prepare(
        "UPDATE bgmi_registrations
         SET payment_status='paid', razorpay_payment_id=?
         WHERE id=? AND razorpay_order_id=?"
    );
} elseif ($type === 'marathon') {
    $stmt = $conn->prepare(
        "UPDATE marathon_registrations
         SET payment_status='paid', razorpay_payment_id=?
         WHERE id=? AND razorpay_order_id=?"
    );
} elseif ($type === 'sport') {
    $stmt = $conn->prepare(
        "UPDATE sports_registrations
         SET payment_status='paid', razorpay_payment_id=?
         WHERE id=? AND razorpay_order_id=?"
    );
} else {
    sendJSON(false, 'Invalid type');
}

$stmt->execute([$payment_id, $ref_id, $order_id]);

if ($stmt->rowCount() === 0) {
    error_log("verify_payment: no row updated. type=$type ref_id=$ref_id order_id=$order_id");
    sendJSON(false, 'Could not update payment record — order ID mismatch');
}

sendJSON(true, 'Payment verified successfully', [
    'payment_id' => $payment_id,
    'order_id'   => $order_id,
]);
?>
