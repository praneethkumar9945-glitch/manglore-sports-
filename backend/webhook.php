<?php
// Razorpay Webhook Handler
// Register this URL in Razorpay Dashboard → Settings → Webhooks
// Events to subscribe: payment.captured, payment.failed, refund.created

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';

function sendJSON(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJSON(405, 'Method not allowed');
}

$raw_body = file_get_contents('php://input');
if (empty($raw_body)) {
    sendJSON(400, 'Empty body');
}

// --- Verify Razorpay webhook signature ---
$webhook_secret   = getenv('WEBHOOK_SECRET');
$received_sig     = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

if (empty($webhook_secret) || empty($received_sig)) {
    error_log("Webhook: missing secret or signature header");
    sendJSON(400, 'Missing signature');
}

$expected_sig = hash_hmac('sha256', $raw_body, $webhook_secret);

if (!hash_equals($expected_sig, $received_sig)) {
    error_log("Webhook: signature mismatch");
    sendJSON(400, 'Invalid signature');
}

// --- Parse event ---
$event = json_decode($raw_body, true);
if (!$event || empty($event['event'])) {
    sendJSON(400, 'Invalid payload');
}

$conn = getDBConnection();
if (!$conn) {
    sendJSON(500, 'DB error');
}

$event_name = $event['event'];

if ($event_name === 'payment.captured') {
    $payment    = $event['payload']['payment']['entity'] ?? [];
    $order_id   = $payment['order_id']  ?? '';
    $payment_id = $payment['id']        ?? '';
    $amount     = (int)($payment['amount'] ?? 0); // paise

    if (empty($order_id) || empty($payment_id)) {
        sendJSON(400, 'Missing payment entity fields');
    }

    // Update whichever table has this order_id
    $updated = false;

    foreach (['bgmi_registrations', 'marathon_registrations', 'sports_registrations'] as $table) {
        $stmt = $conn->prepare(
            "UPDATE `$table`
             SET payment_status='paid', razorpay_payment_id=?
             WHERE razorpay_order_id=? AND payment_status != 'paid'"
        );
        $stmt->execute([$payment_id, $order_id]);
        if ($stmt->rowCount() > 0) {
            $updated = true;
            error_log("Webhook payment.captured: updated $table for order $order_id");
            break;
        }
    }

    if (!$updated) {
        error_log("Webhook payment.captured: no row found for order_id=$order_id (may already be paid)");
    }

    sendJSON(200, 'OK');
}

if ($event_name === 'payment.failed') {
    $payment  = $event['payload']['payment']['entity'] ?? [];
    $order_id = $payment['order_id'] ?? '';

    if (!empty($order_id)) {
        foreach (['bgmi_registrations', 'marathon_registrations', 'sports_registrations'] as $table) {
            $stmt = $conn->prepare(
                "UPDATE `$table` SET payment_status='failed'
                 WHERE razorpay_order_id=? AND payment_status='pending'"
            );
            $stmt->execute([$order_id]);
            if ($stmt->rowCount() > 0) {
                error_log("Webhook payment.failed: marked failed in $table for order $order_id");
                break;
            }
        }
    }

    sendJSON(200, 'OK');
}

if ($event_name === 'refund.created') {
    $refund   = $event['payload']['refund']['entity'] ?? [];
    $order_id = $refund['notes']['order_id'] ?? ($refund['receipt'] ?? '');
    $payment_id = $refund['payment_id'] ?? '';

    if (!empty($payment_id)) {
        foreach (['bgmi_registrations', 'marathon_registrations', 'sports_registrations'] as $table) {
            $stmt = $conn->prepare(
                "UPDATE `$table` SET payment_status='refunded'
                 WHERE razorpay_payment_id=?"
            );
            $stmt->execute([$payment_id]);
            if ($stmt->rowCount() > 0) {
                error_log("Webhook refund.created: marked refunded in $table for payment $payment_id");
                break;
            }
        }
    }

    sendJSON(200, 'OK');
}

// Unknown event — acknowledge anyway so Razorpay doesn't retry
sendJSON(200, 'Event ignored');
?>
