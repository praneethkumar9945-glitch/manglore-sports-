// Node.js backend server — replaces PHP for local dev
// Run: node server.js

const http = require('http');
const https = require('https');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

// --- Load .env ---
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
    const [k, ...rest] = trimmed.split('=');
    process.env[k.trim()] = rest.join('=').trim();
  });
}

const PORT             = parseInt(process.env.PORT || '8000');
const RAZORPAY_KEY_ID  = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET  = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET   = process.env.WEBHOOK_SECRET;

const SPORT_FEES = {
  '100meter': 0, '200meter': 0, '400meter': 0, '800meter': 0, 'relay400': 0,
  'volleyball': 1000, 'kabbadi': 1000, 'badminton': 1000, 'tugofwar': 1000,
  'longjump': 0, 'shotput': 0, 'discthrow': 0,
  'chess': 400, 'carrom': 400,
};

// --- DB pool ---
const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sports_fest',
  waitForConnections: true,
  connectionLimit: 10,
});

// --- Helpers ---
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, code, obj) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function ok(res, message, data = null) {
  json(res, 200, { success: true, status: 'success', message, data });
}

function err(res, message, code = 200) {
  json(res, code, { success: false, status: 'error', message, data: null });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

function parseBody(raw, contentType) {
  if (!raw) return {};
  if (contentType && contentType.includes('application/json')) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  // form-urlencoded
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params) obj[k] = v;
  return obj;
}

function sanitize(str) {
  if (!str) return '';
  return String(str).replace(/[<>'"]/g, c => ({ '<':'&lt;', '>':'&gt;', "'":"&#39;", '"':'&quot;' }[c]));
}

function phone(str) {
  return String(str || '').replace(/\D/g, '');
}

function razorpayRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_SECRET}`).toString('base64');
    const opts = {
      hostname: 'api.razorpay.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { reject(new Error('Invalid Razorpay response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// --- Route handlers ---

async function handleBgmiRegister(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const required = ['squadName','leaderName','contactNumber','email','collegeName'];
  for (const f of required) {
    if (!d[f]) return err(res, `Missing: ${f}`);
  }

  const email = String(d.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 'Invalid email');
  const ph = phone(d.contactNumber);
  if (ph.length < 10) return err(res, 'Invalid phone number');

  let teamMembers = '[]';
  if (d.teamMembers) {
    try {
      const parsed = typeof d.teamMembers === 'string' ? JSON.parse(d.teamMembers) : d.teamMembers;
      teamMembers = JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch { teamMembers = '[]'; }
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id FROM bgmi_registrations WHERE email=?', [email]);
    if (rows.length) return err(res, 'This email is already registered for BGMI');

    const [result] = await conn.execute(
      `INSERT INTO bgmi_registrations (squadName,leaderName,contactNumber,email,collegeName,teamMembers,amount,payment_status)
       VALUES (?,?,?,?,?,?,1000,'pending')`,
      [sanitize(d.squadName), sanitize(d.leaderName), ph, email, sanitize(d.collegeName), teamMembers]
    );
    ok(res, 'BGMI details saved. Proceed to payment.', { ref_id: result.insertId, amount: 1000 });
  } finally { conn.release(); }
}

async function handleMarathonRegister(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const required = ['full_name','college_name','email','phone','category','address'];
  for (const f of required) {
    if (!d[f]) return err(res, `Missing: ${f}`);
  }

  const email = String(d.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 'Invalid email');
  const ph = phone(d.phone);
  if (ph.length < 10) return err(res, 'Invalid phone number');
  if (!['mb40','ma40','wb40','wa40'].includes(d.category)) return err(res, 'Invalid category');

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute('SELECT id FROM marathon_registrations WHERE email=?', [email]);
    if (rows.length) return err(res, 'This email is already registered for the marathon');

    const [result] = await conn.execute(
      `INSERT INTO marathon_registrations (full_name,college_name,email,phone,category,tshirt_size,dob,emergency_contact,address,amount,payment_status)
       VALUES (?,?,?,?,?,?,?,?,?,400,'pending')`,
      [
        sanitize(d.full_name), sanitize(d.college_name), email, ph, d.category,
        d.tshirt_size || null, d.dob || null,
        d.emergency_contact ? sanitize(d.emergency_contact) : null,
        sanitize(d.address),
      ]
    );
    ok(res, 'Details saved. Proceed to payment.', { ref_id: result.insertId, amount: 400 });
  } finally { conn.release(); }
}

async function handleSportsRegister(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const required = ['college_name','email','phone','gender','sport','address'];
  for (const f of required) {
    if (!d[f]) return err(res, `Missing: ${f}`);
  }

  const email = String(d.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 'Invalid email');
  const ph = phone(d.phone);
  if (ph.length < 10) return err(res, 'Invalid phone number');
  if (!['male','female','other'].includes(d.gender)) return err(res, 'Invalid gender');
  if (!(d.sport in SPORT_FEES)) return err(res, 'Invalid sport selected');

  const amount = SPORT_FEES[d.sport];
  const initial_status = amount === 0 ? 'paid' : 'pending';

  let player_names = '[]';
  if (d.player_names) {
    try {
      const parsed = typeof d.player_names === 'string' ? JSON.parse(d.player_names) : d.player_names;
      player_names = JSON.stringify(Array.isArray(parsed) ? parsed : []);
    } catch { player_names = '[]'; }
  }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute(
      'SELECT id FROM sports_registrations WHERE email=? AND sport=?', [email, d.sport]
    );
    if (rows.length) return err(res, `This email is already registered for ${d.sport}`);

    const [result] = await conn.execute(
      `INSERT INTO sports_registrations (college_name,email,phone,gender,sport,player_names,emergency_contact,address,amount,payment_status)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        sanitize(d.college_name), email, ph, d.gender, d.sport,
        player_names,
        d.emergency_contact ? sanitize(d.emergency_contact) : null,
        sanitize(d.address), amount, initial_status,
      ]
    );
    ok(res, 'Registration details saved.', { ref_id: result.insertId, amount, sport: d.sport });
  } finally { conn.release(); }
}

