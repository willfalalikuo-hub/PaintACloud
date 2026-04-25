<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <NuxtLink :to="`/course/${unit?.course_id}`" class="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      返回课程
    </NuxtLink>

    <div v-if="unit">
      <!-- Unit header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>第{{ unit.unit_index }}周</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">{{ unit.name }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ unit.description }}</p>
      </div>

      <!-- Key points -->
      <div v-if="kpList.length" class="bg-gray-50 rounded-2xl p-5 mb-6">
        <h2 class="font-bold text-gray-700 text-sm mb-3">本周要点</h2>
        <div v-for="(point, i) in kpList" :key="i" class="flex items-start gap-2 mb-2">
          <span class="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 mt-0.5">{{ i + 1 }}</span>
          <span class="text-sm text-gray-600">{{ point }}</span>
        </div>
      </div>

      <!-- Week progress -->
      <div class="bg-white rounded-2xl p-4 border border-gray-200 mb-6">
        <div class="flex gap-1">
          <div v-for="day in days" :key="day.index" class="flex-1 h-2 rounded-full transition-colors"
            :class="completedDays.includes(day.index) ? 'bg-gray-900' : day.index === currentDay ? 'bg-gray-300' : 'bg-gray-100'">
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">
          Day {{ currentDay }} / {{ days.length }}
          <span v-if="currentDay > days.length" class="text-gray-900 font-medium ml-2">已完成!</span>
        </p>
      </div>

      <!-- Day list -->
      <div class="space-y-3 mb-20 md:mb-8">
        <div v-for="day in days" :key="day.index"
          class="bg-white rounded-2xl border border-gray-200 overflow-hidden">

          <!-- Day header (always visible) -->
          <div class="flex items-center justify-between p-5 cursor-pointer" @click="toggleDay(day.index)">
            <div class="flex items-center gap-4">
              <!-- Reference thumbnail -->
              <div v-if="getDayRefImage(day)" class="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                <img :src="getDayRefImage(day)" :alt="day.title" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                :class="completedDays.includes(day.index) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'">
                <svg v-if="completedDays.includes(day.index)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span v-else>{{ day.index }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs px-1.5 py-0.5 rounded" :class="typeClass(day.type)">{{ typeLabel(day.type) }}</span>
                  <h3 class="font-bold text-gray-800 text-sm">{{ day.title }}</h3>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ day.description }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <NuxtLink v-if="day.type === 'practice' || day.type === 'test'"
                :to="`/canvas?unit=${unit.id}&day=${day.index}`"
                class="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm hover:bg-gray-800 transition-colors"
                @click.stop>
                {{ completedDays.includes(day.index) ? '再画一次' : '开始画画' }}
              </NuxtLink>
              <!-- Expand arrow -->
              <svg v-if="getDayContent(day.index)" xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4 text-gray-300 transition-transform"
                :class="expandedDay === day.index ? 'rotate-180' : ''"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>

          <!-- Expanded content (teaching material) -->
          <div v-if="expandedDay === day.index" class="px-5 pb-5 border-t border-gray-100">
            <!-- Reference images for this day -->
            <div v-if="getDayAllImages(day).length" class="mt-4">
              <h4 class="font-bold text-gray-700 text-sm mb-2">参考图</h4>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="(img, ii) in getDayAllImages(day)" :key="ii" class="bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow" @click="previewSrc = img.src">
                  <img :src="img.src" :alt="img.title" class="w-full aspect-square object-cover" loading="lazy" />
                  <div class="p-2">
                    <span class="text-xs text-gray-500">{{ img.title }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="getDayContent(day.index)" >
            <div v-for="(section, si) in getDayContent(day.index).sections" :key="si" class="mt-4">
              <h4 class="font-bold text-gray-700 text-sm mb-2">{{ section.title }}</h4>
              <div class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ section.text }}</div>
            </div>

            <!-- Practice goal -->
            <div v-if="getDayContent(day.index).practice_goal" class="mt-4 bg-gray-50 rounded-xl p-4">
              <h4 class="font-bold text-gray-900 text-sm mb-1">练习目标</h4>
              <p class="text-sm text-gray-600">{{ getDayContent(day.index).practice_goal }}</p>
            </div>

            <!-- Tips -->
            <div v-if="getDayContent(day.index).tips?.length" class="mt-4 bg-gray-50 rounded-xl p-4">
              <h4 class="font-bold text-gray-600 text-sm mb-2">小贴士</h4>
              <div v-for="tip in getDayContent(day.index).tips" :key="tip" class="flex items-start gap-2 mb-1">
                <span class="text-gray-400 mt-0.5">*</span>
                <span class="text-sm text-gray-600">{{ tip }}</span>
              </div>
            </div>

            <!-- Go draw button -->
            <NuxtLink v-if="day.type === 'practice' || day.type === 'test'"
              :to="`/canvas?unit=${unit.id}&day=${day.index}`"
              class="block mt-4 bg-gray-900 text-white text-center px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
              开始练习
            </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-400">技法单元不存在</p>
      <NuxtLink to="/" class="inline-block mt-4 text-gray-900 hover:underline">返回首页</NuxtLink>
    </div>

    <!-- Image preview modal -->
    <Teleport to="body">
      <div v-if="previewSrc" class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" @click="previewSrc = ''">
        <img :src="previewSrc" class="max-w-full max-h-[90vh] object-contain rounded-lg" @click.stop />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn, getUnit } = usePocketBase()
