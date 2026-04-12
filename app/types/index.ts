export interface Course {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: string
  color: string
  tag: string
  tagClass: string
  unitCount: number
  units: Unit[]
}

export interface Unit {
  id: string
  courseId: string
  index: number
  name: string
  description: string
  keyPoints: string[]
  days: Day[]
  referenceImages: string[]
}

export interface Day {
  index: number
  type: 'theory' | 'practice' | 'test' | 'review'
  title: string
  description: string
  referenceImage?: string
  steps?: Step[]
}

export interface Step {
  index: number
  title: string
  description: string
  referenceImage: string
}

export interface Practice {
  id: string
  userId: string
  courseId: string
  unitId: string
  dayIndex: number
  stepIndex?: number
  imageUrl: string
  aiScore?: AIScore
  selfPassed: boolean
  createdAt: string
}

export interface AIScore {
  technique: number
  shape: number
  light: number
  completeness: number
  total: number
  comment: string
  suggestions?: string[]
}

export interface Checkin {
  userId: string
  date: string
  practiceId: string
}

export interface UserProfile {
  id: string
  nickname: string
  avatar: string
  coins: number
  streakDays: number
  createdAt: string
}
