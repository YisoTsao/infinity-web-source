# COMPONENT_ARCHITECTURE — MÖBIUS

## 1. 目錄結構
```
src/
├─ app/
│  ├─ layout.tsx               # fonts、Providers、常駐層（Canvas / Grain / Cursor / TransitionOverlay / Nav）
│  ├─ template.tsx             # 新頁 reveal 觸發
│  ├─ page.tsx                 # 首頁：組合 7 個 Section
│  ├─ work/[slug]/page.tsx     # 作品詳情
│  ├─ dev/motion/page.tsx      # 效果 playground（僅 development）
│  └─ globals.css              # Tailwind v4 @theme tokens、語意色變數、grain keyframes
│
├─ providers/
│  ├─ AppProviders.tsx         # 組合下列 providers（client）
│  ├─ SmoothScrollProvider.tsx # Lenis + ScrollTrigger 同步、refresh 策略
│  ├─ CapabilitiesProvider.tsx # finePointer / reducedMotion / tier / webgl2
│  └─ TransitionProvider.tsx   # 導覽攔截、cover/reveal 狀態機
│
├─ motion/                     # 與 React 無關或極薄的動畫核心
│  ├─ config.ts                # tokens（ease/dur/stagger/spring/breakpoints）
│  ├─ gsap.ts                  # registerPlugin（ScrollTrigger, SplitText, MorphSVG, CustomEase）一次性註冊
│  ├─ lenis.ts                 # 建立/銷毀 Lenis 實例
│  ├─ ticker.ts                # 單一 rAF（gsap.ticker）訂閱中心
│  ├─ pointer.ts               # 全域 pointer ref（px + NDC + velocity）
│  └─ theme.ts                 # flipTheme(to)：寫入 --bg/--fg/--muted
│
├─ hooks/
│  ├─ useSplitText.ts          # SplitText + autoSplit + 清理
│  ├─ usePinnedTimeline.ts     # 建立 pin + scrub timeline，回傳 tl，matchMedia 變體
│  ├─ useScrollVelocity.ts     # 讀 store ref（不 re-render）
│  ├─ useMagnetic.ts
│  ├─ useMarquee.ts
│  ├─ useScrollUniform.ts      # 將 ScrollTrigger progress 寫入 R3F uniform ref
│  ├─ useDomPlane.ts           # DOM rect → WebGL plane 位置同步
│  └─ useResize.ts
│
├─ stores/
│  ├─ scroll.ts                # Zustand：progress / angle / velocity / direction / activeSection
│  └─ ui.ts                    # menuOpen / cursorState / motionEnabled / loopCount
│
├─ components/
│  ├─ layout/                  # Nav, AngleMeter, MobileMenu, SkipLinks, Footer
│  ├─ cursor/                  # Cursor, CursorTarget
│  ├─ overlay/                 # GrainOverlay, TransitionOverlay, Loader
│  ├─ motion/                  # 可重用動畫元件
│  │  ├─ SplitReveal.tsx       # mask + chars/words/lines 進場
│  │  ├─ ScrambleText.tsx
│  │  ├─ KineticWord.tsx       # 可變字重/游標距離
│  │  ├─ Magnetic.tsx
│  │  ├─ Marquee.tsx
│  │  ├─ ClipReveal.tsx
│  │  ├─ PinnedSection.tsx
│  │  ├─ HorizontalTrack.tsx
│  │  ├─ MorphShape.tsx
│  │  └─ TransitionLink.tsx
│  └─ ui/                      # 刻度框 Frame、MonoLabel、Button
│
├─ gl/                         # 所有 WebGL（client only，dynamic import）
│  ├─ Scene.tsx                # 共享 <Canvas>，依 activeSection 掛載子場景
│  ├─ View.tsx                 # drei <View> 包裝：將 3D 綁定到 DOM 區塊
│  ├─ particles/ParticleMobius.tsx + shaders/
│  ├─ strip/StripJourney.tsx   # S04 相機路徑 + LiquidMorph
│  ├─ strip/LiquidMorph.tsx + shaders/
│  ├─ image/DistortImage.tsx + shaders/
│  ├─ geometry/mobius.ts       # 參數方程（u, v）→ position/normal/tangent；中心曲線
│  └─ utils/quality.ts         # 依 tier 回傳粒子數、DPR、detail
│
├─ sections/
│  ├─ S01Origin/               # index.tsx + timeline.ts + Origin.module.css(必要時)
│  ├─ S02Manifesto/
│  ├─ S03OtherSide/
│  ├─ S04InsideStrip/
│  ├─ S05Endless/
│  ├─ S06Process/
│  └─ S07LoopBack/
│
├─ content/                    # projects.ts、manifesto.ts（型別化內容）
└─ lib/                        # math（lerp/clamp/map/wrap）、dom、env
```

