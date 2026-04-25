<?php
require_once __DIR__ . '/db_config.php';

// Sport prefix map — matches the document spec exactly
function getRegPrefix(string $sport): string {
    $map = [
        '100meter'   => 'INR1',
        '200meter'   => 'INR2',
        '400meter'   => 'INR4',
        '800meter'   => 'INR8',
        'relay400'   => 'INR4', // relay uses 400m prefix
        'volleyball' => 'TMV',
        'badminton'  => 'TMB',
        'kabbadi'    => 'TMK',
        'tugofwar'   => 'TMT',
        'discthrow'  => 'IND',
        'shotput'    => 'INS',
        'longjump'   => 'INL',
        'chess'      => 'ICH',
        'carrom'     => 'ICA',
        'bgmi'       => 'BGM',
        'marathon'   => 'NKM',
    ];
    return $map[$sport] ?? 'REG';
}

// Generate next unique registration number for a sport
// Format: PREFIX + 3-digit sequence (e.g. TMV001, TMV002...)
function generateRegistrationNumber(string $sport_or_type, int $id): string {
    $conn = getDBConnection();
    $prefix = getRegPrefix($sport_or_type);

    if (!$conn) {
        // Fallback: use id padded
        return $prefix . str_pad($id, 3, '0', STR_PAD_LEFT);
    }

    // Count how many registrations exist for this sport to get sequence number
    if ($sport_or_type === 'bgmi') {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM bgmi_registrations WHERE registration_number LIKE ?");
        $stmt->execute([$prefix . '%']);
    } elseif ($sport_or_type === 'marathon') {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM marathon_registrations WHERE registration_number LIKE ?");
        $stmt->execute([$prefix . '%']);
    } else {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM sports_registrations WHERE sport=? AND registration_number IS NOT NULL");
        $stmt->execute([$sport_or_type]);
    }

    $count = (int)$stmt->fetchColumn();
    $seq   = $count + 1; // next number in sequence

    $reg_number = $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);

    // Uniqueness safety: if collision (shouldn't happen), keep incrementing
    $max_tries = 100;
    $try = 0;
    while ($try < $max_tries) {
        $exists = false;
        if ($sport_or_type === 'bgmi') {
            $chk = $conn->prepare("SELECT id FROM bgmi_registrations WHERE registration_number=?");
        } elseif ($sport_or_type === 'marathon') {
            $chk = $conn->prepare("SELECT id FROM marathon_registrations WHERE registration_number=?");
        } else {
            $chk = $conn->prepare("SELECT id FROM sports_registrations WHERE registration_number=?");
        }
        $chk->execute([$reg_number]);
        if ($chk->fetch()) {
            $seq++;
            $reg_number = $prefix . str_pad($seq, 3, '0', STR_PAD_LEFT);
            $try++;
        } else {
            break;
        }
    }

    return $reg_number;
}

function getSportLabel(string $sport): string {
    $map = [
        '100meter'   => '100 Meter',
        '200meter'   => '200 Meter',
        '400meter'   => '400 Meter',
        '800meter'   => '800 Meter',
        'relay400'   => 'Relay 400',
        'volleyball' => 'Volleyball',
        'badminton'  => 'Badminton',
        'kabbadi'    => 'Kabaddi',
        'tugofwar'   => 'Tug of War',
        'discthrow'  => 'Disc Throw',
        'shotput'    => 'Shot Put',
        'longjump'   => 'Long Jump',
        'chess'      => 'Chess',
        'carrom'     => 'Carrom',
    ];
    return $map[$sport] ?? ucfirst($sport);
}

function getCategoryLabel(string $cat): string {
    $map = [
        'mb40' => 'Men - Below 40',
        'ma40' => 'Men - Above 40',
        'wb40' => 'Women - Below 40',
        'wa40' => 'Women - Above 40',
    ];
    return $map[$cat] ?? $cat;
}

function buildPlayersHtml(string $player_names_json): string {
    $players = json_decode($player_names_json, true);
    if (!is_array($players) || empty($players)) return '';
    $html = "<tr><td colspan='2' style='padding:12px 0 4px;'>"
          . "<p style='margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6b7280;border-top:1px solid #2d2d2d;padding-top:12px;'>Participants</p>";
    foreach ($players as $i => $name) {
        $html .= "<p style='margin:0 0 4px;font-size:14px;color:#e5e7eb;'>" . ($i + 1) . ".&nbsp;&nbsp;" . htmlspecialchars($name) . "</p>";
    }
    $html .= "</td></tr>";
    return $html;
}

