# MOTION_SYSTEM — MÖBIUS

## 1. 核心原則
1. **Continuity**：元素沿遮罩、曲線或切線進場，不憑空 fade。
2. **One owner per property**：同一元素的同一屬性只能被一個系統控制（見 §3）。
3. **Scroll = Angle**：全站捲動進度映射為 `0°–360°`，所有 Section 讀同一個角度來源。
4. **Velocity = Energy**：捲動速度是全站共享的「能量」，驅動 marquee、扭曲、grain。
5. **Settle fast**：互動回饋 ≤ 300ms 收斂；長時間軸只存在於 scrub 中。

## 2. Motion Tokens（`src/motion/config.ts`）
```ts
export const ease = {
  loop:    'M0,0 C0.7,0 0.13,1 1,1',      // 招牌曲線：慢起、急轉、長尾（CustomEase）
  out:     'expo.out',
  inOut:   'expo.inOut',
  snap:    'back.out(1.6)',               // 只用於 magnetic 回彈
  linear:  'none',                        // scrub 一律 linear，節奏交給捲動
} as const

export const dur = { xs: 0.24, sm: 0.48, md: 0.8, lg: 1.2, xl: 1.8 } as const
export const stagger = { char: 0.018, word: 0.06, line: 0.12, item: 0.08 } as const

export const spring = {                 // Motion for React / 游標 lerp
  cursor:   { lerp: 0.18 },
  follower: { lerp: 0.08 },
  magnet:   { stiffness: 220, damping: 18, mass: 0.6 },
} as const

export const scroll = {
  lenis: { lerp: 0.09, wheelMultiplier: 1, touchMultiplier: 1.2 },
  velocityClamp: 40,                    // px/frame 上限，避免極端值
  velocityDecay: 0.92,                  // 每幀衰減
} as const

export const breakpoints = { mobile: 0, tablet: 768, laptop: 1024, desktop: 1280 } as const
```
Reduced motion：`dur` 全部乘 0、`stagger` 歸零、scrub 改為狀態切換（見 §8）。

## 3. 動畫所有權（避免衝突）
| 系統 | 負責 | 不可碰 |
|---|---|---|
| **GSAP / ScrollTrigger** | 所有 scroll-linked、pin、scrub、進場時間軸、SplitText、MorphSVG、主題翻面變數 | React 狀態驅動的 mount/unmount |
| **Motion for React** | `AnimatePresence` 的元件掛載/卸載（選單開關、Route overlay 的 DOM 存在與否）、小型 UI 狀態（toggle、tooltip） | 任何 GSAP 已動畫的元素的 `transform` |
| **CSS transition** | 只用於 `color` / `background-color` / `opacity` 的 hover，以及 focus ring | `transform` |
| **R3F `useFrame`** | Canvas 內所有 uniforms、相機、mesh | DOM |
| **rAF 游標迴圈** | Cursor / Follower / Magnetic 的 `transform` | 其他元素 |

實務規則：
- 若同一元素需要「GSAP 進場」+「Magnetic 位移」，用**兩層 DOM**：外層 GSAP、內層 magnetic。
- Motion 元件使用 `style` 以外的 `transform` 時，不得再被 GSAP 選中（以 `data-motion-owner="motion"` 標記，dev 模式下 `useGSAP` 會警告）。

## 4. Lenis × ScrollTrigger 同步
```ts
// src/motion/lenis.ts（概念）
const lenis = new Lenis({ ...scroll.lenis, autoRaf: false })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))   // 單一 rAF 來源：GSAP ticker
gsap.ticker.lagSmoothing(0)
```
- 速度/方向/進度寫入 Zustand（`useScrollStore`），但**只在 ticker 內寫 ref**，React 元件以 `subscribe` + ref 讀取，避免每幀 re-render。
- `direction: 1 | -1`、`velocity`（clamp + decay）、`progress`（0–1）、`angle`（progress × 360）。
- Reduced motion：不建立 Lenis，使用原生捲動；ScrollTrigger 仍可運作。
- 觸控裝置：Lenis `syncTouch: false`（保留原生慣性，避免 iOS 卡頓）。

### Refresh 策略
- 字體載入完成（`document.fonts.ready`）→ `ScrollTrigger.refresh()`
- 圖片/3D 首次就緒 → refresh（debounce 150ms）
- `ResizeObserver` 監聽 `<main>` 高度變化 → refresh
- 斷點切換時以 `gsap.matchMedia()` 重建（自動 revert）
- Route 切換：舊頁 `ctx.revert()` 完成後，新頁 mount 後下一幀 refresh

