# PROJECT_SPEC — infinity web / MÖBIUS

## 1. 一句話
一個虛構創意工作室「∞ INFINITY」的實驗作品展示站：使用者沿著一條莫比烏斯環捲動 360°，在最後回到起點。

## 2. 目標與成功標準
| 目標 | 驗收方式 |
|---|---|
| 第一屏 3 秒內產生記憶點 | Hero 進場時間軸 ≤ 2.8s，首次可互動 ≤ 3.5s（桌面） |
| 使用者願意反覆捲動 | 360° 結尾無縫回到 0°，第二圈 Hero 呈現「翻面」版本 |
| 桌面接近 60 FPS | Chrome Performance 錄製，主要 Section 無 > 50ms long task |
| 手機可流暢操作 | 中階 Android（Pixel 6a 級）捲動 ≥ 50 FPS |
| CLS < 0.05 | Lighthouse / Web Vitals |
| 無障礙 | 鍵盤完整操作、reduced-motion 完整替代版、對比 AA |

## 3. 網站結構（Routes）
| Route | 內容 | 用途 |
|---|---|---|
| `/` | 7 個 Section 的完整旅程 | 主體驗 |
| `/work/[slug]` | 單一作品詳情（大圖、說明、下一件作品） | 示範 Route Transition 與 Shared Element 感受 |
| `/about` *(Phase 5 之後，可選)* | 工作室介紹 | 擴充 |

## 4. Section 旅程（捲動角度 = 敘事）
| # | 角度 | 名稱 | 底色 | 核心效果 | 指定效果編號* |
|---|---|---|---|---|---|
| 01 | 0° | **ORIGIN** Hero | ink | 粒子莫比烏斯環、巨字夾層、游標推擠、進場時間軸 | 7, 10, 5 |
| 02 | 60° | **MANIFESTO** Kinetic Intro | ink → bone（翻面） | Pinned 宣言、逐字點亮、Scramble 關鍵字 | 1, 3 |
| 03 | 120°–240° | **THE OTHER SIDE** Horizontal | bone | 橫向 Pinned 作品長廊、Clip Reveal、Shader 扭曲 | 2, 8 |
| 04 | 240° | **INSIDE THE STRIP** 3D | bone → ink | 相機沿環飛行、環 ↔ 液態球 Morph、動態光、字體夾層 | 6, 9, 7 |
| 05 | ∞ | **ENDLESS** Marquee | ink | 三層方向感知 Marquee、速度扭曲、hover 失真 | 4, 8 |
| 06 | 300° | **PROCESS** Storytelling | ink ↔ bone 分割 | Sticky 四章節、SVG Liquid Morph、字體變形 | 1, 9, 3 |
| 07 | 360° = 0° | **LOOP BACK** CTA | signal 閃現 → ink | 可變字重巨字、Magnetic CTA、回到起點轉場 | 5, 3 |

\* 指定效果：1 Sticky/Pinned、2 Horizontal、3 Kinetic Type、4 Marquee、5 Magnetic、6 3D Camera、7 Particles、8 Shader Distortion、9 Liquid Morph、10 Grain（全站）。

## 5. 內容（Placeholder）
- 作品 6 件：`Halo Index`、`Null Orchard`、`Paper Comet`、`Soft Engine`、`Tide Atlas`、`Mono Bloom`（虛構）。
- 圖片：Phase 4 先用程式生成的抽象圖（Shader / Canvas 生成，避免版權問題），之後可替換為真實作品圖。
- 文案語言：英文標題 + 繁中副文（雙語排版是視覺的一部分）。

## 6. 技術棧
| 類別 | 選擇 | 備註 |
|---|---|---|
| Framework | Next.js App Router（最新穩定版）+ React 19 + TypeScript strict | |
| Style | Tailwind CSS v4（CSS-first `@theme` tokens） | |
| Scroll | Lenis | 唯一捲動來源 |
| Scroll Animation | GSAP + ScrollTrigger + `@gsap/react`（`useGSAP`） | GSAP 3.13 起所有外掛免費 |
| Text Split | **GSAP SplitText**（取代 SplitType） | 支援 mask、autoSplit、與 GSAP 同一生命週期 |
| SVG Morph | GSAP MorphSVGPlugin | Section 06 |
| Component Motion | Motion for React | 只負責 mount/unmount、React 狀態驅動的 UI |
| 3D | three + @react-three/fiber v9 + @react-three/drei | 單一共享 Canvas |
| State | Zustand | 捲動/游標/裝置能力等跨元件狀態 |
| Lint/Format | ESLint + Prettier | |

## 7. 初始化計畫（repo 尚未建立）
```bash
npx create-next-app@latest infinity-web --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd infinity-web
npm i gsap @gsap/react lenis motion three @react-three/fiber @react-three/drei zustand
npm i -D @types/three glslify-loader raw-loader   # 或以 ?raw 匯入 .glsl
```
接著：
1. 建立 `src/` 目錄結構（見 COMPONENT_ARCHITECTURE.md）。
2. 放入 design tokens（`app/globals.css` 的 `@theme`）。
3. 用 `next/font/google` 載入 Syne、Instrument Serif、JetBrains Mono（`display: swap`、subset latin）。
4. 建立 `SmoothScrollProvider`、`MotionConfig`、`GrainOverlay`、`Cursor`、`TransitionProvider`。
5. 建立 `/dev/motion` playground 頁（只在 development 顯示），逐一驗收效果。

## 8. 開發階段
| Phase | 範圍 | 產出 | 狀態 |
|---|---|---|---|
| 1 | Creative Direction | CREATIVE_DIRECTIONS.md | ✅ |
| 2 | Architecture | 本文件 + 5 份規格 | ✅ |
| 3 | Visual Foundation | tokens、字體、grid、nav、grain、Lenis、motion utils | ⏳ 等待確認 |
| 4 | Hero Prototype | Section 01 完整可驗收 | ⏳ |
| 5 | Sections 02–07 | 依序實作，每完成一個做驗收 | ⏳ |
| 6 | Polish | 節奏、RWD、效能、無障礙 | ⏳ |

## 9. 每個 Section 的驗收清單
1. 明確視覺焦點？ 2. 獨特動畫語言？ 3. 動畫服務內容？ 4. 與其他 Section 連貫？ 5. 無過度動畫？
6. 手機版合理？ 7. 流暢？ 8. 無 ScrollTrigger / sticky 問題？ 9. 無資源洩漏（切換路由 10 次後 heap 與 trigger 數量穩定）？ 10. 符合 Art Direction？
若看起來像模板網站 → 重新設計構圖，而不是調色。
