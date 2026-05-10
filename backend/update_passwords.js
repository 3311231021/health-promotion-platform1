// update_passwords.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const DB_PATH = path.join(__dirname, "health.db");
const db = new sqlite3.Database(DB_PATH);

async function updatePassword(email, plainPassword) {
  return new Promise((resolve) => {
    const password_hash = bcrypt.hashSync(plainPassword, 10);

    db.run(
      `UPDATE users SET password_hash = ? WHERE email = ?`,
      [password_hash, email],
      function (err) {
        if (err) {
          console.log(`❌ 更新失敗: ${email}`);
          resolve();
        } else if (this.changes === 0) {
          console.log(`⚠️ 找不到帳號: ${email}`);
          resolve();
        } else {
          console.log(`✔ 密碼更新成功：${email}`);
          resolve();
        }
      }
    );
  });
}

async function main() {
  await updatePassword("pt1@example.com", "ptpass");
  await updatePassword("at1@example.com", "atpass");
  await updatePassword("coach1@example.com", "coachpass");

  setTimeout(() => {
    db.close();
    console.log("資料庫已關閉。");
  }, 500);
}

main();
