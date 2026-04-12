<template>
  <div class="p-4 md:p-8 max-w-6xl mx-auto">
    <!-- Pinned daily card (hero style) -->
    <NuxtLink to="/canvas" class="block mb-8 group">
      <div class="relative rounded-2xl overflow-hidden shadow-lg h-52 md:h-64">
        <img :src="dailyImageUrl" alt="" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
            <span class="text-white/80 text-xs font-medium">今日一画</span>
          </div>
          <h2 class="text-xl md:text-2xl font-bold text-white">开始你的绘画练习</h2>
          <p class="text-white/70 text-sm mt-1">每天一幅画，进步看得见</p>
        </div>
        <div class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-medium group-hover:bg-coral/80 transition-colors">
          去画画
        </div>
      </div>
    </NuxtLink>

    <!-- Hot courses from PocketBase -->
    <section class="mb-8">
      <h2 class="text-lg font-bold text-gray-800 mb-4">热门课程</h2>
      <div v-if="courses.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="course in courses"
          :key="course.id"
          :to="`/course/${course.id}`"
          class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div class="aspect-video relative overflow-hidden">
            <img :src="course.cover || getCourseImageUrl(course.id)" alt="" class="w-full h-full object-cover" loading="lazy" />
            <div class="absolute inset-0" :style="{ background: `linear-gradient(to bottom, transparent 50%, ${(course.color || '#FF6B6B')}cc 100%)` }"></div>
            <div class="absolute bottom-2 left-3 flex items-center gap-1.5">
              <span class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" :style="{ backgroundColor: (course.color || '#FF6B6B') + '30', color: course.color || '#FF6B6B' }">{{ course.icon || 'P' }}</span>
              <span class="text-white text-xs font-medium drop-shadow">{{ course.name }}</span>
            </div>
          </div>
          <div class="p-3">
            <p class="text-xs text-gray-400">{{ course.unit_count || 0 }}个技法单元</p>
            <span v-if="course.tag" class="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-coral/10 text-coral">
              {{ course.tag }}
            </span>
          </div>
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
            :class="checkinDates.includes(d) ? 'bg-coral text-white font-bold' : d === todayDate ? 'bg-coral/20 text-coral font-bold' : 'text-gray-600'">
            {{ d }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { isLoggedIn, getCourses } = usePocketBase()

interface Course {
  id: string
  name: string
  description: string
  icon: string
  color: string
  tag: string
  unit_count: number
  cover: string
}

const courses = ref<Course[]>([])
const streakDays = ref(0)
const checkinDates = ref<number[]>([])

// Daily random image (changes daily)
const todayObj = new Date()
const dailySeed = `paint-${todayObj.getFullYear()}-${todayObj.getMonth()}-${todayObj.getDate()}`
const dailyImageUrl = `https://picsum.photos/seed/${dailySeed}/800/400`

// Fallback course image by id
function getCourseImageUrl(courseId: string) {
  return `https://picsum.photos/seed/course-${courseId}/400/240`
}

// Fetch courses (static JSON or PocketBase)
const data = await getCourses()
courses.value = data || []

const todayDate = todayObj.getDate()
const daysInMonth = new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0).getDate()
const firstDayOffset = (new Date(todayObj.getFullYear(), todayObj.getMonth(), 1).getDay() + 6) % 7
</script>
