export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { image } = body

  if (!image) {
    throw createError({ statusCode: 400, message: 'Missing image data' })
  }

  // Phase 1: Rule-based scoring
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

function ruleBasedScore(_imageData: string): ScoreResult {
  // Placeholder rule-based scoring
  // In Phase 2, this will be replaced by Claude API multimodal call
  const technique = Math.floor(Math.random() * 3) + 2  // 2-4
  const shape = Math.floor(Math.random() * 3) + 2
  const light = Math.floor(Math.random() * 3) + 2
  const completeness = Math.floor(Math.random() * 3) + 2
  const total = Math.round((technique + shape + light + completeness) / 4 * 10) / 10

  return {
    technique,
    shape,
    light,
    completeness,
    total,
    comment: `综合得分 ${total}/5，继续加油！`,
  }
}
