const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// SQLite 連線
const DB_PATH = path.join(__dirname, "health.db");
const db = new sqlite3.Database(DB_PATH);

async function createUser(name, nickname, email, password, role) {
  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name, nickname, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
    [name, nickname, email, hash, role],
    function (err) {
      if (err) {
        console.log("新增失敗（可能 email 重複）:", email);
      } else {
        console.log("新增成功 →", email, "角色:", role);
      }
    }
  );
}

// 建立三個示範帳號
async function main() {
  await createUser("測試使用者", "test01", "test01@example.com", "password123", "user");
  await createUser("醫師甲", "doc1", "doc1@example.com", "docpass", "doctor");
  await createUser("管理員", "admin1", "admin1@example.com", "adminpass", "admin");
  await createUser("治療師PT", "pt01", "pt01@example.com", "ptpass", "pt");
  await createUser("防護員AT", "at01", "at01@example.com", "atpass", "at");
  await createUser("教練Coach", "coach01", "coach01@example.com", "coachpass", "coach");
  setTimeout(() => {
    db.close();
    console.log("資料庫已關閉。");
  }, 1000);
}

main();