## 5. 全站時間軸：Loader → Hero 進場（總長 ≈ 2.8s）
| t (s) | 事件 |
|---|---|
| 0.00 | 黑屏，Mono 讀數 `000°` 開始 Scramble 累加（真實資源載入進度驅動，最快 0.9s） |
| 0.00–0.90 | 一條 1px bone 細線沿莫比烏斯 2D 投影描繪（SVG `stroke-dashoffset`） |
| 0.90 | 讀數到 `360°` → 跳回 `000°`（第一次暗示「循環」） |
| 0.90–1.60 | 細線「散成」粒子：WebGL 粒子從線條位置以 `uAssemble 0→1` 聚成 3D 環（ease.loop） |
| 1.20–2.00 | `INFINITY` 字元由遮罩下方上升，stagger.char，從中心向兩側（`from: 'center'`） |
| 1.60–2.20 | 副標 word-by-word、Serif 情緒字最後落下並微旋 -4° → 0° |
| 2.00–2.60 | Nav 各項自上方遮罩滑入；右下儀表淡入；Scroll indicator 環形文字開始旋轉 |
| 2.60–2.80 | Grain 從 0 → 正常強度；游標啟用（避免進場時誤觸） |
Session 第二次以後進站：Loader 縮短為 0.6s（sessionStorage 記錄，try/catch）。

## 6. Section Motion Timelines

### 01 ORIGIN（Hero）— 不 pin，scrub 離場
- **常態**：粒子環 `rotation.y += 0.08 * dt`；`uTime` 驅動 curl noise 微擾。
- **游標**：NDC 位置 → 粒子 shader 的 `uMouse`，半徑 0.35 內粒子沿法線推開，帶 signal 色（`uHeat`）；環整體跟隨游標傾斜 ±8°（lerp 0.06）。
- **離場**（`start: top top, end: bottom top, scrub: 0.6`）：
  - 0–0.6：`INFINITY` 左半往左、右半往右撕開（x ±30vw），字距放大
  - 0–1：粒子環 scale 1 → 2.4、相機 z 推近，粒子穿過鏡頭
  - 0.5–1：讀數 `000° → 060°`

### 02 MANIFESTO — Pinned，`end: +=250%`
宣言三句（每句一屏寬，Display 級）：
> We build things that *never* end. / Every surface is the *same* surface. / Scroll is a loop, not a line.
| progress | 動作 |
|---|---|
| 0.00–0.30 | 第一句逐字由 `opacity .12 → 1`（word scrub），未讀字保持描邊（`-webkit-text-stroke`） |
| 0.30–0.35 | 關鍵字 `never` Scramble（一次性 toggleActions，非 scrub） |
| 0.35–0.65 | 第一句 yPercent -100 遮罩上移；第二句同樣逐字點亮 |
| **0.50** | **翻面 #1**：`--bg` ink → bone（以圓形 `clip-path` 從畫面中心擴張的 bone 層完成，結束後再寫入變數並移除該層） |
| 0.65–0.95 | 第三句；`line` 字被一條水平線劃過並彎曲成 `∞`（SVG） |
| 0.95–1.00 | 讀數 `060° → 120°` |
背景：極淡的巨型 `02` Mono 數字以 0.3x 速度反向視差。

### 03 THE OTHER SIDE — Pinned 橫向，`end: () => '+=' + (track.scrollWidth - innerWidth)`
- 軌道：Intro 面板（巨字 `THE OTHER SIDE`）+ 6 張作品 + Outro 面板。
- `x: -(scrollWidth - innerWidth)`，`ease: none`，`scrub: 0.8`，`invalidateOnRefresh: true`。
- 每張卡以 `containerAnimation` 觸發：
  - 進入右側 80%：`clip-path inset(50% 50%) → inset(0)`，內圖 scale 1.3 → 1
  - 卡片標題 SplitText chars 由下而上
  - 中心區時：WebGL 圖片 duotone → 原色（`uColorMix`）
- 速度：`velocity` → 所有卡片 `skewX`（±6° clamp）與圖片 displacement 強度。
- 進度條：底部 1px 線 + Mono `N°03/06` + 角度 `120° → 240°`。
- **Mobile / reduced-motion**：取消 pin，改直向卡片堆疊，每張卡以 IntersectionObserver 觸發 reveal；無橫向溢出（`overflow-x: clip` 於 section）。

