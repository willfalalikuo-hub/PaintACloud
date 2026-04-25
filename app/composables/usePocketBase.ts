import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || ''
const pb = pbUrl ? new PocketBase(pbUrl) : null

// Static data (always available, no backend needed)
import staticCourses from '~/data/courses.json'
import staticUnits from '~/data/units.json'

function fetchStaticCourses() {
  return staticCourses as any[]
}

function fetchStaticUnits() {
  return staticUnits as any[]
}

// Local auth helpers (for static mode without PocketBase)
const LOCAL_USERS_KEY = 'pc_users'
const LOCAL_SESSION_KEY = 'pc_session'

function getLocalUsers(): Array<{ email: string; password: string; name: string; id: string }> {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]')
  } catch { return [] }
}

function getLocalSession() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || 'null')
  } catch { return null }
}

function setLocalSession(u: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(u))
}

function clearLocalSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_SESSION_KEY)
}

export function usePocketBase() {
  const user = useState('pb_user', () => {
    if (pb?.authStore.record) return pb.authStore.record
    return getLocalSession()
  })

  const isLoggedIn = computed(() => !!user.value)

  async function register(email: string, password: string, nickname: string) {
    if (pb) {
      const record = await pb.collection('users').create({
        email, password, passwordConfirm: password, name: nickname,
      })
      await login(email, password)
      return record
    }
    // Local mode
    const users = getLocalUsers()
    if (users.some(u => u.email === email)) {
      throw new Error('邮箱已存在')
    }
    const record = { id: Date.now().toString(36), email, name: nickname }
    users.push({ ...record, password })
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
    setLocalSession(record)
    user.value = record
    return record
  }

  async function login(email: string, password: string) {
    if (pb) {
      const authData = await pb.collection('users').authWithPassword(email, password)
      user.value = authData.record
      return authData
    }
    // Local mode
    const users = getLocalUsers()
    const found = users.find(u => u.email === email && u.password === password)
    if (!found) {
      throw new Error('邮箱或密码错误')
    }
    const record = { id: found.id, email: found.email, name: found.name }
    setLocalSession(record)
    user.value = record
    return { record }
  }

  function logout() {
    if (pb) pb.authStore.clear()
    clearLocalSession()
    user.value = null
  }

  // Data fetching: static JSON first, fallback to PocketBase
  async function getCourses() {
    try {
      if (pb && pbUrl) {
        return await pb.collection('courses').getFullList()
      }
    } catch {}
    return await fetchStaticCourses()
  }

  async function getCourse(id: string) {
    try {
      if (pb && pbUrl) {
        return await pb.collection('courses').getOne(id)
      }
    } catch {}
    const all = await fetchStaticCourses()
    return all.find((c: any) => c.id === id) || null
  }

  async function getUnits(courseId: string) {
    try {
      if (pb && pbUrl) {
        return await pb.collection('units').getFullList({ filter: `course_id="${courseId}"`, sort: 'unit_index' })
      }
    } catch {}
    const all = await fetchStaticUnits()
    return all.filter((u: any) => u.course_id === courseId).sort((a: any, b: any) => a.unit_index - b.unit_index)
  }

  async function getUnit(id: string) {
    try {
      if (pb && pbUrl) {
        return await pb.collection('units').getOne(id)
      }
    } catch {}
    const all = await fetchStaticUnits()
    return all.find((u: any) => u.id === id) || null
  }

  return {
    pb: pb as any,
    user,
    register,
    login,
    logout,
    isLoggedIn,
    getCourses,
    getCourse,
    getUnits,
    getUnit,
  }
}
