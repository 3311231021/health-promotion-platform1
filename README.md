 ProFit Health 健康運動促進平台

![ProFit Health Logo](logo.png)

---

##  專題簡介

ProFit Health 是一套整合「運動紀錄、健康管理與專業指導」的智慧健康促進平台。

本系統不僅提供基本健康紀錄功能，更透過結合「使用者自我追蹤」與「專業人員介入」機制，建立資料驅動的健康管理模式。

 與傳統單一紀錄型應用不同，本系統形成：

**「紀錄 → 分析 → 回饋」閉環架構**

使健康數據不只是被儲存，而是能被解讀並轉化為實際行動建議。

---

##  系統核心價值

-  **資料驅動決策（Data-driven Health Management）**
-  **閉環健康管理（Tracking → Analysis → Feedback）**
-  **專業介入機制（Expert-in-the-loop）**
-  **多角色整合平台（User / Expert / Admin）**

 系統定位：  
**從「健康紀錄工具」升級為「健康管理平台」**

---

##  系統角色

###  一般使用者（User）
- 記錄運動與健康資料
- 查看 Dashboard 分析
- 設定目標與追蹤進度
- 向專家提問（Q&A）

---

###  專業人員（Expert）
- 查看個案健康與運動狀況
- 提供回饋（Feedback）
- 指派任務（Task）
- 回覆使用者問題

---

###  系統管理者（Admin）
- 建立與管理專家帳號
- 指派專家與使用者（1對多）
- 管理平台角色權限

---

##  主要功能

###  使用者功能
- JWT 登入 / 註冊驗證
- 運動紀錄（時間 / 步數 / 卡路里 / 心率）
- GPS 地圖運動 + 計步
- 健康紀錄（BMI 自動計算）
- Dashboard 視覺化分析：
  - 今日狀態
  - 30 天達標率
  - 本週 / 本月統計
  - BMI 趨勢

---

###  專家功能
- 個案管理
- 健康數據分析
- 任務指派（Task）
- 回饋建議（Feedback）
- 問題回覆（Q&A）

---

###  管理者功能
- 專家帳號管理
- 專業領域分類（specialty）
- 專家與使用者配對

---

##  系統架構

- **Frontend**：HTML / CSS / JavaScript  
- **Backend**：Node.js + Express  
- **Database**：SQLite  
- **Authentication**：JWT  
- **Chart**：Chart.js  
- **Map**：Leaflet  

 採用前後端分離架構（RESTful API）  
 具備高擴充性（可延伸 App / 穿戴裝置）

---

##  啟動方式

###  啟動後端

```bash
cd backend
npm install
node index.js

API 預設：

http://localhost:3000
 啟動前端

直接開啟：

frontend/auth.html

或使用 VS Code Live Server。

 一鍵啟動（Windows）
 啟動系統
start.bat
 關閉系統
stop.bat
 測試說明
使用測試資料庫（health.db）
不包含真實個資
可自行註冊 User / Expert / Admin 測試

⚠️ GitHub Pages 僅展示前端畫面
完整功能需搭配後端 API

 專案結構
health-promotion-platform/
├── backend/
├── frontend/
├── start.bat
├── stop.bat
├── README.md
 專題特色
多角色系統（User / Expert / Admin）
健康數據視覺化（Chart.js）
專家互動機制（Feedback / Task / Q&A）
GPS 運動整合（Leaflet）
JWT 安全驗證
一鍵啟動系統
 Demo 流程
執行 start.bat
開啟登入頁
登入系統
查看 Dashboard
切換角色體驗（User / Expert / Admin）

 作者

Nancy Lee
3311231021
資訊管理系 專題作品
