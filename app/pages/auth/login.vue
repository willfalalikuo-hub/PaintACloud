<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800">paintCloud</h1>
        <p class="text-gray-400 mt-2">绘画界的百词斩</p>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-gray-200">
        <div v-if="isRegister" class="mb-6">
          <h2 class="text-xl font-bold text-gray-800">注册</h2>
          <p class="text-sm text-gray-400 mt-1">创建账号开始绘画之旅</p>
        </div>
        <div v-else class="mb-6">
          <h2 class="text-xl font-bold text-gray-800">登录</h2>
          <p class="text-sm text-gray-400 mt-1">欢迎回来</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="isRegister">
            <label class="block text-sm text-gray-500 mb-1">昵称</label>
            <input v-model="nickname" type="text" required
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="你的昵称" />
          </div>

          <div>
            <label class="block text-sm text-gray-500 mb-1">邮箱</label>
            <input v-model="email" type="email" required
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="your@email.com" />
          </div>

          <div>
            <label class="block text-sm text-gray-500 mb-1">密码</label>
            <input v-model="password" type="password" required minlength="8"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-gray-900 focus:outline-none text-sm"
              placeholder="至少8位" />
          </div>

          <div v-if="errorMsg" class="text-red-400 text-xs">{{ errorMsg }}</div>

          <button type="submit" :disabled="loading"
            class="w-full bg-gray-900 text-white py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">
            {{ loading ? '请稍候...' : (isRegister ? '注册' : '登录') }}
          </button>
        </form>

        <div class="text-center mt-4">
          <button @click="isRegister = !isRegister" class="text-sm text-gray-400 hover:text-gray-900 transition-colors">
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login, register, isLoggedIn } = usePocketBase()
const router = useRouter()

const isRegister = ref(false)
const email = ref('')
const password = ref('')
const nickname = ref('')
const loading = ref(false)
const errorMsg = ref('')

if (isLoggedIn.value) {
  router.push('/')
}

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    if (isRegister.value) {
      if (!nickname.value.trim()) {
        errorMsg.value = '请输入昵称'
        return
      }
      await register(email.value, password.value, nickname.value)
    } else {
      await login(email.value, password.value)
    }
    router.push('/')
  } catch (e: any) {
    const msg = e?.message || ''
    if (msg.includes('email') || msg.includes('邮箱已存在')) {
      errorMsg.value = '邮箱已存在'
    } else if (msg.includes('密码') || msg.includes('password')) {
      errorMsg.value = '邮箱或密码错误'
    } else {
      errorMsg.value = msg || '操作失败，请检查输入'
    }
  } finally {
    loading.value = false
  }
}
</script>
