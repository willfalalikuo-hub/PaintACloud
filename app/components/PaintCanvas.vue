<template>
  <div class="w-full h-full relative bg-neutral-800">
    <!-- Canvas container -->
    <div ref="containerRef" class="w-full h-full"></div>

    <!-- Brush cursor preview -->
    <div
      v-if="cursorVisible && brushes.brush.type !== 'eraser'"
      class="pointer-events-none fixed z-30 rounded-full border-2 border-white/50"
      :style="{
        width: brushCursorSize + 'px',
        height: brushCursorSize + 'px',
        left: cursorX - brushCursorSize / 2 + 'px',
        top: cursorY - brushCursorSize / 2 + 'px',
        mixBlendMode: 'difference',
      }"
    ></div>
    <!-- Eraser cursor -->
    <div
      v-if="cursorVisible && brushes.brush.type === 'eraser'"
      class="pointer-events-none fixed z-30 rounded-full border-2 border-gray-400/60"
      :style="{
        width: brushCursorSize + 'px',
        height: brushCursorSize + 'px',
        left: cursorX - brushCursorSize / 2 + 'px',
        top: cursorY - brushCursorSize / 2 + 'px',
      }"
    ></div>

    <!-- Clear canvas confirm dialog -->
    <Teleport to="body">
      <div v-if="showClearConfirm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click.self="showClearConfirm = false">
        <div class="bg-gray-800 rounded-2xl p-5 w-full max-w-xs text-center">
          <h3 class="text-white font-bold mb-2">清空画布</h3>
          <p class="text-gray-400 text-sm mb-5">确定要清空画布吗？此操作可以撤销。</p>
          <div class="flex gap-3">
            <button @click="showClearConfirm = false" class="flex-1 py-2 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors">
              取消
            </button>
            <button @click="confirmClear" class="flex-1 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">
              清空
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Mobile bottom toolbar -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 z-40">
      <!-- Color panel (expandable) -->
      <div v-if="showColorPanel" class="bg-gray-900 border-t border-gray-700 p-3">
        <!-- SV Square -->
        <div class="relative mb-2">
          <canvas ref="svCanvasRef" class="w-full rounded-lg cursor-crosshair" style="height: 140px"
            @pointerdown="onSVDown" @pointermove="onSVMove" @pointerup="onSVUp" />
          <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            :style="{ left: svCursorX - 8 + 'px', top: svCursorY - 8 + 'px', backgroundColor: colorPicker.hex.value }"></div>
        </div>
        <!-- Hue bar -->
        <div class="relative mb-2">
          <canvas ref="hueCanvasRef" class="w-full rounded cursor-crosshair" style="height: 20px"
            @pointerdown="onHueDown" @pointermove="onHueMove" @pointerup="onHueUp" />
          <div class="absolute w-1 h-5 bg-white rounded-full shadow-md pointer-events-none border border-gray-300"
            :style="{ left: hueCursorX - 2 + 'px', top: '-2px' }"></div>
        </div>
        <!-- Recent + presets -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <div class="w-7 h-7 rounded-full border-2 border-white shadow-sm shrink-0" :style="{ backgroundColor: colorPicker.hex.value }"></div>
          <div v-for="c in colorPicker.recentColors.value" :key="c"
            class="w-5 h-5 rounded-full cursor-pointer border border-gray-600 hover:border-white transition-colors"
            :style="{ backgroundColor: c }" @click="selectColor(c)"></div>
        </div>
        <div class="flex gap-1 mt-2">
          <div v-for="(palette, pi) in colorPicker.presetPalettes" :key="pi" class="flex gap-0.5">
            <div v-for="c in palette" :key="c"
              class="w-4 h-4 rounded-sm cursor-pointer hover:scale-125 transition-transform"
              :style="{ backgroundColor: c }" @click="selectColor(c)"></div>
          </div>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="bg-gray-900/95 backdrop-blur border-t border-gray-700 px-2 py-2 flex items-center gap-1 overflow-x-auto">
        <!-- Brush type buttons -->
        <button v-for="bt in brushTypes" :key="bt.type"
          @click="brushes.setBrushType(bt.type)"
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
          :class="brushes.brush.type === bt.type ? 'bg-coral text-white' : 'bg-gray-800 text-gray-400 hover:text-white'">
          <component :is="bt.icon" />
        </button>

        <div class="w-px h-6 bg-gray-700 mx-1 shrink-0"></div>

        <!-- Size slider -->
        <div class="flex items-center gap-1 flex-1 min-w-[80px]">
          <span class="text-[10px] text-gray-500 w-4 text-right shrink-0">{{ brushes.brush.size }}</span>
          <input type="range" min="1" max="80" :value="brushes.brush.size"
            @input="brushes.setSize(+$event.target.value)"
            class="flex-1 h-1 accent-coral" />
        </div>

        <div class="w-px h-6 bg-gray-700 mx-1 shrink-0"></div>

        <!-- Color button -->
        <button @click="showColorPanel = !showColorPanel"
          class="w-8 h-8 rounded-full border-2 border-gray-500 shrink-0 shadow-sm"
          :style="{ backgroundColor: colorPicker.hex.value }">
        </button>

        <div class="w-px h-6 bg-gray-700 mx-1 shrink-0"></div>

        <!-- Undo/Redo -->
        <button @click="doUndo" class="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center shrink-0" :class="{ 'opacity-30': !engine.canUndo() }">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4"/></svg>
        </button>
        <button @click="doRedo" class="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center shrink-0" :class="{ 'opacity-30': !engine.canRedo() }">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4"/></svg>
        </button>
      </div>
    </div>

    <!-- Desktop right sidebar -->
    <div class="hidden md:flex flex-col absolute top-0 right-0 bottom-0 w-56 bg-gray-900/95 backdrop-blur border-l border-gray-700 z-20 p-3 gap-3 overflow-y-auto">
      <!-- Brush type -->
      <div>
        <h3 class="text-xs text-gray-500 mb-2 font-medium">笔刷</h3>
        <div class="grid grid-cols-3 gap-1">
          <button v-for="bt in brushTypes" :key="bt.type"
            @click="brushes.setBrushType(bt.type)"
            class="py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-colors"
            :class="brushes.brush.type === bt.type ? 'bg-coral/20 text-coral' : 'bg-gray-800 text-gray-400 hover:text-white'">
            <component :is="bt.icon" />
            <span class="text-[9px] leading-tight">{{ bt.label }}</span>
          </button>
        </div>
      </div>

      <!-- Size -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs text-gray-500 font-medium">大小</h3>
          <span class="text-xs text-gray-400">{{ brushes.brush.size }}px</span>
        </div>
        <input type="range" min="1" max="80" :value="brushes.brush.size"
          @input="brushes.setSize(+$event.target.value)"
          class="w-full h-1.5 accent-coral" />
      </div>

      <!-- Opacity -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs text-gray-500 font-medium">不透明度</h3>
          <span class="text-xs text-gray-400">{{ Math.round(brushes.brush.opacity * 100) }}%</span>
        </div>
        <input type="range" min="5" max="100" :value="Math.round(brushes.brush.opacity * 100)"
          @input="brushes.setOpacity(+$event.target.value / 100)"
          class="w-full h-1.5 accent-coral" />
      </div>

      <!-- Color picker -->
      <div>
        <h3 class="text-xs text-gray-500 mb-1.5 font-medium">颜色</h3>
        <!-- SV Square -->
        <div class="relative mb-2">
          <canvas ref="svCanvasRef" class="w-full rounded-lg cursor-crosshair" style="height: 120px"
            @pointerdown="onSVDown" @pointermove="onSVMove" @pointerup="onSVUp" />
          <div class="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none"
            :style="{ left: svCursorX - 7 + 'px', top: svCursorY - 7 + 'px', backgroundColor: colorPicker.hex.value }"></div>
        </div>
        <!-- Hue bar -->
        <div class="relative mb-2">
          <canvas ref="hueCanvasRef" class="w-full rounded cursor-crosshair" style="height: 14px"
            @pointerdown="onHueDown" @pointermove="onHueMove" @pointerup="onHueUp" />
          <div class="absolute w-1 h-4 bg-white rounded-full shadow-md pointer-events-none border border-gray-300"
            :style="{ left: hueCursorX - 2 + 'px', top: '-2px' }"></div>
        </div>
        <!-- Current + recent -->
        <div class="flex items-center gap-1.5 flex-wrap mb-2">
          <div class="w-6 h-6 rounded-full border-2 border-white shadow-sm shrink-0" :style="{ backgroundColor: colorPicker.hex.value }"></div>
          <div v-for="c in colorPicker.recentColors.value" :key="c"
            class="w-4 h-4 rounded-full cursor-pointer border border-gray-600 hover:border-white transition-colors"
            :style="{ backgroundColor: c }" @click="selectColor(c)"></div>
        </div>
        <!-- Presets -->
        <div class="space-y-0.5">
          <div v-for="(palette, pi) in colorPicker.presetPalettes" :key="pi" class="flex gap-0.5">
            <div v-for="c in palette" :key="c"
              class="flex-1 h-4 rounded-sm cursor-pointer hover:scale-110 transition-transform"
              :style="{ backgroundColor: c }" @click="selectColor(c)"></div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-auto space-y-1.5">
        <div class="flex gap-1.5">
          <button @click="doUndo" class="flex-1 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs transition-colors" :class="{ 'opacity-30': !engine.canUndo() }">
            撤销
          </button>
          <button @click="doRedo" class="flex-1 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs transition-colors" :class="{ 'opacity-30': !engine.canRedo() }">
            重做
          </button>
        </div>
        <button @click="engine.resetView()" class="w-full py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white text-xs transition-colors">
          重置视图
        </button>
        <button @click="showClearConfirm = true" class="w-full py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 text-xs transition-colors">
          清空画布
        </button>
      </div>

      <!-- Zoom indicator -->
      <div class="text-center text-[10px] text-gray-600">
        {{ Math.round(engine.zoom.value * 100) }}% | 滚轮缩放 | Space+拖拽平移
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBrushes } from '~/composables/useBrushes'
import { useColorPicker } from '~/composables/useColorPicker'
import { usePaintEngine } from '~/composables/usePaintEngine'

