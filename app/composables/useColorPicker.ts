export interface HSV {
  h: number  // 0-360
  s: number  // 0-1
  v: number  // 0-1
}

const MAX_RECENT = 12

const PRESET_PALETTES: string[][] = [
  ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'],
  ['#FF0000', '#FF4444', '#FF6B6B', '#FF9500', '#FFD700', '#FFFF00'],
  ['#00AA00', '#228B22', '#4ECDC4', '#00B4D8', '#0088FF', '#0000FF'],
  ['#9B5DE5', '#F15BB5', '#FF85A1', '#FFB6C1', '#8B4513', '#D2691E'],
]

export function useColorPicker() {
  const hsv = reactive<HSV>({ h: 0, s: 0, v: 0 })
  const hex = ref('#000000')
  const recentColors = ref<string[]>(loadRecent())

  function setFromHSV(newHSV: Partial<HSV>) {
    if (newHSV.h !== undefined) hsv.h = newHSV.h
    if (newHSV.s !== undefined) hsv.s = Math.max(0, Math.min(1, newHSV.s))
    if (newHSV.v !== undefined) hsv.v = Math.max(0, Math.min(1, newHSV.v))
    hex.value = hsvToHex(hsv.h, hsv.s, hsv.v)
  }

  function setFromHex(newHex: string) {
    hex.value = newHex
    const parsed = hexToHSV(newHex)
    hsv.h = parsed.h
    hsv.s = parsed.s
    hsv.v = parsed.v
  }

  function addToRecent(color: string) {
    const upper = color.toUpperCase()
    const filtered = recentColors.value.filter(c => c.toUpperCase() !== upper)
    filtered.unshift(color)
    if (filtered.length > MAX_RECENT) filtered.length = MAX_RECENT
    recentColors.value = filtered
    saveRecent(filtered)
  }

  // Render the hue bar gradient onto a canvas context
  function renderHueBar(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    for (let i = 0; i <= 360; i += 30) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`)
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  // Render the SV (saturation-value) square
  function renderSVSquare(ctx: CanvasRenderingContext2D, width: number, height: number, hue: number) {
    // White -> pure color (horizontal = saturation)
    const hGradient = ctx.createLinearGradient(0, 0, width, 0)
    hGradient.addColorStop(0, '#FFFFFF')
    hGradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`)
    ctx.fillStyle = hGradient
    ctx.fillRect(0, 0, width, height)

    // Transparent -> black (vertical = value)
    const vGradient = ctx.createLinearGradient(0, 0, 0, height)
    vGradient.addColorStop(0, 'rgba(0,0,0,0)')
    vGradient.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = vGradient
    ctx.fillRect(0, 0, width, height)
  }

  return {
    hsv,
    hex,
    recentColors,
    presetPalettes: PRESET_PALETTES,
    setFromHSV,
    setFromHex,
    addToRecent,
    renderHueBar,
    renderSVSquare,
  }
}

// --- Color conversion utilities ---

function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v)
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

function hexToHSV(hex: string): HSV {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('pc_recent_colors')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(colors: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('pc_recent_colors', JSON.stringify(colors))
  } catch {}
}