### 04 INSIDE THE STRIP — Pinned，`end: +=400%`
相機沿莫比烏斯環中心曲線（`CatmullRomCurve3`，200 點）行進，看向切線方向。
| progress | 相機 | 物件 | 光 | 字體夾層 |
|---|---|---|---|---|
| 0.00–0.15 | 從外部遠景推進至環邊 | 實體環（MeshPhysical，ink 色金屬） | 冷白主光 | `INSIDE` 在物件前 |
| 0.15–0.45 | 進入環內沿曲線前進 t 0 → 0.4 | 環表面浮現刻度與 Mono 座標貼圖 | 光源繞環移動 | `THE` 在物件後（DOM z-index 低於 Canvas 的局部遮罩） |
| 0.45–0.70 | 停在環中心拉遠 | **Liquid Morph**：`uMorph 0 → 1`，環 → 液態球（頂點在兩個位置間插值 + simplex noise 位移） | signal 色邊光（rim light）亮起 | `STRIP` 被液面折射（DOM 文字放在 shader 後的 render target，Phase 5 評估） |
| 0.70–0.90 | 環繞液態球 180° | 球被游標戳出凹陷（`uPoke`） | infra 點光源閃爍一次 | 字體逐字退場 |
| 0.90–1.00 | 拉遠 | `uMorph 1 → 0` 回到環 | | **翻面 #2**：bone → ink |
- Mobile：相機路徑縮短為 3 個關鍵點；Morph 頂點數降為 1/4；不做折射。

### 05 ENDLESS — 不 pin
- 三條 Marquee：
  - Row A：巨型字 `ENDLESS ∞ ENDLESS ∞`（Syne 800，描邊/實心交替），向左
  - Row B：作品圖片帶（WebGL 或 DOM），向右，0.7x 速度
  - Row C：Mono 小字資訊帶，向左，1.6x 速度
- 基礎速度 `base`，實際 `speed = base * dir * (1 + |velocity| * 0.08)`；捲動方向改變時 `dir` 平滑翻轉（gsap.quickTo 0.4s），不瞬間跳轉。
- 整條 row 依 velocity skewY ±3°。
- Hover 圖片：該 row 減速至 0.2x（quickTo），被 hover 的圖片 displacement + duotone 釋放。
- 實作方式見 §7-④。

### 06 PROCESS — Sticky Narrative，`end: +=400%`，左右分割
- 左（sticky）：一個 SVG 形狀依章節 MorphSVG：`Möbius 輪廓 → 圓 → 波 → ∞`；底下三層錯位的 clip 形狀做視差（0.6x / 1x / 1.4x）。
- 右：四章節（Observe / Twist / Loop / Release），每章 100vh。
- 章節切換點（0.25 / 0.5 / 0.75）：
  - 形狀 morph 0.8s（toggle，非 scrub，避免中途半形狀）
  - 章節標題由 Syne 700 → Instrument Serif Italic「字體變形」：以兩層文字交叉遮罩實現（上層 clip 往上收、下層由下展開）
  - 左右區塊底色在 ink / bone 間對調（分割線位置 scrub 移動 50% → 38% → 62% → 50%）
- Mobile：sticky 改為每章頂部一個小型 morph 圖示 + 內容，無分割。

### 07 LOOP BACK — CTA
- 巨字網格：`LET'S / MAKE IT / ∞`，每個字元獨立 span，依游標距離調整 `font-variation-settings: 'wght'` 400 ↔ 800 與 `scale` 0.92 ↔ 1.08（rAF 迴圈，只寫 transform 與 CSS 變數）。
- Magnetic CTA（`Start a loop →`）：半徑 120px 吸附，內層文字反向位移 0.3x。
- 背景：粒子環再次出現，但以**線框輪廓**呈現並緩慢呼吸。
- **最終轉場**（觸發：`progress ≥ 0.98` 且 direction = 1，或點擊 `Return to 0°`）：
  1. 0.0–0.6s：全畫面收縮成中心 `∞` 符號（SVG mask scale）
  2. 0.6s：`lenis.scrollTo(0, { immediate: true })`，ScrollTrigger 同步，Hero 時間軸重設為「反面」配色
  3. 0.6–1.4s：`∞` 中心展開，露出 bone 底色的 Hero（第二圈）
  - 防止誤觸：結尾留 40vh 的「緩衝帶」並顯示 `Keep scrolling to loop` 提示；reduced-motion 時只顯示按鈕，不自動跳轉。

