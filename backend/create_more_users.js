// create_more_users.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const DB_PATH = path.join(__dirname, "health.db");
const db = new sqlite3.Database(DB_PATH);

// 建立使用者 function
async function createUser(name, nickname, email, plainPassword, role) {
  return new Promise((resolve) => {
    const password_hash = bcrypt.hashSync(plainPassword, 10);

    db.run(
      `INSERT INTO users (name, nickname, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name, nickname, email, password_hash, role],
      function (err) {
        if (err) {
          console.log(`⚠️ 無法新增（可能 email 重複）: ${email}`);
          resolve();
        } else {
          console.log(`✔ 新增成功：${email}`);
          resolve();
        }
      }
    );
  });
}

async function main() {
  await createUser("物理治療師A", "PT_A", "pt1@example.com", "ptpass", "pt");
  await createUser("運動防護員A", "AT_A", "at1@example.com", "atpass", "at");
  await createUser("教練A", "Coach_A", "coach1@example.com", "coachpass", "coach");

  setTimeout(() => {
    db.close();
    console.log("資料庫已關閉。");
  }, 500);
}

main();
