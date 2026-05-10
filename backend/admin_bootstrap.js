const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "health.db"));

const email = "admin@abc.com";
const username = "Admin";
const password = "admin1234";
const role = "admin";

// 先檢查是否已有 admin
db.get(
  "SELECT id, email, username, role FROM users WHERE role = 'admin' LIMIT 1",
  [],
  (err, row) => {
    if (err) {
      console.error("查詢失敗:", err.message);
      return db.close();
    }

    if (row) {
      console.log("已存在 admin：", row);
      return db.close();
    }

    // 沒有 admin 才建立
    const hash = bcrypt.hashSync(password, 10);

    db.run(
      `INSERT INTO users (email, password, username, role)
       VALUES (?,?,?,?)`,
      [email, hash, username, role],
      function (err2) {
        if (err2) {
          console.error("建立 admin 失敗:", err2.message);
        } else {
          console.log("建立 admin 成功：", {
            id: this.lastID,
            email,
            password,
            role
          });
        }
        db.close();
      }
    );
  }
);
const API_BASE = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      "Authorization": "Bearer " + token
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "API Error");
  return data;
}

// ✅ 新增專業人員
async function createExpertFromUI() {
  const username = document.getElementById("newExpertName").value.trim();
  const email = document.getElementById("newExpertEmail").value.trim();
  const password = document.getElementById("newExpertPassword").value;
  const specialty = document.getElementById("newExpertSpecialty").value;

  if (!username || !email || !password) {
    alert("請填姓名 / Email / 密碼");
    return;
  }

  const payload = { username, email, password, specialty };

  try {
    const data = await apiFetch("/api/admin/experts", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    alert(`新增成功：${data.expert.username}（${data.expert.title}）`);

    // 清空欄位
    document.getElementById("newExpertName").value = "";
    document.getElementById("newExpertEmail").value = "";
    document.getElementById("newExpertPassword").value = "";

    // ✅ 重新載入專家清單 + 指派下拉
    if (typeof loadExperts === "function") await loadExperts();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnCreateExpert");
  if (btn) btn.addEventListener("click", createExpertFromUI);
});
const API_BASE = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      "Authorization": "Bearer " + token
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "API Error");
  return data;
}


