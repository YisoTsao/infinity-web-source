# ART_DIRECTION — MÖBIUS

## 1. 主視覺概念
**「一個面，沒有盡頭。」**
莫比烏斯環是唯一的主視覺物件。它在不同 Section 以不同狀態出現：粒子（Hero）、輪廓線（Nav / Loader）、液態（3D）、帶狀文字（Marquee）、SVG 形狀（Process）、字體本身（CTA 的 `∞`）。
全站的「翻面」——墨黑與骨白互換——代表沿環走到另一面。

### 視覺關鍵字
儀器感（角度、座標、刻度）× 編輯式超大字 × 物理粒子 × 極簡雙色。
不是科幻 HUD，也不是 Y2K；更像**一本被印在示波器上的藝術期刊**。

## 2. Color Palette
```
ink       #0B0B0D   正面底色
bone      #ECE8DF   反面底色 / 正面文字
signal    #C8FF2E   唯一強調色（游標、進度、CTA、粒子熱點）
infra     #FF4A1C   熱點（每屏 ≤ 1 處，例如 "LIVE" 指示燈）
graphite  #2A2A2E   次要線條、disabled
fog       #8A8780   次要文字（在 ink 上 4.9:1、在 bone 上用 #5E5B55）
```
### 規則
- 每一屏只允許「一個主色 + 一個文字色 + signal」三色。
- `signal` 在 bone 底上不可用於文字（對比不足），改用於色塊/底線，文字改 ink。
- 主題翻面透過 CSS 變數 `--bg / --fg / --muted` 由 GSAP 在 `<html>` 上切換，所有元件只讀語意變數。
- 禁止：裝飾性漸層背景、glassmorphism、霓虹光暈濫用。漸層只允許出現在 WebGL 光照結果中。

## 3. Typography System
| 角色 | 字體 | 大小（clamp） | 字重 | 行高 / 字距 |
|---|---|---|---|---|
| Mega | Syne | `clamp(5rem, 18vw, 22rem)` | 800 | 0.82 / -0.04em |
| Display | Syne | `clamp(3rem, 9vw, 10rem)` | 700 | 0.9 / -0.03em |
| Title | Syne | `clamp(2rem, 4.5vw, 4.5rem)` | 600 | 1.0 / -0.02em |
| Emotive | Instrument Serif Italic | 與相鄰 Display 同大 | 400 | 0.9 / -0.01em |
| Body | Syne | `clamp(1rem, 1.1vw, 1.25rem)` | 400 | 1.45 / 0 |
| 中文 Body | system（PingFang TC / Noto Sans TC） | 同上 | 400 | 1.7 / 0.02em |
| Meta | JetBrains Mono | `0.75rem` | 500 | 1.2 / 0.08em，全大寫 |

### 排版語法
- 超大字**一定會破格**：至少一側出血或與圖片/3D 物件重疊。
- 每個標題含一個 Serif Italic「情緒字」，例如 `Things that *never* end`。
- Mono 用於「儀器資訊」：`[ 060° ]`、`N°03/06`、`x: 0.42 y: -0.18`。
- 中文永遠作為「註解層」出現（小、灰、靠近英文），不和英文搶主層級。

## 4. Grid System
- Desktop（≥1280）：**12 欄**，gutter `24px`，邊界 `clamp(16px, 4vw, 64px)`。
- Laptop（1024–1279）：12 欄，gutter 20px。
- Tablet（768–1023）：8 欄，gutter 16px。
- Mobile（<768）：4 欄，gutter 12px，邊界 16px。
- **刻意破格**：每個 Section 至少一個元素跨越網格（Mega 字、3D 物件、圖片出血）。
- 開發時 `Shift + G` 顯示網格 overlay（僅 dev）。

## 5. Spacing System
以 `4px` 為基底、比例 1.5 的跳躍尺度：
`4 · 8 · 12 · 16 · 24 · 36 · 56 · 84 · 128 · 192`
Section 之間不用固定 padding，而以**捲動距離**定義節奏（pinned 區段以 `vh` 為單位，例如 `+=300%`）。

## 6. Visual Hierarchy
每屏三層：
1. **焦點層**：一個巨大物件（Mega 字 / 3D / 主圖），佔畫面 ≥ 40%。
2. **敘事層**：Title + Body，靠網格對齊。
3. **儀器層**：Mono 角度/索引/進度，固定在角落，跟著捲動「讀數」。

## 7. Background Treatment
- 全站固定層（由下到上）：`--bg` 色 → WebGL Canvas（共享）→ DOM 內容 → Grain Overlay → Cursor。
- **Grain**：SVG `feTurbulence` 預先產生 256×256 噪點貼圖，以 CSS `background-image` 平鋪，`steps()` 動畫每 80ms 偏移位置（不在每幀重算噪點）。`mix-blend-mode: overlay`，opacity 0.08（ink）/ 0.12（bone）。
- 無漸層背景；背景的「動」來自粒子、翻面與 grain。

## 8. Image Treatment
- 預設**單色 duotone**（ink × bone），hover 或進入視窗中心時才釋放原色。
- 圖片框不使用圓角卡片；用**刻度框**：四角 8px 的十字標記 + Mono 編號。
- Reveal：`clip-path: inset()` 由中心向外展開 + 內部圖片反向 scale 1.3 → 1。
- WebGL 圖片：滑鼠/捲動速度驅動的 displacement（見 MOTION_SYSTEM）。

## 9. Motion Language（摘要）
**連續性（Continuity）**：沒有東西憑空出現。每個元素沿著曲線、遮罩或環的切線進場。
- 不使用單純 fade-in / slide-up。最基本的進場是「遮罩內上升 + 字元 stagger」。
- 翻面（ink ↔ bone）是唯一的「大轉場」，全站只發生 4 次，因此有份量。
- 詳見 MOTION_SYSTEM.md。

## 10. Transition Language
- **Route**：一條環形線從游標位置展開成全螢幕「帶」，蓋住畫面後換頁，再沿反方向抽離。
- **Section**：以「角度儀表」連結；每個 Section 的開頭，右下角讀數跳到該 Section 的角度（Scramble 數字）。
- **Loop Back**：360° 時畫面縮成一個 `∞` 符號，再從中心展開回 Hero（第二圈為「反面」配色）。

## 11. Interaction Principles
1. **游標是一個力場**，不是一個指標：它推開粒子、吸附按鈕、扭曲圖片。
2. **速度即情緒**：捲動越快，marquee 越快、圖片扭曲越強、grain 越明顯；靜止時一切回到平靜。
3. **每個互動都有回饋**，但回饋必須在 300ms 內收斂。
4. **永遠有原生後路**：所有互動都可用鍵盤與觸控完成。
