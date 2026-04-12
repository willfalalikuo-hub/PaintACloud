import PocketBase from 'pocketbase'

const pb = new PocketBase('http://localhost:8090')

export function usePocketBase() {
  const user = useState('pb_user', () => pb.authStore.record)

  async function register(email: string, password: string, nickname: string) {
    const record = await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name: nickname,
    })
    // Auto login after register
    await login(email, password)
    return record
  }

  async function login(email: string, password: string) {
    const authData = await pb.collection('users').authWithPassword(email, password)
    user.value = authData.record
    return authData
  }

  function logout() {
    pb.authStore.clear()
    user.value = null
  }

  const isLoggedIn = computed(() => !!user.value)

  return { pb, user, register, login, logout, isLoggedIn }
}
