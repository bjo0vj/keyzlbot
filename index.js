const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 2803;

// ========== CONFIG ==========
const ADMIN_USER = 'bjo0vj';
const ADMIN_PASS = 'Phat@0833';
const KEY_VALID_HOURS = 24;
const MAX_KEYS_PER_IP = 2;
const IP_RESET_HOURS = 24;
const KEY_EXPIRE_HOURS = 24;

// Database file
const DB_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== DATABASE ==========
function loadDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) { }
    return { keys: [], ipLimits: {} };
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ========== UTILITIES ==========
function getIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        'unknown';
}

function genKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = 'TDF-';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        if (i < 3) key += '-';
    }
    return key;
}

function formatTime(date) {
    return new Date(date).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// ========== AUTO CLEANUP - MỖI 10 PHÚT ==========
function cleanup() {
    const db = loadDB();
    const now = Date.now();
    const before = db.keys.length;

    db.keys = db.keys.filter(k => {
        const expire = new Date(k.expireAt).getTime();
        return now < expire;
    });

    for (let ip in db.ipLimits) {
        if (now > db.ipLimits[ip].resetAt) {
            delete db.ipLimits[ip];
        }
    }

    saveDB(db);
    if (before !== db.keys.length) {
        console.log(`[CLEANUP] Đã xóa ${before - db.keys.length} key hết hạn`);
    }
    console.log(`[CHECK] ${new Date().toLocaleString('vi-VN')} | Keys: ${db.keys.length}`);
}

// Chạy cleanup mỗi 10 phút
setInterval(cleanup, 10 * 60 * 1000);

// ========== TRANG CHÍNH ==========
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TDF-2803 Key Generator</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            padding: 20px;
        }
        .card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 50px 40px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.3);
        }
        .logo {
            font-size: 60px;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 20px rgba(255,200,0,0.5));
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(90deg, #ffd700, #ff6b35);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .subtitle {
            color: rgba(255,255,255,0.6);
            font-size: 15px;
            margin-bottom: 35px;
        }
        .btn {
            width: 100%;
            padding: 18px 30px;
            font-size: 17px;
            font-weight: 600;
            background: linear-gradient(135deg, #00c853, #00e676);
            border: none;
            border-radius: 14px;
            color: #000;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,200,83,0.3);
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0,200,83,0.4);
        }
        .btn:active { transform: translateY(0); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        #result {
            margin-top: 25px;
            padding: 20px;
            border-radius: 14px;
            display: none;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .success { background: rgba(0,200,83,0.15); border: 1px solid rgba(0,200,83,0.3); }
        .error { background: rgba(255,82,82,0.15); border: 1px solid rgba(255,82,82,0.3); }
        .key-box {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 700;
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            word-break: break-all;
            color: #00e676;
            letter-spacing: 1px;
        }
        .expire-info { font-size: 13px; color: rgba(255,255,255,0.5); }
        .copy-btn {
            width: 100%;
            padding: 12px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 10px;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .copy-btn:hover { transform: scale(1.02); opacity: 0.9; }
        .contact {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 13px;
            color: rgba(255,255,255,0.4);
        }
        .contact a {
            color: rgba(255,255,255,0.6);
            text-decoration: none;
            transition: color 0.2s;
        }
        .contact a:hover { color: #ffd700; }
        .phone { color: #00e676; font-weight: 600; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">🔑</div>
        <h1>TDF-2803<br>Key Generator</h1>
        <p class="subtitle">Tạo key miễn phí • Có hiệu lực ${KEY_VALID_HOURS} giờ</p>
        <button class="btn" id="createBtn" onclick="createKey()">✨ TẠO KEY NGAY</button>
        <div id="result"></div>
        <div class="contact">
            <p>Mua key vĩnh viễn: <span class="phone">0878139888</span></p>
            <p style="margin-top:12px"><a href="/admin">🔒 Quản trị viên</a></p>
        </div>
    </div>
    <script>
    async function createKey() {
        const btn = document.getElementById('createBtn');
        const result = document.getElementById('result');
        btn.disabled = true;
        btn.textContent = '⏳ Đang tạo...';
        try {
            const res = await fetch('/api/create', { method: 'POST' });
            const data = await res.json();
            result.style.display = 'block';
            if (data.success) {
                result.className = 'success';
                result.innerHTML = '<p>✅ Tạo key thành công!</p><div class="key-box" id="keyText">' + data.key + '</div><button class="copy-btn" onclick="copyKey()">📋 COPY KEY</button><p class="expire-info">⏰ Hết hạn: ' + data.expireAt + '</p>';
                window.generatedKey = data.key;
            } else {
                result.className = 'error';
                result.innerHTML = '❌ ' + data.message;
            }
        } catch(e) {
            result.style.display = 'block';
            result.className = 'error';
            result.innerHTML = '❌ Lỗi kết nối server!';
        }
        btn.disabled = false;
        btn.textContent = '✨ TẠO KEY NGAY';
    }
    function copyKey() {
        if (window.generatedKey) {
            navigator.clipboard.writeText(window.generatedKey).then(function() {
                const copyBtn = document.querySelector('.copy-btn');
                copyBtn.textContent = '✅ ĐÃ COPY!';
                copyBtn.style.background = '#00c853';
                setTimeout(function() {
                    copyBtn.textContent = '📋 COPY KEY';
                    copyBtn.style.background = '';
                }, 2000);
            });
        }
    }
    </script>
</body>
</html>`);
});

// ========== API TẠO KEY ==========
app.post('/api/create', (req, res) => {
    const db = loadDB();
    const ip = getIP(req);
    const now = Date.now();

    if (!db.ipLimits[ip]) {
        db.ipLimits[ip] = { count: 0, resetAt: now + (IP_RESET_HOURS * 60 * 60 * 1000) };
    }

    if (now > db.ipLimits[ip].resetAt) {
        db.ipLimits[ip] = { count: 0, resetAt: now + (IP_RESET_HOURS * 60 * 60 * 1000) };
    }

    if (db.ipLimits[ip].count >= MAX_KEYS_PER_IP) {
        const resetTime = formatTime(db.ipLimits[ip].resetAt);
        return res.json({ success: false, message: `Đã đạt giới hạn ${MAX_KEYS_PER_IP} key/24h! Thử lại: ${resetTime}` });
    }

    const key = genKey();
    const createdAt = new Date().toISOString();
    const expireAt = new Date(now + (KEY_VALID_HOURS * 60 * 60 * 1000)).toISOString();

    db.keys.push({ key, createdAt, expireAt, ip, used: false });
    db.ipLimits[ip].count++;
    saveDB(db);

    console.log(`[NEW KEY] ${key} | IP: ${ip}`);
    res.json({ success: true, key, expireAt: formatTime(expireAt) });
});

// ========== API PING (KEEP ALIVE) ==========
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

// ========== API CHECK KEY ==========
app.get('/api/check', (req, res) => {
    const { key } = req.query;
    if (!key) return res.json({ valid: false, message: 'Thiếu key!' });

    cleanup();
    const db = loadDB();
    const now = Date.now();
    const keyData = db.keys.find(k => k.key === key);

    if (!keyData) return res.json({ valid: false, message: 'Key không tồn tại!' });

    const expireTime = new Date(keyData.expireAt).getTime();
    if (now > expireTime) return res.json({ valid: false, message: 'Key đã hết hạn!' });

    if (!keyData.used) {
        keyData.used = true;
        keyData.usedAt = new Date().toISOString();
        saveDB(db);
    }

    const h = Math.floor((expireTime - now) / 3600000);
    const m = Math.floor(((expireTime - now) % 3600000) / 60000);
    res.json({ valid: true, message: `Key hợp lệ! Còn ${h}h ${m}m` });
});

// ========== ADMIN LOGIN ==========
app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); display: flex; justify-content: center; align-items: center; }
        .box { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; width: 320px; }
        h2 { color: #ffd700; text-align: center; margin-bottom: 25px; font-size: 22px; }
        input { width: 100%; padding: 14px; margin: 8px 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; background: rgba(0,0,0,0.3); color: #fff; font-size: 14px; }
        input:focus { outline: none; border-color: #00e676; }
        .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #00c853, #00e676); border: none; border-radius: 10px; color: #000; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🔐 Admin Login</h2>
        <form method="POST" action="/admin/login">
            <input type="text" name="user" placeholder="Username" required>
            <input type="password" name="pass" placeholder="Password" required>
            <button type="submit" class="btn">Đăng nhập</button>
        </form>
    </div>
</body>
</html>`);
});

app.post('/admin/login', (req, res) => {
    const { user, pass } = req.body;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        const token = Buffer.from(user + ':' + pass).toString('base64');
        res.redirect('/admin/panel?t=' + encodeURIComponent(token));
    } else {
        res.send('<script>alert("Sai tài khoản!");location="/admin";</script>');
    }
});

