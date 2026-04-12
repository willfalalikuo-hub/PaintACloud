<template>
  <div ref="containerRef" class="w-full h-full"></div>
</template>

<script setup lang="ts">
const containerRef = ref<HTMLDivElement>()
let root: any = null

onMounted(async () => {
  if (!containerRef.value) return

  // Dynamic import React + tldraw (client only)
  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { Tldraw } = await import('tldraw')

  // Create React root and render <Tldraw /> inside the Vue container
  root = createRoot(containerRef.value)
  root.render(
    React.createElement(Tldraw, {
      autoFocus: true,
    })
  )
})

onUnmounted(() => {
  if (root) {
    root.unmount()
    root = null
  }
})
</script>
