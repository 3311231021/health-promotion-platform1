# ProFit Health 健康運動促進平台

![ProFit Health Logo](logo.png)

---

## 📌 專題簡介

ProFit Health 是一套整合「運動紀錄、健康管理與專業指導」的健康促進平台。  
使用者可記錄日常運動與健康數據，並透過專業人員（教練 / 醫師等）提供回饋與任務，達到持續改善健康的目的。

---

## 👥 系統角色

- **一般使用者（User）**  
  記錄運動與健康資料、查看分析圖表、向專家提問

- **專業人員（Expert）**  
  查看個案、提供回饋、指派任務、回覆問題

- **管理員（Admin）**  
  管理專家帳號、指派專家與使用者

---

## 🚀 主要功能

### 👤 使用者功能

- 註冊 / 登入（JWT 驗證）
- 設定每日運動目標（步數 / 時間 / 卡路里）
- 新增運動紀錄（含心率、速度、卡路里）
- GPS 地圖運動 + 計步功能
- 健康紀錄（BMI 自動計算）
- Dashboard 視覺化分析：
  - 今日狀態
  - 30 天達標率
  - 本週 / 本月統計
  - BMI 趨勢
- 向專家提問（Q&A）

---

### 🧑‍⚕️ 專家功能

- 查看個案清單
- 檢視個案健康與運動資料
- 提供回饋（feedback）
- 指派任務（task）
- 回答使用者問題

---

### 🧑‍💼 管理員功能

- 建立專家帳號
- 管理專家資料（specialty）
- 指派專家與使用者（1 對多關係）

---

## 🏗️ 系統架構

- **Frontend**：HTML / CSS / JavaScript（純前端頁面）
- **Backend**：Node.js + Express
- **Database**：SQLite
- **Authentication**：JWT（Token-based）
- **Charts**：Chart.js
- **Map**：Leaflet（GPS 運動功能）

---

## ⚙️ 啟動方式

### 1️⃣ 啟動後端

```bash
cd backend
npm install
node index.js
```

預設 API：

```text
http://localhost:3000
```

---

### 2️⃣ 開啟前端

直接用瀏覽器開啟：

```text
frontend/auth.html
```

或使用 VS Code Live Server。

---

### 🚀 一鍵啟動（Windows）

本專案提供批次檔，方便快速啟動與關閉系統。

#### ▶️ 啟動系統
雙擊執行：

```text
start.bat
```

將自動：
- 啟動 backend server
- 開啟前端頁面

#### ⏹️ 關閉系統
雙擊執行：

```text
stop.bat
```

將關閉後端服務。

---

## 🧪 測試說明

本專案使用 **測試資料庫（health.db）**，不包含任何真實個人資料。  
可透過註冊功能建立測試帳號（User / Expert / Admin）進行操作。

GitHub Pages 僅用於展示前端畫面；完整功能需搭配本機後端 API 與 SQLite 資料庫執行。

---

## 📂 專案結構

```text
health-promotion-platform/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── health.db
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── auth.html
│   ├── dashboard.html
│   ├── activity.html
│   ├── health_record.html
│   ├── expert_dashboard.html
│   ├── admin_dashboard.html
│   ├── logo.png
│   └── ...
│
├── start.bat
├── stop.bat
├── README.md
└── logo.png
```

---

## 📈 專題特色

- 多角色系統（User / Expert / Admin）
- 完整前後端整合（API + Database）
- 視覺化健康數據分析（Chart.js）
- 專家互動機制（回饋 + 任務 + Q&A）
- GPS + 計步功能整合（Leaflet）
- 一鍵啟動（Batch Script）

---

## 🎬 Demo 說明

1. 執行 `start.bat`
2. 開啟登入頁面（`frontend/auth.html`）
3. 登入系統
4. 進入 Dashboard 查看分析
5. 切換角色體驗不同功能（User / Expert / Admin）

---

## 👨‍💻 作者

- 李莞霜（3311231021）
- 資訊管理系 專題作品
