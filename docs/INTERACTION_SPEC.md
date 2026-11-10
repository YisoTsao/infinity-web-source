# INTERACTION_SPEC — MÖBIUS

## 1. 裝置能力偵測（`useCapabilities()`）
| 旗標 | 判斷 | 影響 |
|---|---|---|
| `finePointer` | `matchMedia('(hover: hover) and (pointer: fine)')` | Custom cursor、magnetic、hover distortion |
| `reducedMotion` | `prefers-reduced-motion` + 站內開關 | 見 MOTION_SYSTEM §8 |
| `tier` | `'high' \| 'mid' \| 'low'`：依 `deviceMemory`、`hardwareConcurrency`、螢幕寬、首 60 幀平均 FPS | 粒子數、DPR、postprocessing |
| `webgl2` | 建立測試 context | 無 WebGL → 靜態 SVG 莫比烏斯 + CSS 版效果 |
`tier` 會在執行時動態降級（連續 2 秒 FPS < 45 → 降一級），不升級，避免抖動。

## 2. Custom Cursor
- 只在 `finePointer && !reducedMotion` 時掛載；**原生游標不隱藏於輸入框與文字選取區**（`cursor: auto` 例外清單）。
- 兩層：
  - **Dot**（6px，signal 色，lerp 0.18）
  - **Ring**（36px 描邊，lerp 0.08）
- 狀態（`data-cursor` 屬性驅動）：
| 狀態 | 觸發 | 外觀 |
|---|---|---|
| `default` | — | dot + ring |
| `link` | `a, button` | ring 放大至 56px，dot 消失 |
| `view` | 作品卡 | ring 變 96px 實心 bone，內含 `VIEW` Mono 字 |
| `drag` | 橫向區（桌面） | ring 內顯示 `← →` |
| `text` | 長文段落 | 變成 2×24px 直線 |
| `hidden` | WebGL 互動區 | 只剩 dot，由粒子本身回饋 |
- `mix-blend-mode: difference`，在 ink / bone 兩面都可見。
- 游標元素 `aria-hidden="true"`、`pointer-events: none`。
- 視窗失焦或游標離開文件 → 淡出。

## 3. Magnetic Elements
- 套用對象：Nav 項目、CTA、Scroll indicator、社群連結。
- 吸附半徑：按鈕尺寸 × 1.6；最大位移 = 按鈕寬 × 0.35。
- 內層文字反向位移 0.3x 產生深度。
- 結構：`<Magnetic>`（外層，rAF 控制 transform）→ `<button>`（內層，可被 GSAP 進場控制 opacity）。
- 鍵盤 focus 時**不**位移，只顯示 focus ring（2px signal outline，offset 4px）。

## 4. Hover States
| 元素 | Hover | Focus-visible |
|---|---|---|
| 文字連結 | 底線由左至右畫出（scaleX），離開時由左收回（方向感知） | 同 hover + outline |
| 作品卡 | duotone → 原色、WebGL displacement、標題 Scramble 一次 | 同 hover（無 displacement） |
| Marquee 圖片 | 該 row 減速、圖片放大 1.06 | 停止整條 marquee |
| CTA 巨字 | 字重依距離變化 | 無距離效果，整組字重 800 |

## 5. Mouse Parallax
- 只作用於「儀器層」與 Hero / CTA 的背景層；最大位移 ±12px（遠層）到 ±28px（近層）。
- 以單一 `pointermove` 寫入 `pointer.ref`（NDC），由 GSAP ticker 統一套用。

## 6. Navigation
- 固定頂部：左 `∞ INFINITY`（logo 為可動的 SVG 環，捲動時依 angle 旋轉）；右 `Work / Process / Contact / Motion: On`。
- 右下儀表：`[ 060° ]` + 當前 Section 名，可點擊打開「角度跳轉」選單（7 個 Section，點擊 `lenis.scrollTo`）。
- 捲動向下 → nav 收起（yPercent -100）；向上 → 顯示；在 Hero 永遠顯示。
- Mobile：漢堡改為圓形 `∞` 按鈕，打開全屏選單（Motion `AnimatePresence`，選項 stagger 進場），`Esc` 關閉，focus trap。

## 7. Route Transitions（App Router 實際生命週期）
App Router 沒有「離場」事件，因此採用**攔截導覽**的方式：
1. `<TransitionLink>` 攔截 click（保留 cmd/ctrl/中鍵開新分頁的原生行為）。
2. `TransitionProvider` 播放 **cover**：環形帶從游標位置展開覆蓋全螢幕（0.7s, ease.inOut）。
3. cover 完成 → `router.push(href)`；舊頁卸載時 `useGSAP` 自動 revert。
4. 監聽 `usePathname()` 改變 + 新頁 `onReady`（字體/首圖 decode）→ `lenis.scrollTo(0, {immediate})` → `ScrollTrigger.refresh()`。
5. 播放 **reveal**：帶沿反方向抽離（0.6s），新頁進場時間軸開始。
6. 瀏覽器返回鍵（popstate）：不攔截，直接播放短版 reveal（0.4s），確保不阻塞歷史導覽。
- Overlay 本身位於 root `layout.tsx`（不隨頁面卸載）。
- `template.tsx` 只用於觸發新頁 reveal，不負責 cover。
- 預先 `router.prefetch(href)` 於 hover 時執行。

## 8. Scroll Indicator
- Hero 右下：圓形環狀文字 `SCROLL TO ENTER THE LOOP · ` 旋轉（SVG textPath），中心一個向下箭頭。
- 點擊 → 平滑捲動至 S02；鍵盤可 focus。
- 開始捲動後縮小並轉為右下角度儀表。

## 9. 無障礙
- 語意結構：每個 Section 為 `<section aria-labelledby>`，標題為真實 `h2`。
- SplitText 拆字後保留 `aria-label` 為完整句子，子 span `aria-hidden`。
- Scramble 文字：螢幕閱讀器讀取最終文字（`aria-live="off"`）。
- 橫向區：鍵盤 Tab 至卡片時自動捲動至該卡位置（`focusin` → 計算對應 scrollY）。
- Canvas：`aria-hidden`，並提供文字描述（`<p class="sr-only">`）。
- 對比：所有文字 ≥ WCAG AA；signal 色不用於 bone 底文字。
- 無自動播放聲音；無每秒 > 3 次閃爍。
- Skip link：`Skip to content`、`Skip the experience`（直達作品列表與聯絡）。

## 10. 觸控
- 不攔截原生捲動手勢；Lenis 不平滑觸控。
- Hero 粒子：`touchstart` 位置產生一次漣漪（取代游標推擠）。
- 作品卡：點一下即導覽（無 hover 中間態）。
- 觸控目標 ≥ 44×44px。
