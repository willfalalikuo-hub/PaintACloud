import type { Point } from './useBrushes'

const MAX_HISTORY = 30

interface TouchState {
  pointers: Map<number, Point>
  lastDist: number
  lastCenter: { x: number; y: number }
}

export function usePaintEngine() {
  // Canvases
  let displayCanvas: HTMLCanvasElement | null = null
  let displayCtx: CanvasRenderingContext2D | null = null
  let drawCanvas: HTMLCanvasElement | null = null
  let drawCtx: CanvasRenderingContext2D | null = null
  let dpr = 1
  let canvasWidth = 0
  let canvasHeight = 0

  // View transform
  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)

  // Drawing state
  const isDrawing = ref(false)
  let lastDrawPoint: Point | null = null
  let renderPending = false

  // History
  let history: ImageData[] = []
  let redoStack: ImageData[] = []

  // Touch gesture state
  let touchState: TouchState = {
    pointers: new Map(),
    lastDist: 0,
    lastCenter: { x: 0, y: 0 },
  }
  let isGesturing = false
  let penActive = false

  // Panning state (desktop: space + drag)
  let isPanning = false
  let spaceHeld = false
  let panStart = { x: 0, y: 0 }

  // Callbacks set by PaintCanvas
  let segmentFn: ((ctx: CanvasRenderingContext2D, from: Point, to: Point) => void) | null = null

  // --- Initialization ---

  function initEngine(container: HTMLDivElement) {
    dpr = window.devicePixelRatio || 1
    canvasWidth = container.clientWidth
    canvasHeight = container.clientHeight

    // Display canvas (visible, handles zoom/pan via CSS transform)
    displayCanvas = document.createElement('canvas')
    displayCanvas.width = canvasWidth * dpr
    displayCanvas.height = canvasHeight * dpr
    displayCanvas.style.width = canvasWidth + 'px'
    displayCanvas.style.height = canvasHeight + 'px'
    displayCanvas.style.touchAction = 'none'
    displayCtx = displayCanvas.getContext('2d')!

    // Draw canvas (offscreen, fixed resolution, actual painting surface)
    drawCanvas = document.createElement('canvas')
    drawCanvas.width = canvasWidth * dpr
    drawCanvas.height = canvasHeight * dpr
    drawCtx = drawCanvas.getContext('2d')!
    drawCtx.scale(dpr, dpr)
    // White background
    drawCtx.fillStyle = '#FFFFFF'
    drawCtx.fillRect(0, 0, canvasWidth, canvasHeight)

    container.appendChild(displayCanvas)
    render()

    // Pointer events
    displayCanvas.addEventListener('pointerdown', onPointerDown)
    displayCanvas.addEventListener('pointermove', onPointerMove)
    displayCanvas.addEventListener('pointerup', onPointerUp)
    displayCanvas.addEventListener('pointercancel', onPointerUp)

    // Wheel zoom
    displayCanvas.addEventListener('wheel', onWheel, { passive: false })

    // Keyboard
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    // Resize
    const ro = new ResizeObserver(() => {
      if (!container) return
      const newW = container.clientWidth
      const newH = container.clientHeight
      if (newW !== canvasWidth || newH !== canvasHeight) {
        resizeCanvas(newW, newH)
      }
    })
    ro.observe(container)
  }

  function resizeCanvas(newW: number, newH: number) {
    // Save current drawing
    const imageData = drawCtx?.getImageData(0, 0, drawCanvas!.width, drawCanvas!.height)

    canvasWidth = newW
    canvasHeight = newH

    displayCanvas!.width = newW * dpr
    displayCanvas!.height = newH * dpr
    displayCanvas!.style.width = newW + 'px'
    displayCanvas!.style.height = newH + 'px'

    drawCanvas!.width = newW * dpr
    drawCanvas!.height = newH * dpr
    drawCtx = drawCanvas!.getContext('2d')!
    drawCtx.scale(dpr, dpr)

    // Restore white bg
    drawCtx.fillStyle = '#FFFFFF'
    drawCtx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Restore drawing
    if (imageData) {
      drawCtx.putImageData(imageData, 0, 0)
    }

    render()
  }

  function setCallbacks(
    segment: (ctx: CanvasRenderingContext2D, from: Point, to: Point) => void,
  ) {
    segmentFn = segment
  }

  // --- Pointer event handling ---

  function onPointerDown(e: PointerEvent) {
    if (!drawCtx || !segmentFn) return

    // Pen: always draw
    if (e.pointerType === 'pen') {
      penActive = true
      startDrawing(e)
      return
    }

    // Touch: track for gesture detection
    if (e.pointerType === 'touch') {
      touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pressure: e.pressure })

      if (touchState.pointers.size === 2) {
        // Start gesture: cancel any ongoing drawing
        isGesturing = true
        isDrawing.value = false
        lastDrawPoint = null
        const pts = [...touchState.pointers.values()]
        touchState.lastDist = distance(pts[0], pts[1])
        touchState.lastCenter = midpoint(pts[0], pts[1])
        return
      }

      if (touchState.pointers.size === 1 && !penActive) {
        // Single finger: draw (only if no pen is active)
        startDrawing(e)
      }
      return
    }

    // Mouse
    if (e.pointerType === 'mouse') {
      if (spaceHeld) {
        // Pan mode
        isPanning = true
        panStart = { x: e.clientX - panX.value, y: e.clientY - panY.value }
        displayCanvas!.style.cursor = 'grabbing'
        return
      }
      startDrawing(e)
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawCtx || !segmentFn) return

    if (e.pointerType === 'pen' && isDrawing.value) {
      drawFromEvent(e)
      return
    }

    if (e.pointerType === 'touch') {
      touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pressure: e.pressure })

      if (isGesturing && touchState.pointers.size === 2) {
        const pts = [...touchState.pointers.values()]
        const newDist = distance(pts[0], pts[1])
        const newCenter = midpoint(pts[0], pts[1])

        // Zoom
        const scale = newDist / touchState.lastDist
        zoom.value = Math.max(0.25, Math.min(8, zoom.value * scale))

        // Pan
        panX.value += newCenter.x - touchState.lastCenter.x
        panY.value += newCenter.y - touchState.lastCenter.y

        touchState.lastDist = newDist
        touchState.lastCenter = newCenter
        applyTransform()
        scheduleRender()
        return
      }

      if (isDrawing.value && touchState.pointers.size === 1) {
        drawFromEvent(e)
      }
      return
    }

    if (e.pointerType === 'mouse') {
      if (isPanning) {
        panX.value = e.clientX - panStart.x
        panY.value = e.clientY - panStart.y
        applyTransform()
        scheduleRender()
        return
      }
      if (isDrawing.value) {
        drawFromEvent(e)
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (e.pointerType === 'pen') {
      penActive = false
      endDrawing()
      return
    }

    if (e.pointerType === 'touch') {
      touchState.pointers.delete(e.pointerId)
      if (touchState.pointers.size === 0) {
        isGesturing = false
        endDrawing()
      }
      return
    }

    if (e.pointerType === 'mouse') {
      if (isPanning) {
        isPanning = false
        displayCanvas!.style.cursor = spaceHeld ? 'grab' : 'crosshair'
        return
      }
      endDrawing()
    }
  }

  // --- Drawing ---

  function startDrawing(e: PointerEvent) {
    if (!drawCtx || !segmentFn) return
    isDrawing.value = true

    // Save snapshot for undo
    pushHistory()

    const point = screenToCanvas(e.clientX, e.clientY)
    point.pressure = e.pressure || 0.5
    lastDrawPoint = point

    // Draw a tiny segment to create a single dot on click
    const dot: Point = { x: point.x + 0.1, y: point.y + 0.1, pressure: point.pressure }
    segmentFn(drawCtx, point, dot)
    scheduleRender()
  }

  function drawFromEvent(e: PointerEvent) {
    if (!drawCtx || !segmentFn || !lastDrawPoint) return

    const events = e.getCoalescedEvents?.() || [e]
    for (const ce of events) {
      continueDrawing(ce)
    }
    scheduleRender()
  }

  function continueDrawing(e: PointerEvent) {
    if (!drawCtx || !segmentFn || !lastDrawPoint) return

    const point = screenToCanvas(e.clientX, e.clientY)
    point.pressure = e.pressure || 0.5

    const dx = point.x - lastDrawPoint.x
    const dy = point.y - lastDrawPoint.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Step size slightly smaller than 1px to guarantee overlap
    const step = 0.8
    const steps = Math.max(1, Math.ceil(dist / step))

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const interp: Point = {
        x: lastDrawPoint.x + dx * t,
        y: lastDrawPoint.y + dy * t,
        pressure: lastDrawPoint.pressure + (point.pressure - lastDrawPoint.pressure) * t,
      }
      const prev: Point = {
        x: lastDrawPoint.x + dx * ((i - 1) / steps),
        y: lastDrawPoint.y + dy * ((i - 1) / steps),
        pressure: lastDrawPoint.pressure + (point.pressure - lastDrawPoint.pressure) * ((i - 1) / steps),
      }
      segmentFn(drawCtx, prev, interp)
    }

    lastDrawPoint = point
  }

  function endDrawing() {
    if (!isDrawing.value) return
    isDrawing.value = false
    lastDrawPoint = null
  }

  // --- Coordinate conversion ---

  function screenToCanvas(clientX: number, clientY: number): Point {
    if (!displayCanvas) return { x: 0, y: 0, pressure: 0.5 }
    const rect = displayCanvas.getBoundingClientRect()
    // Account for zoom and pan
    const x = (clientX - rect.left - panX.value) / zoom.value
    const y = (clientY - rect.top - panY.value) / zoom.value
    return { x, y, pressure: 0.5 }
  }

  // --- Rendering ---

  function render() {
    if (!displayCtx || !drawCanvas) return
    displayCtx.clearRect(0, 0, displayCanvas!.width, displayCanvas!.height)
    displayCtx.drawImage(drawCanvas, 0, 0)
  }

  function scheduleRender() {
    if (renderPending) return
    renderPending = true
    requestAnimationFrame(() => {
      renderPending = false
      render()
    })
  }

  function applyTransform() {
    if (!displayCanvas) return
    displayCanvas.style.transformOrigin = '0 0'
    displayCanvas.style.transform = `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`
  }

  // --- History ---

  function pushHistory() {
    if (!drawCtx || !drawCanvas) return
    const snapshot = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height)
    history.push(snapshot)
    if (history.length > MAX_HISTORY) {
      history.shift()
    }
    redoStack = []
  }

  function undo(): boolean {
    if (history.length === 0 || !drawCtx) return false
    // Save current state to redo
    const current = drawCtx.getImageData(0, 0, drawCanvas!.width, drawCanvas!.height)
    redoStack.push(current)

    const prev = history.pop()!
    drawCtx.putImageData(prev, 0, 0)
    render()
    return true
  }

  function redo(): boolean {
    if (redoStack.length === 0 || !drawCtx) return false
    // Save current to history
    const current = drawCtx.getImageData(0, 0, drawCanvas!.width, drawCanvas!.height)
    history.push(current)

    const next = redoStack.pop()!
    drawCtx.putImageData(next, 0, 0)
    render()
    return true
  }

  function canUndo() { return history.length > 0 }
  function canRedo() { return redoStack.length > 0 }

  // --- Zoom/Pan controls ---

  function onWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.25, Math.min(8, zoom.value * delta))

    // Zoom toward cursor position
    if (displayCanvas) {
      const rect = displayCanvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      panX.value = mx - (mx - panX.value) * (newZoom / zoom.value)
      panY.value = my - (my - panY.value) * (newZoom / zoom.value)
    }

    zoom.value = newZoom
    applyTransform()
    render()
  }

  function resetView() {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
    applyTransform()
    render()
  }

  // --- Canvas operations ---

  function clearCanvas() {
    if (!drawCtx) return
    pushHistory()
    drawCtx.save()
    drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawCtx.fillStyle = '#FFFFFF'
    drawCtx.fillRect(0, 0, canvasWidth, canvasHeight)
    drawCtx.restore()
    render()
  }

  function exportCanvas(): Promise<string> {
    return new Promise((resolve) => {
      if (!drawCanvas) { resolve(''); return }
      resolve(drawCanvas.toDataURL('image/png'))
    })
  }

  // --- Keyboard ---

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !e.repeat) {
      spaceHeld = true
      if (displayCanvas) displayCanvas.style.cursor = 'grab'
      e.preventDefault()
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      spaceHeld = false
      isPanning = false
      if (displayCanvas) displayCanvas.style.cursor = 'crosshair'
    }
  }

  // --- Cleanup ---

  function destroy() {
    if (displayCanvas) {
      displayCanvas.removeEventListener('pointerdown', onPointerDown)
      displayCanvas.removeEventListener('pointermove', onPointerMove)
      displayCanvas.removeEventListener('pointerup', onPointerUp)
      displayCanvas.removeEventListener('pointercancel', onPointerUp)
      displayCanvas.removeEventListener('wheel', onWheel)
      displayCanvas.remove()
    }
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  return {
    zoom,
    panX,
    panY,
    isDrawing,
    initEngine,
    setCallbacks,
    undo,
    redo,
    canUndo,
    canRedo,
    clearCanvas,
    exportCanvas,
    resetView,
    destroy,
  }
}

// --- Helpers ---

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function midpoint(a: Point, b: Point): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
