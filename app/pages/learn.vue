<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">我的学习</h1>
      <p class="text-gray-500 mt-1">继续你的绘画之旅</p>
    </header>

    <!-- Not logged in -->
    <div v-if="!isLoggedIn" class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
      <p class="text-gray-400">登录后查看学习进度</p>
      <NuxtLink to="/auth/login" class="inline-block mt-4 bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
        去登录
      </NuxtLink>
    </div>

    <!-- Has enrollments -->
    <div v-else-if="enrollments.length" class="space-y-4">
      <div v-for="item in enrollments" :key="item.enrollment.id" class="bg-white rounded-2xl p-6 border border-gray-200">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-100">
            <span class="text-xl font-bold text-gray-700">{{ item.course?.icon || 'P' }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-800">{{ item.course?.name || '课程' }}</h3>
            <p class="text-xs text-gray-400 mt-1">
              {{ item.currentUnit?.name || '尚未开始' }}
            </p>

            <!-- Progress bar -->
            <div class="mt-3">
              <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Day {{ item.enrollment.current_day || 1 }}</span>
                <span>{{ item.completedCount }} 幅作品</span>
              </div>
              <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gray-900 rounded-full transition-all"
                  :style="{ width: Math.min(((item.enrollment.current_day || 1) / 7) * 100, 100) + '%' }"></div>
              </div>
            </div>
          </div>

          <NuxtLink :to="item.currentUnit ? `/unit/${item.currentUnit.id}` : `/course/${item.enrollment.course_id}`"
            class="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm hover:bg-gray-800 transition-colors shrink-0">
            {{ item.currentUnit ? '继续学习' : '查看课程' }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- No enrollments -->
    <div v-else class="text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
      <p class="text-gray-400">还没有加入课程</p>
      <NuxtLink to="/" class="inline-block mt-4 bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
        浏览课程
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { pb, isLoggedIn, getCourse, getUnit } = usePocketBase()
const { getEnrollments, getCompletedDays } = useLocalStore()

interface EnrollmentItem {
  enrollment: any
  course: any
  currentUnit: any
  completedCount: number
}

const enrollments = ref<EnrollmentItem[]>([])

if (isLoggedIn.value) {
  try {
    if (pb) {
      const userId = pb.authStore.record!.id

      const enrollmentList = await pb.collection('enrollments').getFullList({
        filter: `user_id="${userId}"`,
        sort: '-created'
      })

      for (const e of enrollmentList) {
        let course = null
        let currentUnit = null
        let completedCount = 0

        try { course = await pb.collection('courses').getOne(e.course_id) } catch {}
        if (e.current_unit_id) {
          try { currentUnit = await pb.collection('units').getOne(e.current_unit_id) } catch {}
        }
        try {
          const practices = await pb.collection('practices').getFullList({
            filter: `user_id="${userId}" && unit="${e.current_unit_id || ''}"`
          })
          completedCount = practices.length
        } catch {}

        enrollments.value.push({ enrollment: e, course, currentUnit, completedCount })
      }
    } else {
      // Local mode
      const localEnrollments = getEnrollments()
      for (const e of localEnrollments) {
        const course = await getCourse(e.courseId)
        const currentUnit = course ? (await getUnit(course.id)) : null
        const completedCount = currentUnit ? getCompletedDays(currentUnit.id).length : 0
        enrollments.value.push({
          enrollment: { id: e.courseId, course_id: e.courseId, current_day: e.currentDay || 1 },
          course,
          currentUnit,
          completedCount,
        })
      }
    }
  } catch {}
}
</script>
