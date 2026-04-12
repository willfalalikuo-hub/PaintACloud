<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <NuxtLink :to="`/course/${unit?.course_id}`" class="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      返回课程
    </NuxtLink>

    <div v-if="unit">
      <div class="mb-6">
        <div class="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <span>第{{ unit.unit_index }}周</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">{{ unit.name }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ unit.description }}</p>
      </div>

      <!-- Key points -->
      <div v-if="kpList.length" class="bg-gradient-to-r from-lavender/10 to-mint/10 rounded-2xl p-5 mb-6">
        <h2 class="font-bold text-gray-700 text-sm mb-3">本周要点</h2>
        <div v-for="(point, i) in kpList" :key="i" class="flex items-start gap-2 mb-2">
          <span class="w-5 h-5 rounded-full bg-lavender/20 text-lavender text-xs flex items-center justify-center shrink-0 mt-0.5">{{ i + 1 }}</span>
          <span class="text-sm text-gray-600">{{ point }}</span>
        </div>
      </div>

      <!-- Week progress -->
      <div class="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div class="flex gap-1">
          <div v-for="day in days" :key="day.index" class="flex-1 h-2 rounded-full transition-colors"
            :class="day.index < currentDay ? 'bg-coral' : day.index === currentDay ? 'bg-coral/50' : 'bg-gray-100'">
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">
          Day {{ currentDay }} / {{ days.length }}
          <span v-if="currentDay > days.length" class="text-coral font-medium ml-2">已完成!</span>
        </p>
      </div>

      <!-- Day list -->
      <div class="space-y-3 mb-20 md:mb-8">
        <div v-for="day in days" :key="day.index"
          class="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between"
          :class="{'opacity-50 pointer-events-none': day.index > currentDay}">
          <div class="flex items-center gap-4">
            <!-- Day status indicator -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              :class="completedDays.includes(day.index) ? 'bg-coral text-white' : day.index === currentDay ? 'bg-coral/20 text-coral' : 'bg-gray-100 text-gray-300'">
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

          <!-- Actions -->
          <div v-if="day.index <= currentDay" class="shrink-0">
            <NuxtLink v-if="day.type === 'practice' || day.type === 'test'"
              :to="`/canvas?unit=${unit.id}&day=${day.index}`"
              class="bg-coral text-white px-4 py-1.5 rounded-full text-sm hover:bg-coral/90 transition-colors inline-block">
              {{ completedDays.includes(day.index) ? '再画一次' : '开始画画' }}
            </NuxtLink>
            <button v-else-if="day.type === 'theory'" @click="showTheory(day)"
              class="bg-lavender/10 text-lavender px-4 py-1.5 rounded-full text-sm hover:bg-lavender/20 transition-colors">
              查看讲解
            </button>
            <button v-else-if="day.type === 'review'"
              class="bg-mint/20 text-teal-600 px-4 py-1.5 rounded-full text-sm hover:bg-mint/30 transition-colors">
              查看评分
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-400">技法单元不存在</p>
      <NuxtLink to="/" class="inline-block mt-4 text-coral hover:underline">返回首页</NuxtLink>
    </div>

    <!-- Theory modal -->
    <Teleport to="body">
      <div v-if="theoryModal" class="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" @click.self="theoryModal = null">
        <div class="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[80vh] overflow-auto p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold text-gray-800">{{ theoryModal.title }}</h2>
            <button @click="theoryModal = null" class="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ theoryModal.description }}</p>
          <NuxtLink :to="`/canvas?unit=${unit?.id}&day=${theoryModal.index}`"
            class="block bg-coral text-white text-center px-6 py-2.5 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors"
            @click="theoryModal = null">
            开始跟着画
          </NuxtLink>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const { pb, isLoggedIn } = usePocketBase()
const route = useRoute()
const unitId = route.params.id as string

const unit = ref<any>(null)
const currentDay = ref(1)
const completedDays = ref<number[]>([])
const theoryModal = ref<any>(null)

// Fetch unit data
const { data } = await useAsyncData(`unit-${unitId}`, () =>
  pb.collection('units').getOne(unitId)
)
if (data.value) unit.value = data.value

const days = computed(() => {
  if (!unit.value?.days) return []
  return typeof unit.value.days === 'string' ? JSON.parse(unit.value.days) : unit.value.days
})

const kpList = computed(() => {
  if (!unit.value?.key_points) return []
  return typeof unit.value.key_points === 'string' ? JSON.parse(unit.value.key_points) : unit.value.key_points
})

// Load enrollment progress
if (isLoggedIn.value && unit.value) {
  try {
    const enrollments = await pb.collection('enrollments').getFullList({
      filter: `user_id="${pb.authStore.record?.id}" && course_id="${unit.value.course_id}"`
    })
    if (enrollments.length) {
      currentDay.value = enrollments[0].current_day || 1
      // Update current_unit_id if not set
      if (!enrollments[0].current_unit_id || enrollments[0].current_unit_id !== unitId) {
        await pb.collection('enrollments').update(enrollments[0].id, {
          current_unit_id: unitId
        })
      }
    }

    // Load completed practices for this unit
    const practices = await pb.collection('practices').getFullList({
      filter: `user_id="${pb.authStore.record?.id}" && unit="${unitId}"`
    })
    completedDays.value = [...new Set(practices.map((p: any) => p.day_index).filter(Boolean))]
  } catch {}
}

function showTheory(day: any) {
  theoryModal.value = day
}

function typeLabel(type: string) {
  return ({ theory: '理论', practice: '练习', test: '测试', review: '评分' } as any)[type] || type
}
function typeClass(type: string) {
  return ({ theory: 'bg-lavender/10 text-lavender', practice: 'bg-coral/10 text-coral', test: 'bg-mint/20 text-teal-600', review: 'bg-amber-100 text-amber-600' } as any)[type] || 'bg-gray-100 text-gray-500'
}
</script>