## 2. 常駐層（`layout.tsx`）
```
<html data-theme="ink">
  <body>
    <AppProviders>
      <SkipLinks/>
      <Nav/> <AngleMeter/>
      <GLScene/>            // dynamic(() => import('@/gl/Scene'), { ssr: false })，fixed 全屏、z-0
      <main id="content">{children}</main>   // z-10
      <GrainOverlay/>       // z-40
      <TransitionOverlay/>  // z-50
      <Cursor/>             // z-60，僅 finePointer
      <Loader/>             // z-70，只在首次進站
    </AppProviders>
```

## 3. 共享 Canvas 策略
- **只有一個 `<Canvas>`**（避免多 WebGL context 與重複 GPU 資源）。
- 使用 drei `<View>` + `View.Port`：每個 Section 的 DOM 中放一個 `<View track={ref}>`，3D 內容只在該區塊可見時渲染（scissor）。
- `DistortImage` 的 plane 位置由 `useDomPlane` 根據 DOM rect 同步（rect 在 resize / ScrollTrigger refresh 時快取，每幀只加上 scroll offset）。
- Canvas `dpr={[1, quality.maxDpr]}`、`gl={{ antialias: tier==='high', powerPreference: 'high-performance' }}`。
- 頁面不可見（`visibilitychange`）或無 active View → `frameloop='never'`。

## 4. 元件 API 範例
```tsx
<SplitReveal as="h2" split="chars" trigger="enter" from="center">THE OTHER SIDE</SplitReveal>
<SplitReveal as="p"  split="words" trigger="scrub" start="top 70%" end="bottom 40%">…</SplitReveal>

<PinnedSection id="manifesto" length="250%" theme={{ at: 0.5, to: 'bone' }}>
  {(tl) => /* 在 tl 上加 tweens */}
</PinnedSection>

<HorizontalTrack mobile="stack" progress={<TrackProgress from={120} to={240} />}>
  {projects.map(p => <ProjectCard key={p.slug} {...p} />)}
</HorizontalTrack>

<Marquee speed={60} direction={-1} velocityFactor={0.08} hoverSlow={0.2}>…</Marquee>

<Magnetic strength={0.35}><Button>Start a loop →</Button></Magnetic>
```

## 5. 資料流
```
Lenis ──scroll──▶ ScrollTrigger.update
   │
   └─ gsap.ticker ─▶ scrollStore.ref（progress/velocity/dir/angle）
                        ├─▶ Marquee / skew（直接讀 ref）
                        ├─▶ GL uniforms（useFrame 讀 ref）
                        └─▶ AngleMeter（每 100ms 節流寫入 React state）
pointer.ts ─▶ pointer.ref ─▶ Cursor / Magnetic / Parallax / GL uMouse
```
規則：**每幀變動的值永遠走 ref，不走 React state。** React state 只用於低頻 UI（選單、active section 名稱）。

## 6. Server / Client 邊界
- Section 的文字內容與結構為 Server Component 產出的 HTML（SEO、首屏可見），動畫部分以 `"use client"` 的小型包裝元件注入。
- `gl/` 全部 `ssr: false` dynamic import；首屏 SSR 顯示靜態 SVG 莫比烏斯作為佔位（同尺寸，避免 CLS）。
- GSAP 外掛只在 client 註冊（`motion/gsap.ts` 有 `typeof window` 防護）。

## 7. 程式碼規範
- 每個 Section 的時間軸寫在 `timeline.ts`，輸出 `build(tl, refs, ctx)` 純函式，方便在 `/dev/motion` 單獨測試。
- 所有魔術數字從 `motion/config.ts` 或 Section 內的 `const TIMING = {…}` 取得。
- Shader 放 `.glsl` 檔，以 `?raw` 匯入；共用函式（simplex noise、curl）放 `gl/shaders/chunks/`。
- 新增動畫前檢查 §3（MOTION_SYSTEM）所有權表。
