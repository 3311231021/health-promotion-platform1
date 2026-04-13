// backend/index.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ 避免前端 / API 被快取
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// ================= JWT 設定 =================
const SECRET = process.env.JWT_SECRET || "mysecret";

// ================= 靜態前端 =================
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/auth.html"));
});

// ================= 資料庫 =================
const db = new sqlite3.Database(path.join(__dirname, "health.db"));

// ================= 建表 =================
db.serialize(() => {
  // users（已存在不會覆蓋；如果你舊 DB 沒 status，請自行 ALTER TABLE）
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT,
      duration INTEGER NOT NULL,
      steps INTEGER DEFAULT 0,
      heart_rate INTEGER DEFAULT 0,
      speed REAL DEFAULT 0,
      calories INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      height REAL,
      weight REAL,
      bmi REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      user_id INTEGER PRIMARY KEY,
      daily_steps INTEGER DEFAULT 5000,
      daily_minutes INTEGER DEFAULT 30,
      daily_calories INTEGER DEFAULT 300,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expert_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      specialty TEXT NOT NULL,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expert_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expert_user_id INTEGER NOT NULL,
      client_user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(expert_user_id, client_user_id),
      FOREIGN KEY (expert_user_id) REFERENCES users(id),
      FOREIGN KEY (client_user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expert_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expert_user_id INTEGER NOT NULL,
      client_user_id INTEGER NOT NULL,
      note_type TEXT NOT NULL,             -- feedback | task
      content TEXT NOT NULL,
      target_date DATE,
      target_minutes INTEGER,
      target_steps INTEGER,
      target_calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expert_user_id) REFERENCES users(id),
      FOREIGN KEY (client_user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS client_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_user_id INTEGER NOT NULL,
      expert_user_id INTEGER,              -- 未指派時可為 NULL
      question TEXT NOT NULL,
      reply TEXT,
      status TEXT DEFAULT 'open',          -- open | answered
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      replied_at DATETIME,
      FOREIGN KEY (client_user_id) REFERENCES users(id),
      FOREIGN KEY (expert_user_id) REFERENCES users(id)
    )
  `);
});

// ================= 小工具 =================
function dbAll(sql, params, res) {
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
    res.json(rows || []);
  });
}

function dbGet(sql, params, res, fallback = null) {
  db.get(sql, params, (err, row) => {
    if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
    res.json(row ?? fallback);
  });
}

// ================= JWT Middleware =================
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "尚未登入（缺少 token）" });

  jwt.verify(token, SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: "token 無效或過期" });
    req.user = payload; // { id, role }
    next();
  });
}

// ================= RBAC + 狀態檢查 =================
function requireRole(role) {
  return (req, res, next) => {
    db.get(
      `SELECT role, COALESCE(status,'active') AS status FROM users WHERE id = ?`,
      [req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
        if (!row) return res.status(401).json({ message: "使用者不存在" });

        if (String(row.status).toLowerCase() !== "active") {
          return res.status(403).json({ message: "帳號已停用" });
        }

        if (row.role !== role) return res.status(403).json({ message: "Forbidden" });
        next();
      }
    );
  };
}

// 專家只能看自己被指派的 client（且指派狀態要 active）
function requireAssignedClient(req, res, next) {
  const clientId = Number(req.params.clientId);
  if (!clientId) return res.status(400).json({ message: "clientId 不正確" });

  db.get(
    `SELECT 1
     FROM expert_assignments
     WHERE expert_user_id = ? AND client_user_id = ? AND status = 'active'`,
    [req.user.id, clientId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
      if (!row) return res.status(403).json({ message: "Forbidden: not assigned" });
      next();
    }
  );
}

// ================= ✅ 專業類型（固定 4 種） =================
const SPECIALTY_TITLE_MAP = {
  coach: "教練",
  doctor: "醫師",
  pt: "物理治療師",
  at: "運動防護員",
};
function isValidSpecialty(s) {
  return Object.prototype.hasOwnProperty.call(SPECIALTY_TITLE_MAP, s);
}

// ================= API：健康檢查 =================
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// ================= Auth APIs =================
app.post("/api/register", (req, res) => {
  const { email, password, username } = req.body || {};
  if (!email || !password || !username) {
    return res.status(400).json({ message: "缺少 email / password / username" });
  }

  const hash = bcrypt.hashSync(String(password), 10);

  db.run(
    `INSERT INTO users (email, password, username, role, status) VALUES (?,?,?, 'user', 'active')`,
    [String(email).trim(), hash, String(username).trim()],
    (err) => {
      if (err) return res.status(400).json({ message: "註冊失敗：Email 可能已存在", error: String(err) });
      res.json({ message: "註冊成功" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "缺少 email / password" });

  db.get(`SELECT * FROM users WHERE email = ?`, [String(email).trim()], (err, user) => {
    if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
    if (!user) return res.status(401).json({ message: "帳密錯誤" });

    // ✅ 停用帳號不能登入
    const st = String(user.status || "active").toLowerCase();
    if (st !== "active") {
      return res.status(403).json({ message: "此帳號已停用，請聯絡管理員" });
    }

    const ok = bcrypt.compareSync(String(password), user.password);
    if (!ok) return res.status(401).json({ message: "帳密錯誤" });

    // ✅ token 夾帶 role（前端導頁方便），後端仍以 DB requireRole 為主
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1d" });
    res.json({ message: "登入成功", token, role: user.role });
  });
});

// ================= 使用者 =================
app.get("/api/me", auth, (req, res) => {
  dbGet(
    `SELECT id, email, username, role, created_at, COALESCE(status,'active') AS status
     FROM users WHERE id = ?`,
    [req.user.id],
    res
  );
});

app.put("/api/me", auth, (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ message: "缺少 username" });

  db.run(`UPDATE users SET username = ? WHERE id = ?`, [String(username).trim(), req.user.id], function (err) {
    if (err) return res.status(500).json({ message: "更新失敗", error: String(err) });
    res.json({ message: "更新成功" });
  });
});

// ================= 運動紀錄 =================
function insertActivity(req, res) {
  const { activity_type, duration, steps = 0, heart_rate = 0, speed = 0, calories = 0 } = req.body || {};
  const d = Number(duration);
  if (!d || d <= 0) return res.status(400).json({ message: "duration 必須 > 0" });

  db.run(
    `INSERT INTO activity_records (user_id, activity_type, duration, steps, heart_rate, speed, calories)
     VALUES (?,?,?,?,?,?,?)`,
    [
      req.user.id,
      String(activity_type || ""),
      d,
      Number(steps) || 0,
      Number(heart_rate) || 0,
      Number(speed) || 0,
      Number(calories) || 0,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "儲存失敗", error: String(err) });
      res.json({ message: "儲存成功", id: this.lastID });
    }
  );
}

function listActivity(req, res) {
  dbAll(
    `SELECT * FROM activity_records
     WHERE user_id = ?
     ORDER BY datetime(created_at) DESC, id DESC`,
    [req.user.id],
    res
  );
}

app.post("/api/activity", auth, insertActivity);
app.get("/api/activity", auth, listActivity);

// 舊版相容
app.post("/api/activity_records", auth, insertActivity);
app.get("/api/activity_records", auth, listActivity);

// ================= 健康紀錄 =================
app.post("/api/health_records", auth, (req, res) => {
  const { height, weight, bmi } = req.body || {};
  const h = Number(height),
    w = Number(weight),
    b = Number(bmi);
  if (!h || !w || !b) return res.status(400).json({ message: "請提供 height / weight / bmi" });

  db.run(
    `INSERT INTO health_records (user_id, height, weight, bmi) VALUES (?,?,?,?)`,
    [req.user.id, h, w, b],
    function (err) {
      if (err) return res.status(500).json({ message: "儲存失敗", error: String(err) });
      res.json({ message: "儲存成功", id: this.lastID });
    }
  );
});

app.get("/api/health_records", auth, (req, res) => {
  dbAll(
    `SELECT * FROM health_records WHERE user_id = ? ORDER BY datetime(created_at) DESC, id DESC`,
    [req.user.id],
    res
  );
});

// dashboard 容錯相容
app.get("/api/health", auth, (req, res) => {
  dbAll(
    `SELECT * FROM health_records WHERE user_id = ? ORDER BY datetime(created_at) DESC, id DESC`,
    [req.user.id],
    res
  );
});

// ================= 目標設定 =================
app.get("/api/goals", auth, (req, res) => {
  dbGet(
    `SELECT daily_steps, daily_minutes, daily_calories FROM goals WHERE user_id = ?`,
    [req.user.id],
    res,
    { daily_steps: 5000, daily_minutes: 30, daily_calories: 300 }
  );
});

app.put("/api/goals", auth, (req, res) => {
  const { daily_steps = 5000, daily_minutes = 30, daily_calories = 300 } = req.body || {};

  db.run(
    `INSERT INTO goals (user_id, daily_steps, daily_minutes, daily_calories)
     VALUES (?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
       daily_steps = excluded.daily_steps,
       daily_minutes = excluded.daily_minutes,
       daily_calories = excluded.daily_calories`,
    [req.user.id, Number(daily_steps) || 0, Number(daily_minutes) || 0, Number(daily_calories) || 0],
    function (err) {
      if (err) return res.status(500).json({ message: "更新失敗", error: String(err) });
      res.json({ message: "目標已更新" });
    }
  );
});

// ================= 專家：個案清單 =================
app.get("/api/expert/clients", auth, requireRole("expert"), (req, res) => {
  const sql = `
    SELECT
      ea.client_user_id AS client_id,
      u.username,
      u.email,
      ea.status,
      ep.specialty,
      ep.title,
      (
        SELECT MAX(datetime(ar.created_at))
        FROM activity_records ar
        WHERE ar.user_id = ea.client_user_id
      ) AS last_activity_at
    FROM expert_assignments ea
    JOIN users u ON u.id = ea.client_user_id
    LEFT JOIN expert_profiles ep ON ep.user_id = ea.expert_user_id
    WHERE ea.expert_user_id = ? AND ea.status = 'active'
    ORDER BY (last_activity_at IS NULL) ASC,
             datetime(last_activity_at) DESC,
             ea.client_user_id ASC
  `;
  dbAll(sql, [req.user.id], res);
});

// ================= 專家：個案概覽 =================
app.get("/api/expert/clients/:clientId/overview", auth, requireRole("expert"), requireAssignedClient, (req, res) => {
  const clientId = Number(req.params.clientId);

  db.get(
    `SELECT id, email, username, role, created_at, COALESCE(status,'active') AS status
     FROM users WHERE id = ?`,
    [clientId],
    (err, client) => {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
      if (!client) return res.status(404).json({ message: "找不到個案" });

      db.get(
        `SELECT daily_steps, daily_minutes, daily_calories FROM goals WHERE user_id = ?`,
        [clientId],
        (err2, goals) => {
          if (err2) return res.status(500).json({ message: "資料庫錯誤", error: String(err2) });
          const goalsSafe = goals || { daily_steps: 5000, daily_minutes: 30, daily_calories: 300 };

          db.get(
            `SELECT *
             FROM health_records
             WHERE user_id = ?
             ORDER BY datetime(created_at) DESC, id DESC
             LIMIT 1`,
            [clientId],
            (err3, latestHealth) => {
              if (err3) return res.status(500).json({ message: "資料庫錯誤", error: String(err3) });

              db.all(
                `SELECT
                   date(created_at) AS day,
                   COUNT(*) AS sessions,
                   SUM(duration) AS total_minutes,
                   SUM(steps) AS total_steps,
                   SUM(calories) AS total_calories,
                   AVG(heart_rate) AS avg_heart_rate
                 FROM activity_records
                 WHERE user_id = ?
                   AND datetime(created_at) >= datetime('now', '-6 days')
                 GROUP BY date(created_at)
                 ORDER BY day DESC`,
                [clientId],
                (err4, last7days) => {
                  if (err4) return res.status(500).json({ message: "資料庫錯誤", error: String(err4) });

                  res.json({
                    client,
                    goals: goalsSafe,
                    latest_health: latestHealth || null,
                    last_7_days: last7days || [],
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// ================= 專家：新增 notes（回饋/任務） =================
app.post("/api/expert/clients/:clientId/notes", auth, requireRole("expert"), requireAssignedClient, (req, res) => {
  const clientId = Number(req.params.clientId);
  const {
    note_type, // feedback | task
    content,
    target_date = null,
    target_minutes = null,
    target_steps = null,
    target_calories = null,
  } = req.body || {};

  const nt = String(note_type || "").trim();
  const ct = String(content || "").trim();

  if (!["feedback", "task"].includes(nt)) {
    return res.status(400).json({ message: "note_type 必須是 feedback 或 task" });
  }
  if (!ct) return res.status(400).json({ message: "content 不能為空" });

  db.run(
    `INSERT INTO expert_notes
      (expert_user_id, client_user_id, note_type, content, target_date, target_minutes, target_steps, target_calories)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      req.user.id,
      clientId,
      nt,
      ct,
      target_date ? String(target_date) : null,
      target_minutes === "" ? null : target_minutes == null ? null : Number(target_minutes),
      target_steps === "" ? null : target_steps == null ? null : Number(target_steps),
      target_calories === "" ? null : target_calories == null ? null : Number(target_calories),
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
      res.json({ message: "已新增", id: this.lastID });
    }
  );
});

