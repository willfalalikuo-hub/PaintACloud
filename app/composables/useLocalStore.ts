const KEYS = {
  practices: 'pc_practices',
  checkins: 'pc_checkins',
  enrollments: 'pc_enrollments',
  profile: 'pc_profile',
  shared: 'pc_shared_artworks',
} as const

const MAX_PRACTICES = 50

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage write failed:', e)
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function useLocalStore() {
  // --- Practices ---
  function getPractices(): any[] {
    return read(KEYS.practices, [])
  }

  function addPractice(practice: {
    unitId: string
    dayIndex: number
    image: string
    aiScore: any
    selfPassed: boolean
  }): any {
    const practices = getPractices()
    const record = {
      id: genId(),
      ...practice,
      createdAt: new Date().toISOString(),
    }
    practices.push(record)
    if (practices.length > MAX_PRACTICES) {
      practices.splice(0, practices.length - MAX_PRACTICES)
    }
    write(KEYS.practices, practices)
    return record
  }

  // --- Checkins ---
  function getCheckins(): string[] {
    const records = read<{ date: string }[]>(KEYS.checkins, [])
    return records.map(r => r.date)
  }

  function addCheckin(date: string): void {
    const dates = getCheckins()
    if (!dates.includes(date)) {
      const records = read<{ date: string }[]>(KEYS.checkins, [])
      records.push({ date })
      write(KEYS.checkins, records)
    }
  }

  function getStreakDays(): number {
    const dates = getCheckins()
    if (dates.length === 0) return 0
    const sorted = [...dates].sort().reverse()
    let streak = 0
    const d = new Date()
    for (let i = 0; i < 365; i++) {
      if (i > 0) d.setDate(d.getDate() - 1)
      const ds = d.toISOString().split('T')[0]
      if (sorted.includes(ds)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  // --- Enrollments ---
  function getEnrollments(): any[] {
    return read(KEYS.enrollments, [])
  }

  function enrollCourse(courseId: string): void {
    const enrollments = getEnrollments()
    if (!enrollments.find((e: any) => e.courseId === courseId)) {
      enrollments.push({
        courseId,
        currentDay: 1,
        createdAt: new Date().toISOString(),
      })
      write(KEYS.enrollments, enrollments)
    }
  }

  function isEnrolled(courseId: string): boolean {
    return getEnrollments().some((e: any) => e.courseId === courseId)
  }

  function advanceEnrollment(courseId: string, nextDay: number): void {
    const enrollments = getEnrollments()
    const e = enrollments.find((e: any) => e.courseId === courseId)
    if (e) {
      e.currentDay = nextDay
      write(KEYS.enrollments, enrollments)
    }
  }

  function getEnrollment(courseId: string): any {
    return getEnrollments().find((e: any) => e.courseId === courseId) || null
  }

  // --- Completed days (derived from practices) ---
  function getCompletedDays(unitId: string): number[] {
    return getPractices()
      .filter((p: any) => p.unitId === unitId)
      .map((p: any) => p.dayIndex)
  }

  // --- Profile ---
  function getProfile(): any {
    return read(KEYS.profile, { nickname: '画友', streakDays: 0, totalPractices: 0 })
  }

  function updateProfile(updates: Record<string, any>): void {
    const profile = getProfile()
    write(KEYS.profile, { ...profile, ...updates })
  }

  // --- Shared artworks (for social page) ---
  function getSharedArtworks(): any[] {
    return read(KEYS.shared, [])
  }

  function shareArtwork(practiceId: string): void {
    const practices = getPractices()
    const p = practices.find((pr: any) => pr.id === practiceId)
    if (!p) return
    const shared = getSharedArtworks()
    if (shared.some((s: any) => s.practiceId === practiceId)) return
    shared.push({
      id: genId(),
      practiceId: p.id,
      image: p.image,
      aiScore: p.aiScore,
      unitId: p.unitId,
      dayIndex: p.dayIndex,
      sharedAt: new Date().toISOString(),
      likes: 0,
    })
    write(KEYS.shared, shared)
  }

  function likeSharedArtwork(id: string): void {
    const shared = getSharedArtworks()
    const item = shared.find((s: any) => s.id === id)
    if (item) {
      item.likes = (item.likes || 0) + 1
      write(KEYS.shared, shared)
    }
  }

  return {
    getPractices,
    addPractice,
    getCheckins,
    addCheckin,
    getStreakDays,
    getEnrollments,
    getEnrollment,
    enrollCourse,
    isEnrolled,
    advanceEnrollment,
    getCompletedDays,
    getProfile,
    updateProfile,
    getSharedArtworks,
    shareArtwork,
    likeSharedArtwork,
  }
}
