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

$type   = isset($input['type'])   ? trim($input['type'])   : '';   // bgmi | marathon | sport
$ref_id = isset($input['ref_id']) ? (int)$input['ref_id']  : 0;    // DB row id returned after registration

if (empty($type) || $ref_id <= 0) {
    sendJSON(false, 'Missing type or ref_id');
}

$SPORT_FEES = [
    '100meter' => 0, '200meter' => 0, '400meter' => 0, '800meter' => 0, 'relay400' => 0,
    'volleyball' => 1000, 'kabbadi' => 1000, 'badminton' => 1000, 'tugofwar' => 1000,
    'longjump' => 0, 'shotput' => 0, 'discthrow' => 0,
    'chess' => 400, 'carrom' => 400,
];

$conn = getDBConnection();
if (!$conn) {
    sendJSON(false, 'DB connection failed');
}

// Determine amount from DB record (single source of truth)
if ($type === 'bgmi') {
    $stmt = $conn->prepare("SELECT amount, payment_status FROM bgmi_registrations WHERE id = ?");
    $stmt->execute([$ref_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendJSON(false, 'Registration not found');
    $amount = (int)$row['amount'];
    $receipt_prefix = 'bgmi';
} elseif ($type === 'marathon') {
    $stmt = $conn->prepare("SELECT amount, payment_status FROM marathon_registrations WHERE id = ?");
    $stmt->execute([$ref_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendJSON(false, 'Registration not found');
    $amount = (int)$row['amount'];
    $receipt_prefix = 'marathon';
} elseif ($type === 'sport') {
    $sport_key = isset($input['sport']) ? trim($input['sport']) : '';
    $stmt = $conn->prepare("SELECT amount, payment_status, sport FROM sports_registrations WHERE id = ?");
    $stmt->execute([$ref_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) sendJSON(false, 'Registration not found');
    $amount = (int)$row['amount'];
    $receipt_prefix = 'sport';
} else {
    sendJSON(false, 'Invalid type');
}

// Already paid — do not create duplicate order
if (isset($row['payment_status']) && $row['payment_status'] === 'paid') {
    sendJSON(false, 'Already paid');
}

// Free entry — no payment needed
if ($amount === 0) {
    // Mark as paid immediately in DB
    if ($type === 'bgmi') {
        $conn->prepare("UPDATE bgmi_registrations SET payment_status='paid' WHERE id=?")->execute([$ref_id]);
    } elseif ($type === 'marathon') {
        $conn->prepare("UPDATE marathon_registrations SET payment_status='paid' WHERE id=?")->execute([$ref_id]);
    } elseif ($type === 'sport') {
        $conn->prepare("UPDATE sports_registrations SET payment_status='paid' WHERE id=?")->execute([$ref_id]);
    }
    sendJSON(true, 'Free entry — registered successfully', ['amount' => 0, 'free' => true]);
}

// --- Razorpay order creation ---
$key_id     = getenv('RAZORPAY_KEY_ID');
$key_secret = getenv('RAZORPAY_KEY_SECRET');

if (empty($key_id) || empty($key_secret)) {
    sendJSON(false, 'Payment gateway not configured');
}

$amount_paise = $amount * 100; // Razorpay uses paise
$receipt      = $receipt_prefix . '_' . $ref_id . '_' . time();

$order_data = [
    'amount'   => $amount_paise,
    'currency' => 'INR',
    'receipt'  => $receipt,
    'notes'    => ['ref_id' => $ref_id, 'type' => $type],
];

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($order_data),
    CURLOPT_USERPWD        => "$key_id:$key_secret",
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 30,
]);

$response   = curl_exec($ch);
$http_code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    error_log("Razorpay cURL error: $curl_error");
    sendJSON(false, 'Payment gateway connection failed');
}

$order = json_decode($response, true);

if ($http_code !== 200 || empty($order['id'])) {
    error_log("Razorpay order error (HTTP $http_code): $response");
    sendJSON(false, 'Failed to create payment order');
}

// Store order_id in DB so we can verify later
if ($type === 'bgmi') {
    $conn->prepare("UPDATE bgmi_registrations SET razorpay_order_id=? WHERE id=?")
         ->execute([$order['id'], $ref_id]);
} elseif ($type === 'marathon') {
    $conn->prepare("UPDATE marathon_registrations SET razorpay_order_id=? WHERE id=?")
         ->execute([$order['id'], $ref_id]);
} elseif ($type === 'sport') {
    $conn->prepare("UPDATE sports_registrations SET razorpay_order_id=? WHERE id=?")
         ->execute([$order['id'], $ref_id]);
}

sendJSON(true, 'Order created', [
    'order_id' => $order['id'],
    'amount'   => $amount_paise,
    'currency' => 'INR',
    'key_id'   => $key_id,
    'ref_id'   => $ref_id,
    'type'     => $type,
]);
?>