app.get("/api/expert/clients/:clientId/notes", auth, requireRole("expert"), requireAssignedClient, (req, res) => {
  const clientId = Number(req.params.clientId);
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  dbAll(
    `SELECT id, note_type, content, target_date, target_minutes, target_steps, target_calories, created_at
     FROM expert_notes
     WHERE expert_user_id = ? AND client_user_id = ?
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ?`,
    [req.user.id, clientId, limit],
    res
  );
});

// ================= ✅ 學員：看到自己的回饋/任務（含專家名稱） =================
app.get("/api/client/notes", auth, requireRole("user"), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  dbAll(
    `SELECT
       n.id,
       n.note_type,
       n.content,
       n.target_date,
       n.target_minutes,
       n.target_steps,
       n.target_calories,
       n.created_at,
       u.username AS expert_name,
       u.email AS expert_email
     FROM expert_notes n
     JOIN users u ON u.id = n.expert_user_id
     WHERE n.client_user_id = ?
     ORDER BY datetime(n.created_at) DESC, n.id DESC
     LIMIT ?`,
    [req.user.id, limit],
    res
  );
});

// ================= ✅ 學員：提問（自動找 active 指派的 expert） =================
app.post("/api/client/questions", auth, requireRole("user"), (req, res) => {
  const q = String(req.body?.question || "").trim();
  if (!q) return res.status(400).json({ message: "question 不能為空" });

  db.get(
    `SELECT expert_user_id
     FROM expert_assignments
     WHERE client_user_id = ? AND status = 'active'
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT 1`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });

      const expertId = row ? Number(row.expert_user_id) : null;

      db.run(
        `INSERT INTO client_questions (client_user_id, expert_user_id, question)
         VALUES (?,?,?)`,
        [req.user.id, expertId, q],
        function (e2) {
          if (e2) return res.status(500).json({ message: "資料庫錯誤", error: String(e2) });
          res.json({ message: "已送出提問", id: this.lastID, expert_user_id: expertId });
        }
      );
    }
  );
});

