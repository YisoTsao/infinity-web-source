# Phase 1 — Creative Directions

> 專案：**infinity web**｜目標：Awwwards / FWA 等級的 Experimental Creative Showcase
> 狀態：提案中，等待確認方向後進入 Hero Prototype

三個方向刻意在「主視覺隱喻、色彩溫度、動態性格、技術重心」四個維度上拉開差異，避免只是換色的同一套網站。

---

## 方向 A — **MÖBIUS / 無盡之環**（推薦）

### 設計理念
整個網站就是一條莫比烏斯環：只有一個面、沒有起點也沒有終點。
使用者的捲動進度被定義為「沿著環行進的角度」（0° → 360°）。每經過一次「扭轉」，畫面就翻到「另一面」（墨黑 ↔ 骨白反轉），但最後會發現兩面其實是同一面。
網站最後一屏（360°）會無縫地回到 Hero（0°），形成真正的 **infinite web**。

這個隱喻直接對應專案名稱，並讓每個動畫都有敘事理由：Marquee 是「無盡」、粒子是「環的物質」、Liquid Morph 是「形狀的連續變形」、3D 相機是「沿著環飛行」。

### 色彩規範
| Token | 值 | 用途 |
|---|---|---|
| `ink` | `#0B0B0D` | 「正面」底色 |
| `bone` | `#ECE8DF` | 「反面」底色、正面文字 |
| `signal` | `#C8FF2E` | 唯一高彩度強調色（游標、進度、CTA） |
| `infra` | `#FF4A1C` | 極少量警示/熱點（每屏最多一處） |
| `graphite` | `#2A2A2E` | 分隔、次要 UI |

原則：兩色主導 + 一個信號色；不用大面積漸層，漸層只存在於 WebGL 光照中。

### 字體策略
- Display：**Syne**（可變字重 400–800，古怪的寬幅造型，用於超大標題與互動字重）
- Editorial：**Instrument Serif Italic**（敘事句中的情緒字，與 Syne 形成張力）
- Utility：**JetBrains Mono**（角度、座標、索引、進度等「儀表」資訊）

### 主要動畫
粒子莫比烏斯環、沿環飛行的捲動相機、黑白翻面轉場、超大字體 Split / Scramble、方向感知 Marquee、Liquid Morph（環 → 液態球 → 環）、Shader 扭曲圖片、無縫回到起點的最終轉場。

### Hero Concept
全黑畫面中央，約 40k 粒子組成緩慢自轉的莫比烏斯環；巨大的 `INFINITY` 字樣被環「穿過」（一半在環前、一半在環後的 DOM / WebGL 夾層）。游標靠近時粒子被推開並帶出信號色拖尾；右下角 Mono 儀表顯示 `000°`。

### Section Layout
0° Origin → 60° Manifesto → 120°–240° The Other Side（橫向）→ 240° Inside the Strip（3D）→ ∞ Endless（Marquee）→ 300° Process（Sticky）→ 360° = 0°（CTA 回到起點）。每屏佈局皆不同：中心構圖 / 編輯式左右錯位 / 橫向長軸 / 全幅沉浸 / 多層帶狀 / 分割黏貼 / 巨型字網格。

### 技術需求
R3F + 自訂 ShaderMaterial（粒子、液態變形）、GSAP ScrollTrigger（pin / scrub）、Lenis、GSAP SplitText、OGL 等級的輕量 image shader（以 R3F 單一共享 Canvas 實作）。

### 評估
辨識度 ★★★★★｜敘事完整度 ★★★★★｜實作風險 ★★★☆☆（最終無縫回圈需要謹慎處理）

---

## 方向 B — **MERCURY ARCHIVE / 液態檔案館**

### 設計理念
一座漂浮在暗場中的「液態金屬檔案館」。所有內容都像從水銀中浮出再沉回去；介面元素有表面張力，滑鼠是攪動液面的手指。

### 色彩規範
深炭灰 `#0E0F12`、鉻銀 `#C9CDD3`、熱感橙 `#FF6B00`、熱感紫 `#6A2CFF`（僅用於熱成像轉場）。

### 字體策略
Display：PP Neue Machina 類型的工業幾何字（開源替代：Space Grotesk 加大字距）；Body：Inter Tight。

### 主要動畫
Metaball 液態球、反射環境貼圖、熱成像 Shader 轉場、液面漣漪 hover、圖片從液面浮出。

### Hero Concept
一顆巨型液態金屬球隨游標變形，表面反射出作品縮圖；標題文字被液面折射。

### Section Layout
以「液面高度」為主軸：每個 Section 是不同深度的水層。

### 技術需求
高品質 PBR + HDRI 環境貼圖、raymarching metaball、較重的 post-processing。

### 評估
視覺衝擊 ★★★★★｜辨識度 ★★★☆☆（鉻金屬液態近年在得獎站中很常見）｜效能風險 ★★★★☆（raymarching 在手機上很吃力）

---

## 方向 C — **BROADCAST ERROR / 訊號中斷**

### 設計理念
網站是一台 1990 年代的實驗電視台，正在播送一個「不應該存在的頻道」。Swiss 網格 + CRT 訊號錯誤，捲動就是轉台。

### 色彩規範
純白 `#FFFFFF`、純黑、RGB 三原色只在訊號錯位時出現、測試卡黃 `#FFE600`。

### 字體策略
Helvetica 風格 Neo-grotesk（開源：Inter Display）超大緊排 + 點陣字（VT323）做字幕條。

### 主要動畫
RGB Split、Scanline、Datamosh 轉場、字幕跑馬燈、頻道切換閃斷。

### Hero Concept
全屏測試卡被游標「干擾」出雜訊，巨型標題像被錯誤訊號切片。

### Section Layout
每個 Section 是一個「頻道」，嚴格 12 欄網格。

### 技術需求
大量 fragment shader post-processing、Canvas 2D 雜訊、音效（可選）。

### 評估
個性 ★★★★☆｜辨識度 ★★★☆☆（Glitch 美學容易落入俗套）｜可及性風險 ★★★★☆（閃爍需嚴格處理光敏感問題）

---

## 推薦：方向 A — MÖBIUS

1. **概念與專案名完全咬合**：「infinity web」不只是名字，而是整個網站的結構（捲動 = 繞環一圈，結尾回到開頭）。
2. **每一個效果都有存在理由**：10 項指定效果全部可以從「環」這個物件自然推導出來，不會變成動畫拼貼。
3. **辨識度最高**：黑白翻面 + 單一螢光信號色，截圖即可辨認，不依賴流行的鉻金屬或 glitch 語彙。
4. **效能可控**：粒子 + 單一 Canvas + 以 transform/opacity 為主的 DOM 動畫，在手機上有清楚的降級路徑（粒子數、DPR、橫向改直向）。
5. **記憶點**：最後一屏「360° = 0°」無縫回到 Hero，讓使用者「願意反覆捲動」，這正是 brief 的最終目標。