## 7. 十項指定效果規格
| # | 效果 | 觸發條件 | 時間軸 | 元件 | RWD 策略 | 效能限制 |
|---|---|---|---|---|---|---|
| ① | Sticky / Pinned Storytelling | ScrollTrigger pin（S02、S04、S06） | 見 §6，`scrub: 0.6–1` | `<PinnedSection>` + `usePinnedTimeline()` | Mobile：S02 保留 pin（較短 +=150%）、S06 改非 sticky | pin 數 ≤ 4；`anticipatePin: 1`；pin 容器 `will-change` 只在 active 時 |
| ② | Horizontal Scroll Gallery | S03 pin + `x` scrub | 軌道長度動態計算 | `<HorizontalTrack>`、`<ProjectCard>` | <1024 改直向；無 overflow | 卡片只動 transform；圖片 lazy；`containerAnimation` 取代多個獨立 trigger 計算 |
| ③ | Kinetic Typography | 進場（一次性）/ scrub（宣言）/ hover（CTA） | char 0.018 / word 0.06 | `<SplitReveal>`、`<ScrambleText>`、`<KineticWord>`、`useSplitText()` | Mobile：char → word 級 split（DOM 節點減少） | SplitText `autoSplit` + `onSplit` 重建；單屏 split 字元 ≤ 400 |
| ④ | Seamless Infinite Marquee | 常駐（in-view 才跑） | `xPercent` 以 modulo wrap | `<Marquee>`、`useMarquee()` | Mobile：2 條 row、停用 hover | 內容複製至 ≥ 2× 視窗寬；用 `gsap.utils.wrap` 計算位置，**不重設 tween**，因此無跳接；離開視窗 `ticker` 暫停 |
| ⑤ | Magnetic Buttons | `pointer: fine` 且 hover 半徑內 | quickTo 0.4s，離開 `snap` 回彈 | `<Magnetic>`、`useMagnetic()` | 觸控裝置停用 | `getBoundingClientRect` 只在 enter / resize / scroll-end 快取，不在 move 中呼叫 |
| ⑥ | Scroll-controlled 3D Camera | S04 progress | 相機 t 沿曲線，`lookAt` 切線 | `<StripJourney>`、`useScrollUniform()` | Mobile：3 關鍵點路徑 | progress 以 ref 傳入 `useFrame`，不經 React state；`frameloop="demand"` 於 Canvas 不可見時 |
| ⑦ | Particle System | Hero 常駐 + 游標 | `uAssemble`、`uTime`、`uMouse` | `<ParticleMobius>`（Points + ShaderMaterial） | 桌面 40k / 平板 18k / 手機 8k | 所有運算在 vertex shader；不用 CPU 更新 position；`AdditiveBlending` + `depthWrite: false` |
| ⑧ | WebGL Shader Distortion | hover + scroll velocity | `uHover` quickTo 0.5s、`uVelocity` 每幀 | `<DistortImage>`（共享 Canvas 中的 plane，位置與 DOM 同步） | Mobile：改為 CSS duotone + clip reveal，不開 WebGL plane | 同屏 plane ≤ 8；texture 以 `next/image` 尺寸載入；離屏 plane `visible=false` |
| ⑨ | Liquid Morphing | S04 scrub（3D）、S06 toggle（SVG） | `uMorph` / MorphSVG 0.8s | `<LiquidMorph>`、`<MorphShape>` | Mobile：3D 頂點 1/4；SVG 保留 | IcosahedronGeometry detail ≤ 5（桌面）；morph target 預算一次存為 attribute |
| ⑩ | Noise / Grain Overlay | 常駐 | `steps(6)` 位移，80ms/幀 | `<GrainOverlay>` | 全裝置，手機 opacity 降低 | 預生成貼圖 + CSS 動畫（compositor 執行）；`pointer-events: none`；reduced-motion 靜止 |

## 8. Reduced Motion 策略
`prefers-reduced-motion: reduce` 或站內開關（Nav 中 `Motion: On/Off`，存 localStorage，try/catch）：
- 不啟用 Lenis、Custom Cursor、Magnetic、velocity 效果。
- Pin 全部取消；橫向改直向。
- Scrub 改為「到達即切換」的狀態（opacity 0.2s 以內的交叉淡化是唯一允許的過渡）。
- WebGL：顯示靜態一幀（render once），不自動旋轉。
- Loop Back：不自動跳轉，僅提供按鈕。
- Grain 靜止。

## 9. 清理與生命週期
- 所有 GSAP 程式碼放在 `useGSAP(() => {...}, { scope })` 內，卸載自動 `revert()`。
- 事件監聽（pointermove、resize）統一由 `src/motion/ticker.ts` 與 `useResize()` 管理，元件只註冊 callback，卸載時移除。
- R3F：geometry / material / texture 在 `useEffect` cleanup 中 `dispose()`；Canvas 常駐於 layout，不隨路由重建。
- Dev 模式顯示 debug HUD：ScrollTrigger 數量、FPS、draw calls、Lenis velocity。