const containerRef = ref<HTMLDivElement>()
const svCanvasRef = ref<HTMLCanvasElement>()
const hueCanvasRef = ref<HTMLCanvasElement>()

const brushes = useBrushes()
const colorPicker = useColorPicker()
const engine = usePaintEngine()

const showColorPanel = ref(false)
const showClearConfirm = ref(false)
const cursorVisible = ref(false)
const cursorX = ref(0)
const cursorY = ref(0)

// Sync color picker to brush
watch(() => colorPicker.hex.value, (c) => {
  brushes.setColor(c)
})

// Brush cursor
const brushCursorSize = computed(() => brushes.brush.size * engine.zoom.value)

// SV/Hue cursor positions
const svCursorX = computed(() => colorPicker.hsv.s * (svCanvasRef.value?.clientWidth || 200))
const svCursorY = computed(() => (1 - colorPicker.hsv.v) * (svCanvasRef.value?.clientHeight || 140))
const hueCursorX = computed(() => (colorPicker.hsv.h / 360) * (hueCanvasRef.value?.clientWidth || 200))

// --- SVG icon helper ---
function svgIcon(paths: string[]) {
  return {
    render() {
      return h('svg', { xmlns: 'http://www.w3.org/2000/svg', class: 'w-4 h-4', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
        paths.map(d => h('path', { d })))
    }
  }
}

const brushTypes = [
  { type: 'pencil' as const, label: '铅笔', icon: svgIcon(['M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z']) },
  { type: 'brush' as const, label: '画笔', icon: svgIcon(['M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01']) },
  { type: 'marker' as const, label: '马克笔', icon: svgIcon(['M4 20h16M6 16l2-12h8l2 12M9 4v12M15 4v12']) },
  { type: 'watercolor' as const, label: '水彩', icon: svgIcon(['M12 2.69l5.66 5.66a8 8 0 11-11.31 0z']) },
  { type: 'spray' as const, label: '喷枪', icon: svgIcon(['M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707']) },
  { type: 'eraser' as const, label: '橡皮', icon: svgIcon(['M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0l5 5c.8.8.8 2 0 2.8L11 20']) },
]

// --- Color picker interaction ---

let svDragging = false
let hueDragging = false

function onSVDown(e: PointerEvent) {
  svDragging = true
  updateSV(e)
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function onSVMove(e: PointerEvent) {
  if (svDragging) updateSV(e)
}
function onSVUp() {
  if (svDragging) {
    svDragging = false
    colorPicker.addToRecent(colorPicker.hex.value)
  }
}

function updateSV(e: PointerEvent) {
  const canvas = svCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
  colorPicker.setFromHSV({ s, v })
}

function onHueDown(e: PointerEvent) {
  hueDragging = true
  updateHue(e)
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}
function onHueMove(e: PointerEvent) {
  if (hueDragging) updateHue(e)
}
function onHueUp() {
  hueDragging = false
}

function updateHue(e: PointerEvent) {
  const canvas = hueCanvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
  colorPicker.setFromHSV({ h })
  renderSVCanvas()
}

function selectColor(c: string) {
  colorPicker.setFromHex(c)
  renderSVCanvas()
}

// --- Actions ---

function doUndo() { engine.undo() }
function doRedo() { engine.redo() }

function confirmClear() {
  engine.clearCanvas()
  showClearConfirm.value = false
}

// --- Keyboard shortcuts ---

function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    engine.undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault()
    engine.redo()
  }
  if (e.key === '[') brushes.setSize(brushes.brush.size - 3)
  if (e.key === ']') brushes.setSize(brushes.brush.size + 3)
  if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault()
    engine.resetView()
  }
}

