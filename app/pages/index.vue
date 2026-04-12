<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">发现</h1>
      <p class="text-gray-500 mt-1">找到适合你的画风课程</p>
    </header>

    <!-- Daily painting card -->
    <div class="bg-gradient-to-r from-coral/20 to-lavender/20 rounded-2xl p-6 mb-8">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">今日一画</p>
          <h2 class="text-xl font-bold text-gray-800 mt-1">开始你的绘画练习</h2>
          <p class="text-gray-500 mt-2 text-sm">选择一个课程开始吧</p>
          <NuxtLink to="/canvas" class="inline-block mt-4 bg-coral text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors">
            开始画画
          </NuxtLink>
        </div>
        <div class="hidden sm:flex w-32 h-32 bg-white/50 rounded-xl items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-coral/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </div>
      </div>
    </div>

    <!-- Hot courses from PocketBase -->
    <section class="mb-8">
      <h2 class="text-lg font-bold text-gray-800 mb-4">热门课程</h2>
      <div v-if="courses.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="course in courses"
          :key="course.id"
          :to="`/course/${course.id}`"
          class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div class="aspect-square rounded-xl mb-3 flex items-center justify-center" :style="{ backgroundColor: (course.color || '#FF6B6B') + '20' }">
            <span class="text-3xl font-bold" :style="{ color: course.color || '#FF6B6B' }">{{ course.icon || 'P' }}</span>
          </div>
          <h3 class="font-bold text-gray-800 text-sm">{{ course.name }}</h3>
          <p class="text-xs text-gray-400 mt-1">{{ course.unit_count || 0 }}个技法单元</p>
          <span v-if="course.tag" class="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-coral/10 text-coral">
            {{ course.tag }}
          </span>
        </NuxtLink>
      </div>
      <div v-else class="text-center py-8 text-gray-300">加载中...</div>
    </section>

    <!-- Checkin calendar -->
    <section class="mb-20 md:mb-8">
      <div class="bg-white rounded-2xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">打卡日历</h2>
          <span class="text-sm text-coral font-medium">连续 {{ streakDays }} 天</span>
        </div>
        <div class="grid grid-cols-7 gap-2 text-center text-sm">
          <span class="text-gray-400">一</span>
          <span class="text-gray-400">二</span>
          <span class="text-gray-400">三</span>
          <span class="text-gray-400">四</span>
          <span class="text-gray-400">五</span>
          <span class="text-gray-400">六</span>
          <span class="text-gray-400">日</span>
          <span v-for="d in firstDayOffset" :key="'e'+d" class="py-2 text-gray-200">-</span>
          <span v-for="d in daysInMonth" :key="d" class="py-2 rounded-full"
            :class="checkinDates.includes(d) ? 'bg-coral text-white font-bold' : d === today ? 'bg-coral/20 text-coral font-bold' : 'text-gray-600'">
            {{ d }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { pb, isLoggedIn } = usePocketBase()

interface Course {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tag: string
  unit_count: number
}

const courses = ref<Course[]>([])
const streakDays = ref(0)
const checkinDates = ref<number[]>([])

// Fetch courses
const { data } = await useAsyncData('courses', () =>
  pb.collection('courses').getFullList<Course>()
)
if (data.value) courses.value = data.value

// Fetch checkins if logged in
if (isLoggedIn.value) {
  try {
    const checkins = await pb.collection('checkins').getFullList({ filter: `user_id="${pb.authStore.record?.id}"` })
    const now = new Date()
    checkinDates.value = checkins
      .filter((c: any) => c.date?.startsWith(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`))
      .map((c: any) => parseInt(c.date.split('-')[2]))
  } catch {}
}

const now = new Date()
const today = now.getDate()
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
const firstDayOffset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7
</script>
