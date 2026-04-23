# ProFit Health 智慧健康運動促進平台
> **從數據追蹤到專業介入：打造全方位的健康管理生態系**

![Status](https://img.shields.io/badge/Status-Midterm%20Evaluation%20Passed-success)
![Version](https://img.shields.io/badge/Version-1.1.0-blue)
![Tech](https://img.shields.io/badge/Tech-Node.js%20%7C%20Express%20%7C%20SQLite-lightgrey)

## ▎專題核心理念
**ProFit Health** 是一款整合「自主運動紀錄、大數據分析、專業醫護/教練指導」的智慧化平台。我們致力於解決傳統健康 App「數據孤島」的痛點，將單純的紀錄轉化為具備專業回饋的閉環管理系統。

* **紀錄 (Tracking)**：多維度生理與運動數據採集。
* **分析 (Analysis)**：視覺化 Dashboard 趨勢判讀。
* **回饋 (Feedback)**：專家介入機制，提供個人化任務指派與建議。

---

## ▎系統核心價值
* **數據驅動決策 (Data-driven)**：利用 BMI 趨勢與運動統計，量化健康進度。
* **專家導向設計 (Expert-in-the-loop)**：引入專業人員角色，補足 AI 紀錄所欠缺的人性化指導。
* **多角色協同 (Multi-tenant)**：精準權限控管，整合「使用者、專家、管理者」三方需求。

---

## ▎角色功能定位

### 1. 一般使用者 (User) | 積極管理
* **數據採集**：整合 GPS 軌跡追蹤、計步器與 BMI 自動計算。
* **目標達成系統**：設定個人運動目標，透過 30 天達標率儀表板監控進度。
* **專家諮詢**：透過內建 Q&A 功能，直接向專屬專家尋求建議。

### 2. 專業人員 (Expert) | 精準介入
* **個案管理看板**：遠端監控多名使用者的運動與生理數據異常。
* **個人化處方**：根據數據下達「任務指派 (Task)」與「回饋建議 (Feedback)」。
* **互動溝通**：回覆個案諮詢，建立高黏著度的指導關係。

### 3. 系統管理者 (Admin) | 營運維護
* **智慧配對**：依據專家領域（如：減重、增肌、慢病管理）指派對應使用者。
* **資源控管**：帳號生命週期管理與系統權限配置。

---

## ▎技術架構
本系統採用 **前後端分離架構 (RESTful API)**，具備高度的跨平台擴充性。

| 組件 | 技術棧 | 說明 |
| :--- | :--- | :--- |
| **前端開發** | HTML5, CSS3, JS | 原生效能優化，確保流暢體驗 |
| **後端核心** | Node.js + Express | 提供高併發處理能力 |
| **資料庫** | SQLite | 輕量化、易於部署與攜帶 |
| **安全驗證** | JWT (JSON Web Token) | 實現跨網域加密驗證 |
| **數據視覺化** | Chart.js & Leaflet | 趨勢圖表與 GPS 地圖渲染 |

---

## ▎快速啟動 (Quick Start)

### 開發者模式
```bash
# 進入後端目錄
cd backend

# 安裝依賴套件
npm install

# 啟動 API Server
node index.js
使用者模式
一鍵啟動：直接執行根目錄下的 start.bat。

測試環境：內建 health.db 模擬資料庫，支持三方角色直接登入。

▎未來發展藍圖 (Roadmap)
[x] 核心數據追蹤系統

[ ] AI 預警系統：針對異常 BMI 自動推播警示。

[ ] 課程與金流整合：新增線上課程訂閱與支付機制。

[ ] 穿戴裝置同步：串接 Web Bluetooth API 獲取即時數據。

▎專案貢獻者
Nancy Lee - 專題架構設計與開發