async function handleCreateOrder(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const type   = String(d.type   || '');
  const ref_id = parseInt(d.ref_id || '0');
  if (!type || !ref_id) return err(res, 'Missing type or ref_id');

  const conn = await pool.getConnection();
  try {
    let row, receipt_prefix;
    if (type === 'bgmi') {
      const [rows] = await conn.execute('SELECT amount,payment_status FROM bgmi_registrations WHERE id=?', [ref_id]);
      if (!rows.length) return err(res, 'Registration not found');
      row = rows[0]; receipt_prefix = 'bgmi';
    } else if (type === 'marathon') {
      const [rows] = await conn.execute('SELECT amount,payment_status FROM marathon_registrations WHERE id=?', [ref_id]);
      if (!rows.length) return err(res, 'Registration not found');
      row = rows[0]; receipt_prefix = 'marathon';
    } else if (type === 'sport') {
      const [rows] = await conn.execute('SELECT amount,payment_status FROM sports_registrations WHERE id=?', [ref_id]);
      if (!rows.length) return err(res, 'Registration not found');
      row = rows[0]; receipt_prefix = 'sport';
    } else {
      return err(res, 'Invalid type');
    }

    if (row.payment_status === 'paid') return err(res, 'Already paid');

    const amount = parseInt(row.amount);

    if (amount === 0) {
      const table = type === 'bgmi' ? 'bgmi_registrations' : type === 'marathon' ? 'marathon_registrations' : 'sports_registrations';
      await conn.execute(`UPDATE \`${table}\` SET payment_status='paid' WHERE id=?`, [ref_id]);
      return ok(res, 'Free entry — registered successfully', { amount: 0, free: true });
    }

    // Create Razorpay order
    const receipt = `${receipt_prefix}_${ref_id}_${Date.now()}`;
    let rzp;
    try {
      rzp = await razorpayRequest('/v1/orders', {
        amount: amount * 100,
        currency: 'INR',
        receipt,
        notes: { ref_id, type },
      });
    } catch (e) {
      console.error('Razorpay error:', e.message);
      return err(res, 'Payment gateway connection failed');
    }

    if (rzp.status !== 200 || !rzp.body.id) {
      console.error('Razorpay order failed:', rzp.body);
      return err(res, 'Failed to create payment order');
    }

    const table = type === 'bgmi' ? 'bgmi_registrations' : type === 'marathon' ? 'marathon_registrations' : 'sports_registrations';
    await conn.execute(`UPDATE \`${table}\` SET razorpay_order_id=? WHERE id=?`, [rzp.body.id, ref_id]);

    ok(res, 'Order created', {
      order_id: rzp.body.id,
      amount: amount * 100,
      currency: 'INR',
      key_id: RAZORPAY_KEY_ID,
      ref_id,
      type,
    });
  } finally { conn.release(); }
}

