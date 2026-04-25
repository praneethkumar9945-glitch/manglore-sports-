<?php
require_once __DIR__ . '/db_config.php';

function sendRegistrationEmail(string $to_email, string $to_name, array $data): bool {
    $resend_key = getenv('RESEND_API_KEY');
    if (empty($resend_key)) {
        error_log("Resend API key not set");
        return false;
    }

    $type               = $data['type']                ?? 'sport';         // bgmi | marathon | sport
    $registration_number = $data['registration_number'] ?? '';
    $payment_id         = $data['payment_id']           ?? '';
    $amount             = (int)($data['amount']         ?? 0);
    $event_date         = $data['event_date']           ?? 'May 3, 2026';

    // Type-specific fields
    $sport_label        = $data['sport_label']          ?? '';
    $college            = $data['college']              ?? '';
    $category_label     = $data['category_label']       ?? '';
    $squad_name         = $data['squad_name']           ?? '';
    $players_html       = $data['players_html']         ?? '';

    // Build type-specific details block
    if ($type === 'bgmi') {
        $event_name   = 'BGMI Championship';
        $event_color  = '#f59e0b';
        $amount_label = '₹' . number_format($amount);
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Squad Name</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$squad_name</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>May 3, 2026</td></tr>
            $players_html
        ";
    } elseif ($type === 'marathon') {
        $event_name   = 'Nama Kudla Marathon';
        $event_color  = '#dc2626';
        $amount_label = '₹' . number_format($amount);
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Name</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$to_name</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Category</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$category_label</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>May 3, 2026</td></tr>
        ";
    } else {
        $event_name   = $sport_label . ' — Inter-College Sports';
        $event_color  = '#dc2626';
        $amount_label = $amount === 0 ? 'Free Entry' : '₹' . number_format($amount);
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Sport</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>$sport_label</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;'>May 3, 2026</td></tr>
            $players_html
        ";
    }

    $payment_row = $amount > 0
        ? "<tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Payment ID</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;font-family:monospace;'>$payment_id</td></tr>"
        : '';

    $amount_display = $amount === 0 ? 'Free Entry' : '₹' . number_format($amount);

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#991b1b);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Mangalore Inter-College</p>
              <h1 style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Sports &amp; Games Championship</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);font-weight:500;">2026</p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:32px 0 24px;">
                    <div style="display:inline-block;background:#052e16;border:1.5px solid #16a34a;border-radius:50px;padding:10px 24px;">
                      <span style="color:#4ade80;font-size:13px;font-weight:700;letter-spacing:1px;">✓ &nbsp;REGISTRATION CONFIRMED</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px 28px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Hey $to_name! 👋</h2>
              <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.6;">
                You're officially registered for <strong style="color:#ffffff;">$event_name</strong>.<br/>
                Get ready to compete, win, and create memories!
              </p>
            </td>
          </tr>

          <!-- Registration Number Card -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1e1e,#2a1515);border:1.5px solid $event_color;border-radius:12px;padding:24px;">
                <tr>
                  <td align="center" style="padding:24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;">Your Registration Number</p>
                    <p style="margin:0;font-size:32px;font-weight:900;color:$event_color;letter-spacing:2px;font-family:monospace;">$registration_number</p>
                    <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Keep this for event check-in</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Details Table -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px 28px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Registration Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #2d2d2d;">
                $details_rows
                <tr style="border-top:1px solid #2d2d2d;">
                  <td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount Paid</td>
                  <td style="padding:8px 0;font-weight:700;font-size:15px;text-align:right;color:#4ade80;">$amount_display</td>
                </tr>
                $payment_row
              </table>
            </td>
          </tr>

          <!-- What to Bring -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#f59e0b;">📋 &nbsp;What to Bring</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✅ &nbsp;Valid College ID Card</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✅ &nbsp;Authorization letter from college</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#d1d5db;">✅ &nbsp;Aadhaar Card (original or copy)</p>
                    <p style="margin:0;font-size:14px;color:#d1d5db;">✅ &nbsp;Passport size photograph</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Venue & Contact -->
          <tr>
            <td style="background:#1a1a1a;padding:0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right:8px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;">
                      <tr>
                        <td style="padding:18px;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;color:#9ca3af;text-transform:uppercase;">📍 Venue</p>
                          <p style="margin:0;font-size:13px;color:#e5e7eb;line-height:1.5;">6th Floor, Paradigm Plaza,<br/>Pandeshwar, Mangalore</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left:8px;vertical-align:top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;">
                      <tr>
                        <td style="padding:18px;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;color:#9ca3af;text-transform:uppercase;">📞 Contact</p>
                          <p style="margin:0;font-size:13px;color:#e5e7eb;line-height:1.5;">+91 7618783300<br/>enquiry@ssccmangalore.co.in</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111111;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;border-top:1px solid #2d2d2d;">
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#ffffff;">Mangalore Inter-College Sports &amp; Games Championship</p>
              <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">Speed · Strength · Spirit · 2026</p>
              <p style="margin:0;font-size:12px;color:#4b5563;">This is an automated confirmation email. Please do not reply.<br/>For queries contact enquiry@ssccmangalore.co.in</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
