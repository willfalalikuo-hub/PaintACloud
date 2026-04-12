<template>
  <div class="h-screen flex flex-col bg-gray-900">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
      <NuxtLink to="/" class="text-sm text-gray-300 hover:text-white transition-colors">
        &larr; 返回
      </NuxtLink>
      <span class="text-sm font-medium">{{ pageTitle }}</span>
      <div class="flex items-center gap-2">
        <button @click="showUpload = true" class="text-sm text-gray-300 hover:text-white transition-colors px-2">
          上传
        </button>
        <button @click="submitScore" class="bg-coral text-white px-4 py-1.5 rounded-full text-sm hover:bg-coral/90 transition-colors">
          提交评分
        </button>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex-1 flex relative overflow-hidden">
      <!-- Canvas -->
      <div class="flex-1 relative">
        <ClientOnly>
          <PaintCanvas ref="canvasRef" />
        </ClientOnly>
      </div>

      <!-- Reference image panel (desktop: right side, mobile: toggle) -->
      <div v-if="showReference && referenceImages.length" class="hidden md:flex flex-col w-64 bg-gray-800 border-l border-gray-700">
        <div class="p-3 border-b border-gray-700">
          <h3 class="text-xs text-gray-400 font-medium">参考图</h3>
        </div>
        <div class="flex-1 overflow-auto p-3 space-y-3">
          <div v-for="(img, i) in referenceImages" :key="i" class="bg-gray-700 rounded-lg p-2">
            <div class="aspect-square bg-gray-600 rounded flex items-center justify-center text-gray-400 text-xs">
              Step {{ i + 1 }}: {{ img.title }}
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-gray-700">
          <label class="text-xs text-gray-400">透明度</label>
          <input type="range" min="0" max="100" v-model="referenceOpacity" class="w-full mt-1" />
        </div>
      </div>
    </div>

    <!-- Step progress bar (bottom) -->
    <div v-if="steps.length" class="bg-gray-800 px-4 py-2">
      <div class="flex items-center gap-1">
        <button
          v-for="(step, i) in steps"
          :key="i"
          @click="currentStep = i"
          class="flex-1 py-1 rounded text-xs font-medium transition-colors"
          :class="i === currentStep ? 'bg-coral text-white' : i < currentStep ? 'bg-coral/30 text-coral' : 'bg-gray-700 text-gray-400'"
        >
          {{ step.title }}
        </button>
      </div>
    </div>

    <!-- Score result modal -->
    <Teleport to="body">
      <div v-if="showScore" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl w-full max-w-sm p-6">
          <h2 class="text-xl font-bold text-gray-800 text-center mb-6">AI评分结果</h2>

          <div class="space-y-3 mb-6">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">技法准确度</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-coral rounded-full" :style="{ width: (score?.technique || 0) * 10 + '%' }"></div>
                </div>
                <span class="text-sm font-bold text-gray-800 w-10 text-right">{{ score?.technique || 0 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">造型能力</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-lavender rounded-full" :style="{ width: (score?.shape || 0) * 10 + '%' }"></div>
                </div>
                <span class="text-sm font-bold text-gray-800 w-10 text-right">{{ score?.shape || 0 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">光影表现</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-mint rounded-full" :style="{ width: (score?.light || 0) * 10 + '%' }"></div>
                </div>
                <span class="text-sm font-bold text-gray-800 w-10 text-right">{{ score?.light || 0 }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500">整体完成度</span>
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 rounded-full" :style="{ width: (score?.completeness || 0) * 10 + '%' }"></div>
                </div>
                <span class="text-sm font-bold text-gray-800 w-10 text-right">{{ score?.completeness || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Total score -->
          <div class="text-center mb-4">
            <span class="text-4xl font-bold" :class="scoreGrade.class">{{ score?.total || 0 }}</span>
            <span class="text-gray-400 text-lg">/10</span>
            <div class="text-sm mt-1" :class="scoreGrade.class">{{ scoreGrade.label }}</div>
          </div>

          <p class="text-center text-sm text-gray-500 mb-6">{{ score?.comment || '' }}</p>

          <div class="flex gap-3">
            <button @click="showScore = false" class="flex-1 py-2.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              再画一次
            </button>
            <NuxtLink :to="backUrl" class="flex-1 py-2.5 rounded-full text-sm font-medium bg-coral text-white text-center hover:bg-coral/90 transition-colors">
              完成提交
            </NuxtLink>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Upload modal -->
    <Teleport to="body">
      <div v-if="showUpload" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click.self="showUpload = false">
        <div class="bg-white rounded-2xl w-full max-w-sm p-6">
          <h2 class="text-lg font-bold text-gray-800 text-center mb-4">上传线下作品</h2>
          <p class="text-sm text-gray-400 text-center mb-4">拍照或从相册选择你的画作</p>

          <label class="block w-full aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-coral/50 transition-colors mb-4">
            <div class="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p class="text-sm text-gray-400">点击选择图片</p>
            </div>
            <input type="file" accept="image/*" capture="environment" class="hidden" @change="handleUpload" />
          </label>

          <!-- Preview -->
          <div v-if="uploadPreview" class="mb-4">
            <img :src="uploadPreview" class="w-full rounded-xl" />
          </div>

          <button
            v-if="uploadPreview"
            @click="confirmUpload"
            class="w-full bg-coral text-white py-2.5 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors"
          >
            确认上传并评分
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Mobile reference toggle -->
    <button
      v-if="referenceImages.length"
      @click="showReference = !showReference"
      class="md:hidden fixed right-4 bottom-20 bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-40"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AIScore, Day } from '~/types'

definePageMeta({
  layout: false,
})

const { pb, isLoggedIn } = usePocketBase()
const route = useRoute()

// Parse route params
const unitId = route.query.unit as string
const dayIndex = parseInt(route.query.day as string) || 0

// Find current day info from PocketBase
let currentDay: any = null
let unitName = ''
let unitData: any = null

if (unitId) {
  try {
    unitData = await pb.collection('units').getOne(unitId)
    unitName = unitData.name
    const days = typeof unitData.days === 'string' ? JSON.parse(unitData.days) : (unitData.days || [])
    currentDay = days.find((d: any) => d.index === dayIndex) || null
  } catch {}
}

const pageTitle = currentDay ? `${unitName} - Day${dayIndex} ${currentDay.title}` : '自由画板'
const backUrl = unitId ? `/unit/${unitId}` : '/'
const steps = currentDay?.steps || []
const referenceImages = steps.length ? steps : (currentDay ? [{ title: currentDay.title }] : [])

// Canvas ref
const canvasRef = ref()

// Reference panel
const showReference = ref(false)
const referenceOpacity = ref(80)
const currentStep = ref(0)

// Score
const showScore = ref(false)
const score = ref<AIScore | null>(null)
const loading = ref(false)

const scoreGrade = computed(() => {
  const t = score.value?.total || 0
  if (t >= 9) return { label: '优秀', class: 'text-coral' }
  if (t >= 7) return { label: '良好', class: 'text-emerald-500' }
  if (t >= 5) return { label: '中等', class: 'text-amber-500' }
  if (t >= 3) return { label: '待提高', class: 'text-orange-500' }
  return { label: '需要加把劲', class: 'text-red-400' }
})

async function submitScore() {
  loading.value = true
  try {
    const res = await $fetch<{ code: number; data: AIScore }>('/api/v1/score', {
      method: 'POST',
      body: { image: 'placeholder' },
    })
    score.value = res.data
    showScore.value = true

    // Save practice and advance progress
    if (isLoggedIn.value && unitId) {
      // Save practice record
      await pb.collection('practices').create({
        user_id: pb.authStore.record!.id,
        unit: unitId,
        day_index: dayIndex,
        ai_score: res.data,
        self_passed: false
      })

      // Save checkin
      const today = new Date().toISOString().split('T')[0]
      await pb.collection('checkins').create({
        user_id: pb.authStore.record!.id,
        date: today,
      }).catch(() => {}) // ignore duplicate

      // Advance enrollment to next day
      if (unitData) {
        const days = typeof unitData.days === 'string' ? JSON.parse(unitData.days) : (unitData.days || [])
        const nextDay = dayIndex + 1
        const enrollments = await pb.collection('enrollments').getFullList({
          filter: `user_id="${pb.authStore.record!.id}" && course_id="${unitData.course_id}"`
        })
        if (enrollments.length) {
          await pb.collection('enrollments').update(enrollments[0].id, {
            current_day: Math.min(nextDay, days.length + 1)
          })
        }
      }
    }
  } catch (e) {
    console.error('Score failed', e)
  } finally {
    loading.value = false
  }
}

// Upload
const showUpload = ref(false)
const uploadPreview = ref('')

function handleUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    uploadPreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

async function confirmUpload() {
  if (!uploadPreview.value) return
  loading.value = true
  try {
    const base64 = uploadPreview.value.replace(/^data:image\/\w+;base64,/, '')
    const res = await $fetch<{ code: number; data: AIScore }>('/api/v1/score', {
      method: 'POST',
      body: { image: base64 },
    })
    score.value = res.data
    showUpload.value = false
    showScore.value = true
  } catch (e) {
    console.error('Upload score failed', e)
  } finally {
    loading.value = false
  }
}
</script>