async function handleVerifyPayment(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, type, ref_id } = d;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !type || !ref_id) {
    return err(res, 'Missing payment verification parameters');
  }

  // Free entry bypass
  if (razorpay_payment_id === 'free') {
    return ok(res, 'Registration successful!');
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    console.error('Signature mismatch', { razorpay_order_id });
    return err(res, 'Payment verification failed — invalid signature');
  }

  const tables = {
    bgmi: 'bgmi_registrations',
    marathon: 'marathon_registrations',
    sport: 'sports_registrations',
  };

  const table = tables[type];
  if (!table) return err(res, 'Invalid type');

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(
      `UPDATE \`${table}\` SET payment_status='paid', razorpay_payment_id=? WHERE id=? AND razorpay_order_id=?`,
      [razorpay_payment_id, parseInt(ref_id), razorpay_order_id]
    );
    if (result.affectedRows === 0) {
      console.error('verify_payment: no row updated', { type, ref_id, razorpay_order_id });
      return err(res, 'Could not update payment record');
    }
    ok(res, 'Payment verified successfully', { payment_id: razorpay_payment_id, order_id: razorpay_order_id });
  } finally { conn.release(); }
}

async function handleWebhook(req, res) {
  const raw = await readBody(req);
  const sig = req.headers['x-razorpay-signature'] || '';

  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  if (expected !== sig) {
    console.error('Webhook: signature mismatch');
    return json(res, 400, { message: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return json(res, 400, { message: 'Invalid payload' }); }

  const tables = ['bgmi_registrations','marathon_registrations','sports_registrations'];
  const conn = await pool.getConnection();
  try {
    if (event.event === 'payment.captured') {
      const payment    = event.payload?.payment?.entity || {};
      const order_id   = payment.order_id;
      const payment_id = payment.id;
      if (order_id && payment_id) {
        for (const table of tables) {
          const [r] = await conn.execute(
            `UPDATE \`${table}\` SET payment_status='paid', razorpay_payment_id=? WHERE razorpay_order_id=? AND payment_status!='paid'`,
            [payment_id, order_id]
          );
          if (r.affectedRows > 0) { console.log(`Webhook: paid ${table} order ${order_id}`); break; }
        }
      }
    } else if (event.event === 'payment.failed') {
      const order_id = event.payload?.payment?.entity?.order_id;
      if (order_id) {
        for (const table of tables) {
          const [r] = await conn.execute(
            `UPDATE \`${table}\` SET payment_status='failed' WHERE razorpay_order_id=? AND payment_status='pending'`,
            [order_id]
          );
          if (r.affectedRows > 0) break;
        }
      }
    } else if (event.event === 'refund.created') {
      const payment_id = event.payload?.refund?.entity?.payment_id;
      if (payment_id) {
        for (const table of tables) {
          const [r] = await conn.execute(
            `UPDATE \`${table}\` SET payment_status='refunded' WHERE razorpay_payment_id=?`,
            [payment_id]
          );
          if (r.affectedRows > 0) break;
        }
      }
    }
  } finally { conn.release(); }

  json(res, 200, { message: 'OK' });
}

async function handleContactSubmit(req, res) {
  const raw = await readBody(req);
  const d = parseBody(raw, req.headers['content-type']);

  const required = ['name','email','message'];
  for (const f of required) {
    if (!d[f]) return err(res, `Missing: ${f}`);
  }

  const email = String(d.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 'Invalid email');

  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'INSERT INTO contacts (name,email,phone,subject,message) VALUES (?,?,?,?,?)',
      [sanitize(d.name), email, d.phone ? phone(d.phone) : null, d.subject ? sanitize(d.subject) : null, sanitize(d.message)]
    );
    ok(res, 'Message sent! We will get back to you shortly.');
  } finally { conn.release(); }
}

// --- Router ---
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(200); res.end(); return; }

  const url = req.url.split('?')[0];
  console.log(`${req.method} ${url}`);

  try {
    if (url === '/bgmi_register.php'    && req.method === 'POST') return await handleBgmiRegister(req, res);
    if (url === '/marathon_register.php' && req.method === 'POST') return await handleMarathonRegister(req, res);
    if (url === '/sports_register.php'  && req.method === 'POST') return await handleSportsRegister(req, res);
    if (url === '/create_order.php'     && req.method === 'POST') return await handleCreateOrder(req, res);
    if (url === '/verify_payment.php'   && req.method === 'POST') return await handleVerifyPayment(req, res);
    if (url === '/webhook.php'          && req.method === 'POST') return await handleWebhook(req, res);
    if (url === '/submit_contact.php'   && req.method === 'POST') return await handleContactSubmit(req, res);
    if (url === '/health')                                         return json(res, 200, { status: 'ok' });

    json(res, 404, { success: false, message: 'Not found' });
  } catch (e) {
    console.error('Server error:', e);
    err(res, 'Internal server error', 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n✅ Backend server running at http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
  console.log(`   Razorpay Key: ${RAZORPAY_KEY_ID}\n`);
});