// ================= ✅ 學員：查看自己的問答清單（含專家名稱） =================
app.get("/api/client/questions", auth, requireRole("user"), (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  dbAll(
    `SELECT
       q.id,
       q.question,
       q.reply,
       q.status,
       q.created_at,
       q.replied_at,
       u.username AS expert_name
     FROM client_questions q
     LEFT JOIN users u ON u.id = q.expert_user_id
     WHERE q.client_user_id = ?
     ORDER BY datetime(q.created_at) DESC, q.id DESC
     LIMIT ?`,
    [req.user.id, limit],
    res
  );
});

// ================= ✅ 專家：查看某個案提問清單（允許 expert_user_id NULL） =================
app.get("/api/expert/clients/:clientId/questions", auth, requireRole("expert"), requireAssignedClient, (req, res) => {
  const clientId = Number(req.params.clientId);
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  dbAll(
    `SELECT id, client_user_id, expert_user_id, question, reply, status, created_at, replied_at
     FROM client_questions
     WHERE client_user_id = ?
       AND (expert_user_id = ? OR expert_user_id IS NULL)
     ORDER BY datetime(created_at) DESC, id DESC
     LIMIT ?`,
    [clientId, req.user.id, limit],
    res
  );
});

// ================= ✅ 專家：回覆提問（若 expert_user_id 為 NULL，補上自己） =================
app.post(
  "/api/expert/clients/:clientId/questions/:qid/reply",
  auth,
  requireRole("expert"),
  requireAssignedClient,
  (req, res) => {
    const clientId = Number(req.params.clientId);
    const qid = Number(req.params.qid);
    const reply = String(req.body?.reply || "").trim();

    if (!qid) return res.status(400).json({ message: "qid 不正確" });
    if (!reply) return res.status(400).json({ message: "reply 不能為空" });

    db.run(
      `UPDATE client_questions
       SET reply = ?,
           status = 'answered',
           replied_at = CURRENT_TIMESTAMP,
           expert_user_id = COALESCE(expert_user_id, ?)
       WHERE id = ? AND client_user_id = ?`,
      [reply, req.user.id, qid, clientId],
      function (err) {
        if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
        if (this.changes === 0) return res.status(404).json({ message: "找不到該提問" });
        res.json({ message: "已回覆" });
      }
    );
  }
);

