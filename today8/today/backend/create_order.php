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

// TODO: Install Razorpay PHP SDK
// cd backend && composer require razorpay/razorpay
// require 'vendor/autoload.php';

function sendJSONResponse($success, $message, $data = null) {
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

$input = $_POST;

if (empty($input['sport'])) {
    sendJSONResponse(false, 'Missing sport');
}

$sport = htmlspecialchars(trim($input['sport']));

// SPORT_FEES map (from frontend SPORT_CONFIG)
$SPORT_FEES = [
    '100meter' => 0, '200meter' => 0, '400meter' => 0, '800meter' => 0, 'relay400' => 0,
    'volleyball' => 1000, 'kabbadi' => 1000, 'badminton' => 1000, 'tugofwar' => 1000,
    'longjump' => 0, 'shotput' => 0, 'discthrow' => 0,
    'chess' => 400, 'carrom' => 400
];

$amount = $SPORT_FEES[$sport] ?? 0;
$amount_cents = $amount * 100; // Razorpay uses paise

if ($amount == 0) {
    sendJSONResponse(true, 'Free entry - no payment needed', ['amount' => 0]);
}

// STUB: Replace with real Razorpay
// $api_key = 'YOUR_KEY_ID';
// $secret = 'YOUR_SECRET';
// $razorpay = new Razorpay\Api\Api($api_key, $secret);
// $order = $razorpay->order->create([
//     'receipt' => 'sport_' . uniqid(),
//     'amount' => $amount_cents,
//     'currency' => 'INR'
// ]);

// For now - mock response
$data = [
    'id' => 'order_' . uniqid(),
    'amount' => $amount_cents,
    'currency' => 'INR',
    'status' => 'created'
];

sendJSONResponse(true, 'Order created', $data);
?>