const route = useRoute()
const unitId = route.params.id as string

const unit = ref<any>(null)
const currentDay = ref(1)
const completedDays = ref<number[]>([])
const expandedDay = ref<number | null>(null)
const previewSrc = ref('')

// Fetch unit data
unit.value = await getUnit(unitId)

const days = computed(() => {
  if (!unit.value?.days) return []
  return typeof unit.value.days === 'string' ? JSON.parse(unit.value.days) : unit.value.days
})

const kpList = computed(() => {
  if (!unit.value?.key_points) return []
  return typeof unit.value.key_points === 'string' ? JSON.parse(unit.value.key_points) : unit.value.key_points
})

const content = computed(() => {
  if (!unit.value?.content) return null
  return typeof unit.value.content === 'string' ? JSON.parse(unit.value.content) : unit.value.content
})

function getDayContent(dayIndex: number) {
  if (!content.value) return null
  return content.value[`day${dayIndex}`] || null
}

function toggleDay(dayIndex: number) {
  expandedDay.value = expandedDay.value === dayIndex ? null : dayIndex
}

interface RefImg { title: string; src: string }
function getDayRefImage(day: any): string {
  return day.referenceImage || (day.steps?.find((s: any) => s.referenceImage)?.referenceImage) || ''
}

function getDayAllImages(day: any): RefImg[] {
  const imgs: RefImg[] = []
  if (day.steps?.length) {
    for (const s of day.steps) {
      if (s.referenceImage) imgs.push({ title: s.title, src: s.referenceImage })
    }
  }
  if (day.referenceImage) {
    imgs.push({ title: day.title, src: day.referenceImage })
  }
  if (day.referenceImages?.length) {
    for (const src of day.referenceImages) {
      imgs.push({ title: day.title, src })
    }
  }
  return imgs
}

// Load enrollment progress (simplified for static mode)
if (unit.value) {
  expandedDay.value = 1
}

function typeLabel(type: string) {
  return ({ theory: '理论', practice: '练习', test: '测试', review: '总结' } as any)[type] || type
}
function typeClass(type: string) {
  return ({ theory: 'bg-gray-100 text-gray-600', practice: 'bg-gray-900 text-white', test: 'bg-gray-200 text-gray-700', review: 'bg-gray-100 text-gray-500' } as any)[type] || 'bg-gray-100 text-gray-500'
}
</script>