// ===================================================================
// ========================= ✅ 管理員 APIs ===========================
// ===================================================================

// ✅ 管理員：專家清單（預設只顯示 active；include_inactive=1 顯示停用）
app.get("/api/admin/experts", auth, requireRole("admin"), (req, res) => {
  const includeInactive = String(req.query.include_inactive || "0") === "1";

  const where = includeInactive
    ? `WHERE u.role='expert'`
    : `WHERE u.role='expert' AND COALESCE(u.status,'active')='active'`;

  const sql = `
    SELECT
      u.id AS expert_user_id,
      u.username,
      u.email,
      u.role,
      COALESCE(u.status,'active') AS status,
      ep.specialty,
      ep.title,
      ep.created_at AS profile_created_at
    FROM users u
    LEFT JOIN expert_profiles ep ON ep.user_id = u.id
    ${where}
    ORDER BY u.id ASC
  `;

  dbAll(sql, [], res);
});

// ✅ 管理員：學員清單（預設只顯示 active；include_inactive=1 顯示停用）
app.get("/api/admin/clients", auth, requireRole("admin"), (req, res) => {
  const includeInactive = String(req.query.include_inactive || "0") === "1";

  const where = includeInactive
    ? `WHERE role='user'`
    : `WHERE role='user' AND COALESCE(status,'active')='active'`;

  const sql = `
    SELECT id AS client_user_id, username, email, role, created_at, COALESCE(status,'active') AS status
    FROM users
    ${where}
    ORDER BY id ASC
  `;
  dbAll(sql, [], res);
});

