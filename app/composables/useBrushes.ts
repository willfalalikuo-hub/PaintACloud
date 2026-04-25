export type BrushType = 'pencil' | 'brush' | 'marker' | 'watercolor' | 'spray' | 'eraser'

export interface Point {
  x: number
  y: number
  pressure: number
}

export interface BrushConfig {
  type: BrushType
  size: number
  opacity: number
  color: string
}

interface BrushProfile {
  pressureSize: boolean
  pressureOpacity: boolean
  minPressure: number
  baseOpacity: number
}

const PROFILES: Record<BrushType, BrushProfile> = {
  pencil: {
    pressureSize: true,
    pressureOpacity: true,
    minPressure: 0.15,
    baseOpacity: 0.85,
  },
  brush: {
    pressureSize: true,
    pressureOpacity: true,
    minPressure: 0.1,
    baseOpacity: 1,
  },
  marker: {
    pressureSize: false,
    pressureOpacity: false,
    minPressure: 1,
    baseOpacity: 0.35,
  },
  watercolor: {
    pressureSize: true,
    pressureOpacity: true,
    minPressure: 0.2,
    baseOpacity: 0.5,
  },
  spray: {
    pressureSize: true,
    pressureOpacity: false,
    minPressure: 0.3,
    baseOpacity: 1,
  },
  eraser: {
    pressureSize: true,
    pressureOpacity: false,
    minPressure: 0.3,
    baseOpacity: 1,
  },
}

