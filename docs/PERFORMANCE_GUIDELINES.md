# PERFORMANCE_GUIDELINES — MÖBIUS

## 1. 目標預算
| 指標 | 桌面 | 手機（中階） |
|---|---|---|
| FPS（捲動中） | ≥ 58 | ≥ 50 |
| LCP | < 2.0s | < 2.8s |
| CLS | < 0.05 | < 0.05 |
| INP | < 150ms | < 200ms |
| 首屏 JS（gzip） | < 180KB（不含 GL chunk） | 同左 |
| GL chunk（three + r3f + drei 子集） | lazy，< 260KB gzip | 同左 |
| Draw calls（任一時刻） | < 40 | < 20 |
| 同時 ScrollTrigger 數 | < 60 | < 30 |
| GPU 記憶體（貼圖） | < 120MB | < 48MB |

## 2. 品質分級（`gl/utils/quality.ts`）
| 項目 | high | mid | low |
|---|---|---|---|
| 最大 DPR | 2 | 1.5 | 1 |
| Hero 粒子數 | 40,000 | 18,000 | 8,000 |
| Liquid Morph detail | 5 | 4 | 3 |
| 相機路徑 | 完整 200 點 | 完整 | 3 關鍵點 |
| Shader 圖片 plane | WebGL | WebGL（S03 only） | CSS 替代 |
| Postprocessing | 無（grain 走 CSS） | 無 | 無 |
| Antialias | on | off | off |
無 WebGL → 靜態 SVG + CSS 版本；網站完整可用。

## 3. 動畫效能規則
- 只動 `transform` 與 `opacity`；`clip-path` 僅用於 reveal（短時、非每幀持續）。
- `filter`、`box-shadow`、`width/height/top/left` 禁止動畫。
- `font-variation-settings`（CTA 字重）：限 S07、字元數 ≤ 24、只在 in-view 時更新。
- `will-change: transform` 只在 pin active / hover 期間加上，結束後移除。
- 讀寫分離：layout 讀取（rect）只在 resize / refresh 時批次進行；rAF 中只寫。
- 單一 rAF：所有每幀邏輯掛在 `gsap.ticker`（含 Lenis、游標、marquee），R3F 用自己的 loop 但可設為 `frameloop="demand"` 由 ticker `invalidate()`。
- Scroll 事件不直接綁定處理器；一律透過 Lenis `scroll` 回呼或 ScrollTrigger。
- 離開視窗的動畫暫停（ScrollTrigger `toggleActions` / IntersectionObserver）。

## 4. WebGL
- 單一 Canvas、單一 renderer；geometry 與 texture 共用、用完 `dispose()`。
- 粒子位置一次寫入 `BufferAttribute`，動態全部在 vertex shader（`uTime`、`uMouse`、`uAssemble`）。
- Morph 目標頂點預先計算為第二組 attribute，不在 CPU 插值。
- Texture：KTX2 / WebP，最大 2048px，`generateMipmaps` 依需要；作品圖以 DOM 圖片相同尺寸載入。
- Shader 精度：fragment 使用 `mediump`（手機），需要時才 `highp`。
- GL chunk 在 Hero 靜態 SVG 繪製後以 `requestIdleCallback`（fallback `setTimeout`）預載。

## 5. 資源
- **字體**：`next/font/google` 自託管；Syne 可變字重 subset latin；Instrument Serif 只載 italic；JetBrains Mono 只載 500。`display: swap` + `adjustFontFallback` 避免 CLS。中文使用系統字體，不載 webfont。
- **圖片**：`next/image`，AVIF/WebP，`sizes` 精確設定；首屏以外 lazy；橫向區圖片在進入前一張卡時預載。
- **Dynamic imports**：`gl/*`、`MorphSVG` 相關元件、`/dev` 頁。
- 無第三方追蹤腳本於首屏。

## 6. 記憶體與清理
- `useGSAP` scope 自動 revert；SplitText 以 `revert()` 還原 DOM。
- 檢查方式：路由往返 10 次，`ScrollTrigger.getAll().length` 回到相同數字；Heap snapshot 無 detached DOM 累積；`renderer.info.memory` geometry / textures 數穩定。
- 事件監聽一律有對應移除；`ResizeObserver`、`IntersectionObserver` 在 cleanup 中 `disconnect()`。

## 7. RWD 動畫策略總表
| 能力 | Desktop | Laptop | Tablet | Mobile |
|---|---|---|---|---|
| Lenis 平滑 | ✅ | ✅ | ✅（wheel only） | ❌ 原生 |
| Custom Cursor / Magnetic | ✅ | ✅ | 依 pointer | ❌ |
| Mouse parallax | 完整 | 完整 | ❌ | ❌（陀螺儀不使用，避免權限提示） |
| S02 Pinned | +=250% | +=250% | +=200% | +=150% |
| S03 橫向 | Pin 橫向 | Pin 橫向 | 直向堆疊 | 直向堆疊 |
| S04 3D 相機 | 完整 | 完整 | 簡化 | 3 關鍵點 |
| S06 Sticky | 左右分割 | 左右分割 | 上下 | 非 sticky |
| SplitText 粒度 | chars | chars | words | words |
| Marquee rows | 3 | 3 | 3 | 2 |

## 8. 量測流程（Phase 6，每個 Section 完成時也做一次精簡版）
1. Chrome DevTools Performance（CPU 4x throttle）錄製完整捲動一圈，檢查 long task 與 layout shift。
2. Lighthouse mobile 模式：LCP / CLS / TBT。
3. Playwright 腳本：固定速度自動捲動 + `requestAnimationFrame` 記錄幀時間，輸出 p95 frame time。
4. `stats-gl` / `r3f-perf`（dev only）檢查 draw calls、GPU 時間。
5. 裝置實測：iPhone（Safari）、中階 Android（Chrome）、MacBook（Safari + Chrome）、Windows 高刷新螢幕。
6. Reduced motion 模式完整走一遍。
