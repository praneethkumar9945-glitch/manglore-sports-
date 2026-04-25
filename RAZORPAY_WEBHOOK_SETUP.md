# Razorpay Webhook Setup Guide
## Mangalore Inter-College Sports & Games Championship 2026

---

## What is a Webhook?

When a user pays, Razorpay calls your server directly (even if the user closes the browser).
This is the **reliable source of truth** for payment status — more reliable than the frontend callback.

Your webhook file: `https://ssccmangalore.co.in/webhook.php`

---

## Step 1 — Login to Razorpay Dashboard

Go to: https://dashboard.razorpay.com  
Login with your Razorpay account credentials.

---

## Step 2 — Go to Webhook Settings

1. In the left sidebar click **Settings**
2. Click **Webhooks**
3. Click **+ Add New Webhook**

---

## Step 3 — Configure the Webhook

Fill in the form exactly as below:

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://ssccmangalore.co.in/webhook.php` |
| **Secret** | `t5fSgZSQwPp76M052r8zR3Zv` |
| **Alert Email** | `enquiry@ssccmangalore.co.in` |

---

## Step 4 — Select Events to Subscribe

Check these 3 events:

- ✅ `payment.captured` — fires when payment is successfully captured
- ✅ `payment.failed` — fires when payment fails
- ✅ `refund.created` — fires when a refund is issued

Leave all other events unchecked.

---

## Step 5 — Save

Click **Create Webhook**.

Razorpay will show the webhook in the list with status **Active**.

---

## Step 6 — Test the Webhook

1. In the webhook list, click on your webhook
2. Click **Test Webhook**
3. Select event: `payment.captured`
4. Click **Send Test Event**
5. You should see **Response: 200 OK**

If you get 200 — webhook is working correctly.

---

## How it Works (Flow)

```
User fills form
     ↓
Frontend saves registration → gets ref_id from DB
     ↓
Frontend calls create_order.php → Razorpay creates order
     ↓
Razorpay checkout popup opens → User pays
     ↓
     ├── Frontend: calls verify_payment.php (signature check) → marks paid in DB
     │
     └── Razorpay: calls webhook.php directly (backup) → marks paid in DB
```

Both `verify_payment.php` and `webhook.php` mark the payment as paid.
The webhook is the **safety net** — it fires even if the user closes the browser mid-payment.

---

## Webhook Security

Your `webhook.php` verifies every request using HMAC-SHA256:

```
expected = HMAC-SHA256(raw_request_body, WEBHOOK_SECRET)
received = X-Razorpay-Signature header

If expected !== received → request is rejected (HTTP 400)
If expected === received → payment is processed
```

This means **no one can fake a webhook call** without knowing your secret.

---

## Environment Variables (backend/.env)

```env
RAZORPAY_KEY_ID=placeholder
RAZORPAY_KEY_SECRET=placeholder
WEBHOOK_SECRET=pleaceholder
```

> **Important:** The `WEBHOOK_SECRET` must exactly match what you entered in the Razorpay Dashboard webhook form. They are currently the same value as `RAZORPAY_KEY_SECRET`.

---

## Going Live (Production)

When you are ready to go live:

1. In Razorpay Dashboard → switch from **Test Mode** to **Live Mode** (toggle top-left)
2. Get your **Live Key ID** and **Live Key Secret**
3. Update `backend/.env` on the server:
   ```env
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Update the webhook URL in Live Mode dashboard (same URL, same secret)
5. Test with a real small payment

---

## Checking Payment Status in Database

Connect to your DB and run:

```sql
-- See all BGMI payments
SELECT id, squadName, email, amount, payment_status, razorpay_payment_id, created_at
FROM bgmi_registrations ORDER BY created_at DESC;

-- See all Marathon payments
SELECT id, full_name, email, amount, payment_status, razorpay_payment_id, created_at
FROM marathon_registrations ORDER BY created_at DESC;

-- See all Sports payments
SELECT id, college_name, sport, email, amount, payment_status, razorpay_payment_id, created_at
FROM sports_registrations ORDER BY created_at DESC;

-- See pending payments (not yet paid)
SELECT 'bgmi' as type, id, email, amount, payment_status FROM bgmi_registrations WHERE payment_status='pending'
UNION ALL
SELECT 'marathon', id, email, amount, payment_status FROM marathon_registrations WHERE payment_status='pending'
UNION ALL
SELECT 'sport', id, email, amount, payment_status FROM sports_registrations WHERE payment_status='pending';
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Webhook returns 400 | Secret mismatch — check `.env` WEBHOOK_SECRET matches dashboard |
| Webhook returns 500 | DB connection failed — check `.env` DB credentials |
| Webhook not firing | Check URL is correct and server is live |
| Payment stuck as "pending" | Manually check Razorpay Dashboard → Payments → find the payment → verify status |
| Test webhook fails | Make sure `webhook.php` is uploaded to server |
