import PocketBase from 'pocketbase'

const pbUrl = import.meta.env.VITE_POCKETBASE_URL || ''
const pb = pbUrl ? new PocketBase(pbUrl) : null

// Static data (always available, no backend needed)
async function fetchStaticCourses() {
  const res = await $fetch<any[]>('/data/courses.json')
  return res
}

async function fetchStaticUnits() {
  const res = await $fetch<any[]>('/data/units.json')
  return res
}

export function usePocketBase() {
  const user = useState('pb_user', () => pb?.authStore.record || null)

  const isLoggedIn = computed(() => !!user.value)

  async function register(email: string, password: string, nickname: string) {
    if (!pb) return null
    const record = await pb.collection('users').create({
      email, password, passwordConfirm: password, name: nickname,
    })
    await login(email, password)
    return record
  }

  async function login(email: string, password: string) {
    if (!pb) return null
    const authData = await pb.collection('users').authWithPassword(email, password)
    user.value = authData.record
    return authData
  }

  function logout() {
    if (pb) pb.authStore.clear()
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