// --- Canvas rendering for color picker ---

function renderSVCanvas() {
  const canvas = svCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * dpr
  canvas.height = canvas.clientHeight * dpr
  ctx.scale(dpr, dpr)
  colorPicker.renderSVSquare(ctx, canvas.clientWidth, canvas.clientHeight, colorPicker.hsv.h)
}

function renderHueCanvas() {
  const canvas = hueCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const dpr = window.devicePixelRatio || 1
  canvas.width = canvas.clientWidth * dpr
  canvas.height = canvas.clientHeight * dpr
  ctx.scale(dpr, dpr)
  colorPicker.renderHueBar(ctx, canvas.clientWidth, canvas.clientHeight)
}

// --- Lifecycle ---

onMounted(() => {
  if (!containerRef.value) return

  engine.initEngine(containerRef.value)
  engine.setCallbacks(
    brushes.renderStrokeSegment,
  )

  nextTick(() => {
    renderSVCanvas()
    renderHueCanvas()
  })

  window.addEventListener('keydown', handleKeyDown)

  containerRef.value.addEventListener('pointermove', (e: PointerEvent) => {
    cursorX.value = e.clientX
    cursorY.value = e.clientY
    cursorVisible.value = true
  })
  containerRef.value.addEventListener('pointerleave', () => {
    cursorVisible.value = false
  })
})

onUnmounted(() => {
  engine.destroy()
  window.removeEventListener('keydown', handleKeyDown)
})

async function exportCanvas(): Promise<string> {
  return engine.exportCanvas()
}

defineExpose({ exportCanvas })
</script>