// ========== ADMIN PANEL ==========
app.get('/admin/panel', (req, res) => {
    const token = req.query.t;
    if (token !== Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64')) return res.redirect('/admin');

    cleanup();
    const db = loadDB();
    const now = Date.now();

    let rows = db.keys.map((k, i) => {
        const expired = now > new Date(k.expireAt).getTime();
        const status = expired ? '❌ Hết hạn' : (k.used ? '✅ Đã dùng' : '⏳ Chờ');
        const color = expired ? '#ff5252' : (k.used ? '#00e676' : '#ffd700');
        return `<tr>
            <td>${i + 1}</td>
            <td style="font-family:monospace;color:#00e676">${k.key}</td>
            <td>${formatTime(k.createdAt)}</td>
            <td>${formatTime(k.expireAt)}</td>
            <td style="color:${color}">${status}</td>
            <td>${k.ip}</td>
            <td><button class="del-btn" onclick="deleteKey('${k.key}')">🗑️</button></td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px;color:#888">Chưa có key nào</td></tr>';

    res.send(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; padding: 30px; }
        h1 { color: #ffd700; margin-bottom: 25px; font-size: 24px; }
        .stats { display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap; }
        .stat { background: rgba(255,255,255,0.05); padding: 20px 30px; border-radius: 14px; flex: 1; min-width: 130px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
        .stat-num { font-size: 36px; font-weight: 700; color: #00e676; }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border-radius: 14px; overflow: hidden; }
        th, td { padding: 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
        th { background: rgba(255,255,255,0.05); font-weight: 600; color: #ffd700; }
        .btn { padding: 10px 25px; background: #00e676; border: none; border-radius: 8px; color: #000; font-weight: 600; cursor: pointer; margin-right: 10px; }
        .btn-danger { background: #ff5252; color: #fff; }
        .del-btn { padding: 6px 12px; background: #ff5252; border: none; border-radius: 6px; color: #fff; cursor: pointer; font-size: 12px; }
        .del-btn:hover { background: #ff1744; }
        a { color: #00e676; text-decoration: none; }
    </style>
</head>
<body>
    <h1>🔐 Admin Panel</h1>
    <div class="stats">
        <div class="stat"><div class="stat-num">${db.keys.length}</div><div class="stat-label">Tổng key</div></div>
        <div class="stat"><div class="stat-num">${db.keys.filter(k => k.used).length}</div><div class="stat-label">Đã dùng</div></div>
        <div class="stat"><div class="stat-num">${db.keys.filter(k => !k.used && now < new Date(k.expireAt).getTime()).length}</div><div class="stat-label">Còn hạn</div></div>
    </div>
    <button class="btn" onclick="location.reload()">🔄 Làm mới</button>
    <button class="btn btn-danger" onclick="deleteAll()">🗑️ Xóa tất cả</button>
    <table>
        <tr><th>#</th><th>Key</th><th>Tạo lúc</th><th>Hết hạn</th><th>Trạng thái</th><th>IP</th><th>Xóa</th></tr>
        ${rows}
    </table>
    <p style="margin-top:25px"><a href="/">← Về trang chủ</a></p>
    <script>
    const token = '${token}';
    async function deleteKey(key) {
        if (!confirm('Xóa key: ' + key + '?')) return;
        const res = await fetch('/api/admin/delete?t=' + encodeURIComponent(token) + '&key=' + encodeURIComponent(key), { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        location.reload();
    }
    async function deleteAll() {
        if (!confirm('XÓA TẤT CẢ KEY?')) return;
        const res = await fetch('/api/admin/delete-all?t=' + encodeURIComponent(token), { method: 'DELETE' });
        const data = await res.json();
        alert(data.message);
        location.reload();
    }
    </script>
</body>
</html>`);
});

// ========== API XÓA KEY ==========
app.delete('/api/admin/delete', (req, res) => {
    const token = req.query.t;
    if (token !== Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64')) {
        return res.json({ success: false, message: 'Unauthorized!' });
    }
    const key = req.query.key;
    const db = loadDB();
    const before = db.keys.length;
    db.keys = db.keys.filter(k => k.key !== key);
    saveDB(db);
    res.json({ success: true, message: `Đã xóa key: ${key}` });
});

app.delete('/api/admin/delete-all', (req, res) => {
    const token = req.query.t;
    if (token !== Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64')) {
        return res.json({ success: false, message: 'Unauthorized!' });
    }
    const db = loadDB();
    const count = db.keys.length;
    db.keys = [];
    db.ipLimits = {};
    saveDB(db);
    res.json({ success: true, message: `Đã xóa ${count} key!` });
});

// ========== START ==========
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔑 TDF Key Server | Port ${PORT}`);
    console.log(`📍 Ready for Replit deployment!`);
    cleanup();
});
