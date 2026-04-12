<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto">
    <header class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800">我的</h1>
    </header>

    <!-- User info -->
    <div class="bg-white rounded-2xl p-6 shadow-sm mb-6">
      <div v-if="isLoggedIn" class="flex items-center gap-4">
        <div class="w-16 h-16 bg-lavender/20 rounded-full flex items-center justify-center">
          <span class="text-xl font-bold text-lavender">{{ user?.name?.charAt(0) || 'U' }}</span>
        </div>
        <div class="flex-1">
          <h2 class="font-bold text-gray-800 text-lg">{{ user?.name || '用户' }}</h2>
          <p class="text-gray-400 text-sm">{{ user?.email }}</p>
        </div>
        <button @click="handleLogout" class="text-sm text-gray-400 hover:text-coral transition-colors">退出</button>
      </div>
      <div v-else class="flex items-center gap-4">
        <div class="w-16 h-16 bg-lavender/20 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        </div>
        <div>
          <h2 class="font-bold text-gray-800 text-lg">未登录</h2>
          <p class="text-gray-400 text-sm">登录后解锁完整功能</p>
        </div>
        <NuxtLink to="/auth/login" class="ml-auto bg-coral text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-coral/90 transition-colors">
          登录
        </NuxtLink>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-2xl font-bold text-coral">{{ practices.length }}</p>
        <p class="text-xs text-gray-400 mt-1">作品</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-2xl font-bold text-lavender">{{ enrollCount }}</p>
        <p class="text-xs text-gray-400 mt-1">课程</p>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm text-center">
        <p class="text-2xl font-bold" style="color: #00B4D8">{{ streakDays }}</p>
        <p class="text-xs text-gray-400 mt-1">连续打卡</p>
      </div>
    </div>

    <!-- My artworks -->
    <div class="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h2 class="font-bold text-gray-800">我的作品集</h2>
        <NuxtLink to="/canvas" class="text-sm text-coral hover:underline">去画画</NuxtLink>
      </div>

      <div v-if="practices.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        <div v-for="p in practices" :key="p.id" class="bg-gray-50 rounded-xl overflow-hidden">
          <div class="aspect-square bg-gray-100 flex items-center justify-center relative">
            <img v-if="p.image" :src="pb.files.getURL(p, p.image)" class="w-full h-full object-cover" />
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <!-- Score badge -->
            <div v-if="p.ai_score" class="absolute bottom-1 right-1 bg-white/90 rounded-full px-1.5 py-0.5 text-xs font-bold"
              :class="getScoreObj(p)?.total >= 7 ? 'text-coral' : 'text-gray-400'">
              {{ getScoreObj(p)?.total || '-' }}
            </div>
          </div>
          <div class="p-2">
            <p class="text-xs text-gray-400 truncate">Day {{ p.day_index }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-gray-300">
        <p class="text-sm">还没有作品</p>
        <NuxtLink to="/" class="inline-block mt-2 text-sm text-coral hover:underline">去选个课程开始吧</NuxtLink>
      </div>
    </div>

    <!-- Menu -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-20 md:mb-8">
      <NuxtLink v-for="item in menuItems" :key="item.label" :to="item.to"
        class="flex items-center px-6 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
        <span class="text-gray-600">{{ item.label }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 ml-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { pb, user, isLoggedIn, logout } = usePocketBase()
const router = useRouter()

const practices = ref<any[]>([])
const enrollCount = ref(0)
const streakDays = ref(0)

const menuItems = [
  { label: '学习进度', to: '/learn' },
  { label: '设置', to: '/' },
]

if (isLoggedIn.value) {
  try {
    practices.value = await pb.collection('practices').getFullList({
      filter: `user_id="${pb.authStore.record?.id}"`,
      sort: '-created'
    })
    const enrollments = await pb.collection('enrollments').getFullList({
      filter: `user_id="${pb.authStore.record?.id}"`
    })
    enrollCount.value = enrollments.length

    // Calculate streak
    const checkins = await pb.collection('checkins').getFullList({
      filter: `user_id="${pb.authStore.record?.id}"`,
      sort: '-date'
    })
    if (checkins.length) {
      let streak = 0
      const today = new Date()
      for (let i = 0; i < 365; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().split('T')[0]
        if (checkins.some((c: any) => c.date === ds)) {
          streak++
        } else if (i > 0) {
          break
        }
      }
      streakDays.value = streak
    }
  } catch {}
}

function handleLogout() {
  logout()
  router.push('/')
}

function getScoreObj(p: any) {
  if (!p.ai_score) return null
  return typeof p.ai_score === 'string' ? JSON.parse(p.ai_score) : p.ai_score
}
</script>
