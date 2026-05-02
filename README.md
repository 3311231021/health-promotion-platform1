# ProFit Health 跨健康與運動管理之智慧健康運動促進平台

![ProFit Health Logo](logo.png)

> 從數據追蹤到專業介入
> 打造「紀錄 → 分析 → 回饋」的健康管理閉環

---

## 📌 專案簡介

ProFit Health 是一套整合「運動紀錄、健康數據分析與專業指導」的智慧健康促進平台。

現今多數健康管理應用僅提供資料記錄功能，缺乏持續動機與專業介入，導致使用者難以長期維持運動習慣。

本系統透過導入「專家介入機制」，建立：

**紀錄（Tracking） → 分析（Analysis） → 回饋（Feedback）閉環系統**

協助使用者從「被動記錄」轉變為「主動健康管理」。

---

## 🎯 核心價值

* 📊 **Data-driven（數據驅動）**
  透過 Dashboard 分析 BMI 趨勢、運動統計，量化健康進展

* 🧑‍⚕️ **Expert-in-the-loop（專家介入）**
  教練 / 醫師提供個人化建議與任務指派

* 🔁 **Closed-loop（閉環管理）**
  從數據 → 分析 → 行動 → 再優化

* 👥 **Multi-role System（多角色系統）**
  整合 User / Expert / Admin 三方協作

---

## 👥 系統角色

### 👤 User（一般使用者）

* 記錄運動與健康資料
* 查看 Dashboard 分析
* 設定目標（步數 / 時間 / 卡路里）
* 向專家提問（Q&A）

---

### 🧑‍⚕️ Expert（專業人員）

* 查看個案健康與運動資料
* 提供回饋（Feedback）
* 指派任務（Task）
* 回答使用者問題

---

### 🧑‍💼 Admin（管理者）

* 建立與管理專家帳號
* 指派專家與使用者（1對多）
* 權限與系統管理

---

## 🚀 主要功能

### 📱 使用者功能

* JWT 註冊 / 登入驗證
* 運動紀錄（時間 / 步數 / 心率 / 卡路里）
* GPS 地圖運動（Leaflet）
* 健康紀錄（BMI 自動計算）
* Dashboard 視覺化分析：

  * 今日狀態
  * 30 天達標率
  * 本週 / 本月統計
  * BMI 趨勢

---

### 🧠 專家系統

* 個案管理 Dashboard
* 個人化任務指派
* 健康數據分析
* 即時回饋與建議

---

### ⚙️ 管理系統

* 專家帳號管理
* 專家指派機制
* 系統權限控管

---

## 🏗️ 系統架構

| 模組             | 技術                      |
| -------------- | ----------------------- |
| Frontend       | HTML / CSS / JavaScript |
| Backend        | Node.js + Express       |
| Database       | SQLite                  |
| Authentication | JWT                     |
| Charts         | Chart.js                |
| Map            | Leaflet                 |

👉 採用 **前後端分離架構（RESTful API）**

👉 資料庫採 SQLite，本地端儲存，方便快速部署與展示

---

## ⚙️ 快速啟動

### 1️⃣ 啟動系統（建議）

```bash
start.bat
```

✔ 自動啟動後端服務
✔ 自動開啟系統頁面

---

### 2️⃣ 手動啟動（開發用）

```bash
cd backend
npm install
node index.js
```

👉 啟動後，於瀏覽器開啟：

```bash
http://localhost:3000
```

---

## 🧪 測試說明

* 使用 `health.db` 測試資料庫
* 可建立 User / Expert / Admin 測試帳號
* 無真實個資

---

## 📂 專案結構

```
health-promotion-platform/
│
├── backend/
├── frontend/
├── start.bat
├── stop.bat
├── README.md
└── logo.png
```

---

## ⭐ 專題亮點

✅ 多角色健康管理系統（User / Expert / Admin）
✅ 完整前後端整合（API + Database）
✅ 健康數據視覺化（Chart.js）
✅ 專家互動機制（回饋 / 任務 / Q&A）
✅ GPS + 計步整合（Leaflet）
✅ 一鍵啟動（Batch Script）

---

## 🎬 Demo 流程

1. 執行 `start.bat` 啟動系統
2. 開啟 `http://localhost:3000`
3. 使用 User 帳號登入
4. 新增運動紀錄與健康資料
5. 查看 Dashboard 分析（達標狀態 / 圖表）
6. 切換至 Expert 角色
7. 查看個案資料並提供回饋 / 任務
8. 展示 Admin 指派機制

👉 完整呈現「紀錄 → 分析 → 專業介入」流程

---

## 🚀 未來發展（Roadmap）

🤖 AI 健康預警（異常偵測）
⌚ 穿戴裝置及測量值整合（Mi Fitness / Omron Cloud API / Apple HealthKit / Google Fit API ）
💰 課程與金流系統
📱 行動 App（Mobile App）

---

## 👨‍💻 作者

Nancy Lee（3311231021）
資訊管理學系 專題作品

---
