<?php
// Razorpay Webhook Handler
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/email_helper.php';

function sendJSON(int $code, string $message): void {
    http_response_code($code);
    echo json_encode(['message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') sendJSON(405, 'Method not allowed');

$raw_body = file_get_contents('php://input');
if (empty($raw_body)) sendJSON(400, 'Empty body');

$webhook_secret = getenv('WEBHOOK_SECRET');
$received_sig   = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

if (empty($webhook_secret) || empty($received_sig)) sendJSON(400, 'Missing signature');

$expected_sig = hash_hmac('sha256', $raw_body, $webhook_secret);
if (!hash_equals($expected_sig, $received_sig)) {
    error_log("Webhook: signature mismatch");
    sendJSON(400, 'Invalid signature');
}

$event = json_decode($raw_body, true);
if (!$event || empty($event['event'])) sendJSON(400, 'Invalid payload');

$conn = getDBConnection();
if (!$conn) sendJSON(500, 'DB error');

$event_name = $event['event'];

if ($event_name === 'payment.captured') {
    $payment    = $event['payload']['payment']['entity'] ?? [];
    $order_id   = $payment['order_id'] ?? '';
    $payment_id = $payment['id']       ?? '';

    if (empty($order_id) || empty($payment_id)) sendJSON(400, 'Missing payment entity fields');

    $tables = [
        'bgmi'     => 'bgmi_registrations',
        'marathon' => 'marathon_registrations',
        'sport'    => 'sports_registrations',
    ];

    foreach ($tables as $type => $table) {
        // Only update if not already paid (verify_payment.php may have already done it)
        $check = $conn->prepare("SELECT * FROM `$table` WHERE razorpay_order_id=? AND payment_status!='paid'");
        $check->execute([$order_id]);
        $reg = $check->fetch(PDO::FETCH_ASSOC);

        if (!$reg) continue;

        $ref_id = (int)$reg['id'];

        // Only assign registration number if not already set
        $reg_number = $reg['registration_number'];
        if (empty($reg_number)) {
            $sport_key  = $type === 'bgmi' ? 'bgmi' : ($type === 'marathon' ? 'marathon' : ($reg['sport'] ?? 'sport'));
            $reg_number = generateRegistrationNumber($sport_key, $ref_id);
        }

        $upd = $conn->prepare(
            "UPDATE `$table` SET payment_status='paid', razorpay_payment_id=?, registration_number=?
             WHERE id=?"
        );
        $upd->execute([$payment_id, $reg_number, $ref_id]);

        error_log("Webhook payment.captured: updated $table id=$ref_id reg=$reg_number");

        // Send email
        if ($type === 'bgmi') {
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
                'type' => 'bgmi', 'registration_number' => $reg_number,
                'payment_id' => $payment_id, 'amount' => $reg['amount'],
                'squad_name' => $reg['squadName'], 'college' => $reg['collegeName'],
                'players_html' => $players_html,
            ]);
        } elseif ($type === 'marathon') {
            sendRegistrationEmail($reg['email'], $reg['full_name'], [
                'type' => 'marathon', 'registration_number' => $reg_number,
                'payment_id' => $payment_id, 'amount' => $reg['amount'],
                'college' => $reg['college_name'], 'category_label' => getCategoryLabel($reg['category']),
            ]);
        } else {
            sendRegistrationEmail($reg['email'], $reg['college_name'], [
                'type' => 'sport', 'registration_number' => $reg_number,
                'payment_id' => $payment_id, 'amount' => $reg['amount'],
                'college' => $reg['college_name'], 'sport_label' => getSportLabel($reg['sport']),
                'players_html' => buildPlayersHtml($reg['player_names'] ?? '[]'),
            ]);
        }

        break;
    }

    sendJSON(200, 'OK');
}

if ($event_name === 'payment.failed') {
    $order_id = $event['payload']['payment']['entity']['order_id'] ?? '';
    if ($order_id) {
        foreach (['bgmi_registrations', 'marathon_registrations', 'sports_registrations'] as $table) {
            $s = $conn->prepare("UPDATE `$table` SET payment_status='failed' WHERE razorpay_order_id=? AND payment_status='pending'");
            $s->execute([$order_id]);
            if ($s->rowCount() > 0) break;
        }
    }
    sendJSON(200, 'OK');
}

if ($event_name === 'refund.created') {
    $payment_id = $event['payload']['refund']['entity']['payment_id'] ?? '';
    if ($payment_id) {
        foreach (['bgmi_registrations', 'marathon_registrations', 'sports_registrations'] as $table) {
            $s = $conn->prepare("UPDATE `$table` SET payment_status='refunded' WHERE razorpay_payment_id=?");
            $s->execute([$payment_id]);
            if ($s->rowCount() > 0) break;
        }
    }
    sendJSON(200, 'OK');
}

sendJSON(200, 'Event ignored');
?>