HTML;

    // Plain text fallback
    $text = "Registration Confirmed!\n\n"
          . "Hi $to_name,\n\n"
          . "You are registered for $event_name.\n\n"
          . "Registration Number: $registration_number\n"
          . "Amount Paid: $amount_display\n"
          . ($payment_id ? "Payment ID: $payment_id\n" : '')
          . "\nVenue: 6th Floor, Paradigm Plaza, Pandeshwar, Mangalore\n"
          . "Contact: +91 7618783300 | enquiry@ssccmangalore.co.in\n\n"
          . "Mangalore Inter-College Sports & Games Championship 2026\n";

    $payload = [
        'from'    => 'Mangalore Sports 2026 <onboarding@resend.dev>', // Change to noreply@ssccmangalore.co.in after verifying domain in resend.com/domains
        'to'      => [$to_email],
        'subject' => "✅ Registration Confirmed — $registration_number | $event_name",
        'html'    => $html,
        'text'    => $text,
    ];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $resend_key,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 15,
    ]);

    $response  = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err  = curl_error($ch);
    @curl_close($ch);

    if ($curl_err) {
        error_log("Resend cURL error: $curl_err");
        return false;
    }

    if ($http_code !== 200 && $http_code !== 201) {
        error_log("Resend API error (HTTP $http_code): $response");
        return false;
    }

    return true;
}

// --- Helpers ---

function generateRegistrationNumber(string $prefix, int $id): string {
    return $prefix . '-2026-' . str_pad($id, 4, '0', STR_PAD_LEFT);
}

function getSportLabel(string $sport): string {
    $map = [
        '100meter' => '100 Meter', '200meter' => '200 Meter',
        '400meter' => '400 Meter', '800meter' => '800 Meter',
        'relay400' => 'Relay 400', 'volleyball' => 'Volleyball',
        'kabbadi'  => 'Kabbadi',   'badminton'  => 'Badminton',
        'tugofwar' => 'Tug of War', 'longjump'  => 'Long Jump',
        'shotput'  => 'Shot Put',  'discthrow'  => 'Disc Throw',
        'chess'    => 'Chess',     'carrom'     => 'Carrom',
    ];
    return $map[$sport] ?? ucfirst($sport);
}

function getCategoryLabel(string $cat): string {
    $map = [
        'mb40' => 'Men - Below 40', 'ma40' => 'Men - Above 40',
        'wb40' => 'Women - Below 40', 'wa40' => 'Women - Above 40',
    ];
    return $map[$cat] ?? $cat;
}

function buildPlayersHtml(string $player_names_json): string {
    $players = json_decode($player_names_json, true);
    if (!is_array($players) || empty($players)) return '';
    $html = "<tr><td colspan='2' style='padding:8px 0;'><p style='margin:0 0 6px;font-size:13px;font-weight:700;color:#9ca3af;'>Players</p>";
    foreach ($players as $i => $name) {
        $html .= "<p style='margin:0 0 4px;font-size:14px;color:#e5e7eb;'>" . ($i + 1) . ". $name</p>";
    }
    $html .= "</td></tr>";
    return $html;
}
?>