function sendRegistrationEmail(string $to_email, string $to_name, array $data): bool {
    $resend_key = getenv('RESEND_API_KEY');
    if (empty($resend_key)) {
        error_log("Resend API key not set");
        return false;
    }

    $type                = $data['type']                ?? 'sport';
    $registration_number = $data['registration_number'] ?? '';
    $payment_id          = $data['payment_id']          ?? '';
    $amount              = (int)($data['amount']        ?? 0);
    $sport_label         = $data['sport_label']         ?? '';
    $college             = $data['college']             ?? '';
    $category_label      = $data['category_label']      ?? '';
    $squad_name          = $data['squad_name']          ?? '';
    $players_html        = $data['players_html']        ?? '';

    if ($type === 'bgmi') {
        $event_name  = 'BGMI Championship';
        $event_color = '#f59e0b';
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Squad Name</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$squad_name</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>May 3, 2026</td></tr>
            $players_html
        ";
    } elseif ($type === 'marathon') {
        $event_name  = 'Nama Kudla Marathon';
        $event_color = '#dc2626';
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Name</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$to_name</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Category</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$category_label</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>May 3, 2026</td></tr>
        ";
    } else {
        $event_name  = $sport_label . ' — Inter-College Sports';
        $event_color = '#dc2626';
        $details_rows = "
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>College</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$college</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Sport / Event</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>$sport_label</td></tr>
            <tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Event Date</td><td style='padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#e5e7eb;'>May 3, 2026</td></tr>
            $players_html
        ";
    }

    $amount_display = $amount === 0 ? 'Free Entry' : 'Rs. ' . number_format($amount);

    $payment_row = ($amount > 0 && $payment_id)
        ? "<tr><td style='padding:8px 0;color:#6b7280;font-size:14px;'>Payment ID</td><td style='padding:8px 0;font-weight:600;font-size:13px;text-align:right;color:#e5e7eb;font-family:monospace;'>$payment_id</td></tr>"
        : '';

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:#dc2626;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.65);">Mangalore Inter-College</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Sports &amp; Games Championship 2026</h1>
          </td>
        </tr>

        <!-- CONFIRMED BADGE -->
        <tr>
          <td style="background:#1c1c1c;padding:32px 40px 0;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="background:#0a2e1a;border:1px solid #16a34a;border-radius:40px;padding:8px 22px;">
                  <span style="color:#4ade80;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Registration Confirmed</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="background:#1c1c1c;padding:24px 40px 28px;">
            <h2 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#ffffff;">Hey $to_name!</h2>
            <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.7;">
              You are officially registered for <strong style="color:#ffffff;">$event_name</strong>.<br/>
              Get ready to compete and create memories at Mangalore's biggest inter-college sports festival.
            </p>
          </td>
        </tr>

        <!-- REGISTRATION NUMBER -->
        <tr>
          <td style="background:#1c1c1c;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border:1.5px solid $event_color;border-radius:10px;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <p style="margin:0 0 8px 0;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6b7280;">Your Registration Number</p>
                  <p style="margin:0;font-size:30px;font-weight:900;color:$event_color;letter-spacing:3px;font-family:'Courier New',Courier,monospace;">$registration_number</p>
                  <p style="margin:10px 0 0 0;font-size:12px;color:#6b7280;">Present this number at the event check-in</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DETAILS -->
        <tr>
          <td style="background:#1c1c1c;padding:0 40px 28px;">
            <p style="margin:0 0 14px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Registration Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2d2d2d;">
              $details_rows
              <tr>
                <td style="padding:10px 0;color:#6b7280;font-size:14px;border-top:1px solid #2d2d2d;">Amount</td>
                <td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;color:#4ade80;border-top:1px solid #2d2d2d;">$amount_display</td>
              </tr>
              $payment_row
            </table>
          </td>
        </tr>

        <!-- WHAT TO BRING -->
        <tr>
          <td style="background:#1c1c1c;padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border-radius:10px;border:1px solid #2d2d2d;">
              <tr>
                <td style="padding:22px 24px;">
                  <p style="margin:0 0 14px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">What to Bring</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#d1d5db;">- Valid College ID Card (mandatory)</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#d1d5db;">- Authorization letter from your college</p>
                  <p style="margin:0 0 8px 0;font-size:13px;color:#d1d5db;">- Aadhaar Card (original or photocopy)</p>
                  <p style="margin:0;font-size:13px;color:#d1d5db;">- Passport size photograph</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- VENUE & CONTACT -->
        <tr>
          <td style="background:#1c1c1c;padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="49%" style="vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border-radius:10px;border:1px solid #2d2d2d;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Venue</p>
                        <p style="margin:0;font-size:13px;color:#e5e7eb;line-height:1.6;">6th Floor, Paradigm Plaza,<br/>Pandeshwar, Mangalore</p>
                      </td>
                    </tr>
                  </table>
                </td>
                <td width="2%"></td>
                <td width="49%" style="vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border-radius:10px;border:1px solid #2d2d2d;">
                    <tr>
                      <td style="padding:18px 20px;">
                        <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6b7280;">Contact</p>
                        <p style="margin:0;font-size:13px;color:#e5e7eb;line-height:1.6;">+91 7618783300<br/>enquiry@ssccmangalore.co.in</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0f0f0f;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border-top:1px solid #2d2d2d;">
            <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#ffffff;">Mangalore Inter-College Sports &amp; Games Championship</p>
            <p style="margin:0 0 16px 0;font-size:12px;color:#4b5563;">Speed &middot; Strength &middot; Spirit &middot; 2026</p>
            <p style="margin:0;font-size:11px;color:#374151;line-height:1.6;">This is an automated confirmation email. Please do not reply to this email.<br/>For queries, contact enquiry@ssccmangalore.co.in</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
HTML;

    $text = "REGISTRATION CONFIRMED\n"
          . str_repeat("-", 40) . "\n\n"
          . "Hi $to_name,\n\n"
          . "You are registered for $event_name.\n\n"
          . "Registration Number : $registration_number\n"
          . "Amount              : $amount_display\n"
          . ($payment_id ? "Payment ID          : $payment_id\n" : '')
          . "\nVenue   : 6th Floor, Paradigm Plaza, Pandeshwar, Mangalore\n"
          . "Contact : +91 7618783300 | enquiry@ssccmangalore.co.in\n\n"
          . "Mangalore Inter-College Sports & Games Championship 2026\n"
          . "Speed · Strength · Spirit\n";

    $payload = [
        'from'    => 'Mangalore Sports 2026 <noreply@ssccmangalore.co.in>',
        'to'      => [$to_email],
        'subject' => "Registration Confirmed - $registration_number | $event_name",
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
?>
