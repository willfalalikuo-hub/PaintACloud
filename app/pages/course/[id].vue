<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <NuxtLink to="/" class="inline-flex items-center text-sm text-gray-400 hover:text-gray-600 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
      返回课程列表
    </NuxtLink>

    <div v-if="course">
      <!-- Course header -->
      <div class="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" :style="{ backgroundColor: (course.color || '#FF6B6B') + '20' }">
            <span class="text-2xl font-bold" :style="{ color: course.color || '#FF6B6B' }">{{ course.icon }}</span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-800">{{ course.name }}</h1>
              <span v-if="course.tag" class="text-xs px-2 py-0.5 rounded-full bg-coral/10 text-coral">{{ course.tag }}</span>
            </div>
            <p class="text-gray-500 mt-2 text-sm leading-relaxed">{{ course.description }}</p>
            <div class="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>{{ course.unit_count }} 个技法单元</span>
              <span>{{ course.category }}</span>
              <span>{{ diffLabel }}</span>
            </div>
          </div>
        </div>
        <!-- Join button -->
        <div class="mt-4 flex justify-end">
          <button v-if="!enrolled" @click="joinCourse" class="bg-coral text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors">
            加入课程
          </button>
          <span v-else class="text-sm text-coral font-medium">已加入</span>
        </div>
      </div>

      <!-- Unit list -->
      <h2 class="text-lg font-bold text-gray-800 mb-4">课程大纲</h2>
      <div class="space-y-3 mb-20 md:mb-8">
        <div v-for="unit in units" :key="unit.id" class="bg-white rounded-2xl p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" :style="{ backgroundColor: (course.color||'#FF6B6B') + '20', color: course.color||'#FF6B6B' }">
                {{ unit.unit_index }}
              </div>
              <div>
                <h3 class="font-bold text-gray-800">{{ unit.name }}</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ unit.description }}</p>
              </div>
            </div>
            <NuxtLink :to="`/unit/${unit.id}`" class="bg-coral text-white px-4 py-1.5 rounded-full text-sm hover:bg-coral/90 transition-colors">
              开始学习
            </NuxtLink>
          </div>
          <div v-if="unit.key_points?.length" class="mt-3 pl-11">
            <div v-for="point in unit.key_points" :key="point" class="flex items-center gap-2 text-xs text-gray-400">
              <span class="w-1 h-1 bg-coral rounded-full"></span>
              {{ point }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-gray-400">课程不存在</p>
      <NuxtLink to="/" class="inline-block mt-4 text-coral hover:underline">返回首页</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { pb, isLoggedIn } = usePocketBase()
const route = useRoute()
const courseId = route.params.id as string

const course = ref<any>(null)
const units = ref<any[]>([])
const enrolled = ref(false)

const diffMap: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
const diffLabel = computed(() => course.value ? diffMap[course.value.difficulty] || '' : '')

// Fetch course and units
const { data: courseData } = await useAsyncData(`course-${courseId}`, async () => {
  const c = await pb.collection('courses').getOne(courseId)
  const u = await pb.collection('units').getFullList({ filter: `course_id="${courseId}"`, sort: 'unit_index' })
  return { course: c, units: u }
})

if (courseData.value) {
  course.value = courseData.value.course
  units.value = courseData.value.units
}

// Check enrollment
if (isLoggedIn.value) {
  try {
    const existing = await pb.collection('enrollments').getFullList({
      filter: `user_id="${pb.authStore.record?.id}" && course_id="${courseId}"`
    })
    enrolled.value = existing.length > 0
  } catch {}
}

async function joinCourse() {
  if (!isLoggedIn.value) {
    return navigateTo('/auth/login')
  }
  try {
    // Find first unit of the course
    const firstUnit = units.value.length ? units.value[0].id : ''
    await pb.collection('enrollments').create({
      user_id: pb.authStore.record!.id,
      course_id: courseId,
      current_unit_id: firstUnit,
      current_day: 1,
      status: 'active'
    })
    enrolled.value = true
  } catch (e) {
    console.error('Join failed', e)
  }
}
</script>