// ✅ 管理員：新增專業人員（四種：coach/doctor/pt/at）
app.post("/api/admin/experts", auth, requireRole("admin"), (req, res) => {
  const { email, password, username, specialty } = req.body || {};
  const sp = String(specialty || "").trim();

  if (!email || !password || !username || !sp) {
    return res.status(400).json({ message: "缺少 email / password / username / specialty" });
  }
  if (!isValidSpecialty(sp)) {
    return res.status(400).json({ message: "specialty 只能是 coach/doctor/pt/at" });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const title = SPECIALTY_TITLE_MAP[sp];

  // 1) users(role=expert)
  db.run(
    `INSERT INTO users (email, password, username, role, status) VALUES (?,?,?, 'expert', 'active')`,
    [String(email).trim(), hash, String(username).trim()],
    function (err) {
      if (err) return res.status(400).json({ message: "新增失敗：Email 可能已存在", error: String(err) });

      const newUserId = this.lastID;

      // 2) expert_profiles
      db.run(
        `INSERT INTO expert_profiles (user_id, specialty, title) VALUES (?,?,?)`,
        [newUserId, sp, title],
        function (err2) {
          if (err2) {
            // 回滾：profile 失敗，把 user 刪掉（維持一致）
            db.run(`DELETE FROM users WHERE id = ?`, [newUserId], () => {});
            return res.status(500).json({ message: "建立 expert profile 失敗", error: String(err2) });
          }

          res.json({
            message: "新增專業人員成功",
            expert: {
              expert_user_id: newUserId,
              username,
              email,
              specialty: sp,
              title,
              status: "active",
            },
          });
        }
      );
    }
  );
});

// ✅ 管理員：建立/更新指派（單筆）
app.post("/api/admin/assignments", auth, requireRole("admin"), (req, res) => {
  const { expert_user_id, client_user_id, status = "active" } = req.body || {};
  const expertId = Number(expert_user_id);
  const clientId = Number(client_user_id);

  if (!expertId || !clientId) return res.status(400).json({ message: "缺少 expert_user_id / client_user_id" });

  // 確認 expertId
  db.get(
    `SELECT id, role, COALESCE(status,'active') AS status FROM users WHERE id = ?`,
    [expertId],
    (e1, expert) => {
      if (e1) return res.status(500).json({ message: "資料庫錯誤", error: String(e1) });
      if (!expert) return res.status(404).json({ message: "找不到 expert" });
      if (expert.role !== "expert") return res.status(400).json({ message: "expert_user_id 不是 expert" });
      if (String(expert.status).toLowerCase() !== "active")
        return res.status(400).json({ message: "expert_user_id 已停用，不能指派" });

      // 確認 clientId
      db.get(
        `SELECT id, role, COALESCE(status,'active') AS status FROM users WHERE id = ?`,
        [clientId],
        (e2, client) => {
          if (e2) return res.status(500).json({ message: "資料庫錯誤", error: String(e2) });
          if (!client) return res.status(404).json({ message: "找不到 client" });
          if (client.role !== "user") return res.status(400).json({ message: "client_user_id 不是 user" });
          if (String(client.status).toLowerCase() !== "active")
            return res.status(400).json({ message: "client_user_id 已停用，不能指派" });

          db.run(
            `INSERT INTO expert_assignments (expert_user_id, client_user_id, status)
             VALUES (?,?,?)
             ON CONFLICT(expert_user_id, client_user_id) DO UPDATE SET
               status = excluded.status`,
            [expertId, clientId, String(status)],
            function (e3) {
              if (e3) return res.status(500).json({ message: "資料庫錯誤", error: String(e3) });
              res.json({ message: "指派已更新", expert_user_id: expertId, client_user_id: clientId, status });
            }
          );
        }
      );
    }
  );
});

// ✅ 管理員：批次指派（1 位學員 → 多位專家）
app.post("/api/admin/assignments/bulk", auth, requireRole("admin"), (req, res) => {
  const { client_user_id, expert_user_ids, status = "active" } = req.body || {};
  const clientId = Number(client_user_id);
  const expertIds = Array.isArray(expert_user_ids) ? expert_user_ids.map(Number).filter(Boolean) : [];

  if (!clientId || expertIds.length === 0) {
    return res.status(400).json({ message: "需要 client_user_id 與 expert_user_ids（至少一位）" });
  }

  db.get(
    `SELECT id, role, COALESCE(status,'active') AS status FROM users WHERE id = ?`,
    [clientId],
    (e1, client) => {
      if (e1) return res.status(500).json({ message: "資料庫錯誤", error: String(e1) });
      if (!client) return res.status(404).json({ message: "找不到 client" });
      if (client.role !== "user") return res.status(400).json({ message: "client_user_id 不是 user" });
      if (String(client.status).toLowerCase() !== "active")
        return res.status(400).json({ message: "client_user_id 已停用，不能指派" });

      const placeholders = expertIds.map(() => "?").join(",");
      db.all(
        `SELECT id, role, COALESCE(status,'active') AS status FROM users WHERE id IN (${placeholders})`,
        expertIds,
        (e2, rows) => {
          if (e2) return res.status(500).json({ message: "資料庫錯誤", error: String(e2) });

          const notExpert = (rows || []).filter((r) => r.role !== "expert").map((r) => r.id);
          if (notExpert.length > 0) return res.status(400).json({ message: "以下 ID 不是 expert", bad_ids: notExpert });

          const inactive = (rows || []).filter((r) => String(r.status).toLowerCase() !== "active").map((r) => r.id);
          if (inactive.length > 0) return res.status(400).json({ message: "以下 expert 已停用，不能指派", bad_ids: inactive });

          let done = 0;
          let failed = [];

          expertIds.forEach((eid) => {
            db.run(
              `INSERT INTO expert_assignments (expert_user_id, client_user_id, status)
               VALUES (?,?,?)
               ON CONFLICT(expert_user_id, client_user_id) DO UPDATE SET
                 status = excluded.status`,
              [eid, clientId, String(status)],
              (e3) => {
                done++;
                if (e3) failed.push({ expert_user_id: eid, error: String(e3) });

                if (done === expertIds.length) {
                  if (failed.length > 0) return res.status(500).json({ message: "部分指派失敗", failed });
                  res.json({ message: "批次指派完成", client_user_id: clientId, expert_user_ids: expertIds, status });
                }
              }
            );
          });
        }
      );
    }
  );
});

// ✅ 管理員：查看某學員目前指派了哪些專家（for UI 回填）
app.get("/api/admin/clients/:clientId/assignments", auth, requireRole("admin"), (req, res) => {
  const clientId = Number(req.params.clientId);
  if (!clientId) return res.status(400).json({ message: "clientId 不正確" });

  const sql = `
    SELECT
      ea.id,
      ea.expert_user_id,
      ea.client_user_id,
      ea.status,
      ea.created_at,
      u.username AS expert_name,
      COALESCE(u.status,'active') AS expert_status,
      ep.specialty,
      ep.title
    FROM expert_assignments ea
    JOIN users u ON u.id = ea.expert_user_id
    LEFT JOIN expert_profiles ep ON ep.user_id = ea.expert_user_id
    WHERE ea.client_user_id = ?
    ORDER BY datetime(ea.created_at) DESC, ea.id DESC
  `;
  dbAll(sql, [clientId], res);
});

// ✅ 管理員：停用/啟用（soft delete）
app.patch("/api/admin/users/:id/disable", auth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "id 不正確" });

  db.run(
    `UPDATE users
     SET status = 'inactive'
     WHERE id = ? AND role != 'admin'`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
      if (this.changes === 0) return res.status(404).json({ message: "找不到使用者或不可停用" });
      res.json({ message: "已停用", id });
    }
  );
});

app.patch("/api/admin/users/:id/enable", auth, requireRole("admin"), (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "id 不正確" });

  db.run(
    `UPDATE users
     SET status = 'active'
     WHERE id = ?`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ message: "資料庫錯誤", error: String(err) });
      if (this.changes === 0) return res.status(404).json({ message: "找不到使用者" });
      res.json({ message: "已啟用", id });
    }
  );
});

// ================= 404 / 500（一定要放最後） =================
app.use((req, res) => {
  res.status(404).json({ message: `Not Found: ${req.method} ${req.url}` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "伺服器錯誤", error: String(err) });
});

// ================= 啟動 =================
app.listen(3000, () => {
  console.log("✅ Server running: http://localhost:3000");
  console.log("✅ Frontend:       http://localhost:3000/auth.html");
});

