const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "health.db"));

db.all(
  "SELECT id, email, username, role FROM users WHERE role = 'admin'",
  [],
  (err, rows) => {
    if (err) {
      console.error("資料庫錯誤:", err.message);
    } else {
      console.log("Admin accounts:", rows);
    }
    db.close();
  }
);
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "health.db"));

const email = "admin@abc.com";
const username = "Admin";
const password = "admin1234"; // 你要的管理員密碼
const role = "admin";

const hash = bcrypt.hashSync(password, 10);

db.run(
  `INSERT INTO users (email, password, username, role)
   VALUES (?,?,?,?)`,
  [email, hash, username, role],
  function (err) {
    if (err) {
      console.error("建立 admin 失敗:", err.message);
    } else {
      console.log("建立 admin 成功:", {
        id: this.lastID,
        email,
        password,
        role
      });
    }
    db.close();
  }
);

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "health.db"));

db.all(
  "SELECT id, email, username, role FROM users WHERE role = 'admin'",
  [],
  (err, rows) => {
    if (err) console.error("資料庫錯誤:", err.message);
    else console.log("Admin accounts:", rows);
    db.close();
  }
);
