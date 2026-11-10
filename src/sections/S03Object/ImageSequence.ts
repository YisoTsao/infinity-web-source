/**
 * Apple-style image sequence player: preloads frames progressively,
 * draws the nearest *loaded* frame with object-fit: cover math.
 */
export class ImageSequence {
  frames: HTMLImageElement[] = []
  loaded: boolean[] = []
  private ctx: CanvasRenderingContext2D
  private current = -1
  private started = false

  constructor(
    private canvas: HTMLCanvasElement,
    private urls: string[],
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.frames = urls.map(() => new Image())
    this.loaded = urls.map(() => false)
  }

  private load(i: number) {
    return new Promise<void>((res) => {
      const img = this.frames[i]
      img.decoding = 'async'
      img.onload = () => {
        this.loaded[i] = true
        res()
      }
      img.onerror = () => res()
      img.src = this.urls[i]
    })
  }

  /** first frame immediately, then every 8th, then the rest (fast coarse → fine scrubbing). */
  async start() {
    if (this.started) return
    this.started = true
    await this.load(0)
    this.resize()
    const order: number[] = []
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < this.urls.length; i += step) if (!order.includes(i)) order.push(i)
    for (let k = 0; k < order.length; k += 6) await Promise.all(order.slice(k, k + 6).map((i) => (this.loaded[i] ? null : this.load(i))))
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { clientWidth: w, clientHeight: h } = this.canvas
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    const c = this.current
    this.current = -1
    this.draw(Math.max(0, c))
  }

  draw(index: number) {
    let i = Math.max(0, Math.min(this.urls.length - 1, Math.round(index)))
    if (!this.loaded[i]) {
      // nearest loaded neighbour
      let d = 1
      while (d < this.urls.length && !this.loaded[i - d] && !this.loaded[i + d]) d++
      i = this.loaded[i - d] ? i - d : i + d
      if (!this.loaded[i]) return
    }
    if (i === this.current) return
    this.current = i
    const img = this.frames[i]
    const cw = this.canvas.width
    const ch = this.canvas.height
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    this.ctx.fillStyle = '#0B0B0D'
    this.ctx.fillRect(0, 0, cw, ch)
    this.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
  }
}
