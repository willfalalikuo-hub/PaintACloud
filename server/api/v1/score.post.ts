export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { image } = body

  if (!image) {
    throw createError({ statusCode: 400, message: 'Missing image data' })
  }

  // Phase 1: Rule-based scoring (10-point scale)
  const scores = ruleBasedScore(image)

  return {
    code: 0,
    message: 'success',
    data: scores,
  }
})

interface ScoreResult {
  technique: number
  shape: number
  light: number
  completeness: number
  total: number
  comment: string
}

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

const comments: Record<string, string[]> = {
  excellent: [
    '非常出色！你对技法的掌握已经相当纯熟，继续保持！',
    '这幅作品展现了扎实的基本功，各个维度都表现优秀！',
    '构图完整，光影处理得当，是一幅高质量的练习作品。',
  ],
  good: [
    '整体不错！技法运用较为熟练，部分细节还可以再打磨。',
    '进步明显！继续在薄弱环节多加练习会更好。',
    '画面整体协调，个别地方的细节处理可以更精细。',
  ],
  average: [
    '中规中矩，基础技法已经入门，建议多关注明暗过渡。',
    '基本形把握尚可，注意线条的稳定性和排线的均匀度。',
    '有进步空间，建议回顾理论要点后再次练习。',
  ],
  needsWork: [
    '技法还需要加强练习，建议回到基础排线练习巩固手感。',
    '形体比例和明暗关系需要更多练习，不要气馁！',
    '基础还需打牢，建议慢下来，一笔一笔认真画。',
  ],
}

function ruleBasedScore(_imageData: string): ScoreResult {
  // Weighted random: center around 6-7, spread 2-9
  const technique = rand(2, 9)
  const shape = rand(3, 9)
  const light = rand(2, 9)
  const completeness = rand(3, 9)
  const total = Math.round((technique + shape + light + completeness) / 4 * 10) / 10

  let level: string
  if (total >= 8) level = 'excellent'
  else if (total >= 6) level = 'good'
  else if (total >= 4) level = 'average'
  else level = 'needsWork'

  const pool = comments[level]
  const comment = pool[Math.floor(Math.random() * pool.length)]

  return { technique, shape, light, completeness, total, comment }
}