export function useBrushes() {
  const brush = reactive<BrushConfig>({
    type: 'pencil',
    size: 8,
    opacity: 1,
    color: '#222222',
  })

  function setBrushType(type: BrushType) {
    brush.type = type
    const p = PROFILES[type]
    if (type === 'marker') brush.opacity = 0.35
    else if (type === 'watercolor') brush.opacity = 0.5
    else brush.opacity = p.baseOpacity
  }

  function setSize(size: number) {
    brush.size = Math.max(1, Math.min(100, size))
  }

  function setOpacity(opacity: number) {
    brush.opacity = Math.max(0.01, Math.min(1, opacity))
  }

  function setColor(color: string) {
    brush.color = color
  }

  function getProfile(): BrushProfile {
    return PROFILES[brush.type]
  }

  function clampPressure(pressure: number): number {
    return Math.max(PROFILES[brush.type].minPressure, Math.min(1, pressure))
  }

  // --- Main segment rendering ---

  function renderStrokeSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    switch (brush.type) {
      case 'spray':
        renderSpraySegment(ctx, from, to)
        break
      case 'brush':
      case 'watercolor':
        renderSoftSegment(ctx, from, to)
        break
      case 'pencil':
        renderPencilSegment(ctx, from, to)
        break
      case 'marker':
        renderMarkerSegment(ctx, from, to)
        break
      default:
        renderLineSegment(ctx, from, to)
        break
    }
  }

  // --- Pencil: stamp-based with stochastic gaps (no temp canvas needed) ---

  function renderPencilSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const profile = PROFILES.pencil
    const pAvg = (clampPressure(from.pressure) + clampPressure(to.pressure)) / 2
    const width = brush.size * (0.3 + pAvg * 0.7)
    const baseAlpha = profile.baseOpacity * pAvg * brush.opacity
    const radius = width * 0.5

    // Stamp grid: fill the brush circle at 'to' with random dots
    // Each dot has a random chance to be skipped -> natural paper texture
    // Overlapping strokes fill in more dots -> builds up to solid
    const dotSpacing = 1.0
    const cols = Math.ceil(width / dotSpacing)
    const rows = Math.ceil(width / dotSpacing)
    const skipRate = 0.55 - pAvg * 0.3 // lighter pressure = more gaps

    ctx.save()
    ctx.fillStyle = brush.color

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Grid position with jitter
        const gx = to.x - radius + (c + 0.5) * dotSpacing
        const gy = to.y - radius + (r + 0.5) * dotSpacing
        const jx = gx + (Math.random() - 0.5) * dotSpacing * 0.6
        const jy = gy + (Math.random() - 0.5) * dotSpacing * 0.6

        // Only draw inside the brush circle
        const dx = jx - to.x
        const dy = jy - to.y
        const distSq = dx * dx + dy * dy
        if (distSq > radius * radius) continue

        // Stochastic skip: lighter pressure & edge = more likely to skip
        const edgeFactor = Math.sqrt(distSq) / radius
        const localSkip = skipRate + edgeFactor * 0.25
        if (Math.random() < localSkip) continue

        ctx.globalAlpha = baseAlpha * (0.3 + Math.random() * 0.7)
        const dotSize = 0.4 + Math.random() * 0.6
        ctx.beginPath()
        ctx.arc(jx, jy, dotSize, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }

  // --- Marker: flat chisel-tip stamp ---

  function renderMarkerSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const profile = PROFILES.marker
    const alpha = profile.baseOpacity * brush.opacity
    const w = brush.size     // width of chisel (perpendicular to stroke)
    const h = Math.max(2, w * 0.25) // thickness of chisel (along stroke)

    // Stroke direction angle
    const dx = to.x - from.x
    const dy = to.y - from.y
    const angle = Math.atan2(dy, dx)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = brush.color

    ctx.translate(to.x, to.y)
    ctx.rotate(angle)
    // Flat rectangle centered at (0,0)
    ctx.fillRect(-h / 2, -w / 2, h, w)

    ctx.restore()
  }

  function renderLineSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const pFrom = clampPressure(from.pressure)
    const pTo = clampPressure(to.pressure)
    const pAvg = (pFrom + pTo) / 2
    const profile = PROFILES[brush.type]

    const width = profile.pressureSize
      ? brush.size * (0.3 + pAvg * 0.7)
      : brush.size

    const alpha = profile.pressureOpacity
      ? profile.baseOpacity * pAvg * brush.opacity
      : profile.baseOpacity * brush.opacity

    ctx.save()
    ctx.globalAlpha = alpha

    if (brush.type === 'eraser') {
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    } else {
      ctx.strokeStyle = brush.color
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  // --- Soft brush: brush, watercolor (stamp-based, engine guarantees tight spacing) ---

  function renderSoftSegment(
    ctx: CanvasRenderingContext2D,
    from: Point,
    to: Point,
  ) {
    const pAvg = (clampPressure(from.pressure) + clampPressure(to.pressure)) / 2
    stampSoft(ctx, to.x, to.y, pAvg)
  }

  function stampSoft(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    pressure: number,
  ) {
    const profile = PROFILES[brush.type]
    const p = clampPressure(pressure)

    const radius = (profile.pressureSize
      ? brush.size * (0.3 + p * 0.7)
      : brush.size) / 2

    if (radius <= 0) return

    const stampOpacity = profile.pressureOpacity
      ? profile.baseOpacity * p
      : profile.baseOpacity
    const actualOpacity = stampOpacity * brush.opacity

    ctx.save()
    ctx.globalAlpha = actualOpacity

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    const c = brush.color

    if (brush.type === 'watercolor') {
      gradient.addColorStop(0, hexToRgba(c, 0.7))
      gradient.addColorStop(0.3, hexToRgba(c, 0.35))
      gradient.addColorStop(0.7, hexToRgba(c, 0.1))
      gradient.addColorStop(1, hexToRgba(c, 0))
    } else {
      gradient.addColorStop(0, c)
      gradient.addColorStop(0.5, c)
      gradient.addColorStop(1, hexToRgba(c, 0))
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // --- Spray (engine guarantees tight spacing, just stamp at target) ---

  function renderSpraySegment(
    ctx: CanvasRenderingContext2D,
    _from: Point,
    to: Point,
  ) {
    const p = clampPressure(to.pressure)
    const radius = brush.size * (0.3 + p * 0.7) / 2
    const count = Math.max(3, Math.floor(radius * p * 1.5))

    ctx.save()
    ctx.fillStyle = brush.color

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const d = Math.random() * radius
      ctx.globalAlpha = Math.random() * 0.25 * brush.opacity
      ctx.beginPath()
      ctx.arc(
        to.x + Math.cos(angle) * d,
        to.y + Math.sin(angle) * d,
        Math.random() * 1.2 + 0.2, 0, Math.PI * 2,
      )
      ctx.fill()
    }

    ctx.restore()
  }

  return {
    brush,
    setBrushType,
    setSize,
    setOpacity,
    setColor,
    getProfile,
    clampPressure,
    stampSoft,
    renderStrokeSegment,
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
