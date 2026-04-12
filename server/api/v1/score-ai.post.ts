// Phase 2: AI-powered scoring using Claude multimodal API
// This endpoint sends the painting to Claude for semantic-level evaluation

interface AIScoreRequest {
  image: string  // base64 encoded image
  courseName?: string
  techniqueName?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.public.claudeApiKey || process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Claude API key not configured. Set ANTHROPIC_API_KEY env variable.',
    })
  }

  const { image, courseName, techniqueName } = await readBody(event) as AIScoreRequest

  if (!image) {
    throw createError({ statusCode: 400, message: 'Missing image data' })
  }

  const prompt = `你是一位专业的绘画评分老师。请对这幅画作进行评分。

课程：${courseName || '未指定'}
技法：${techniqueName || '未指定'}

请从以下4个维度评分（每项1-5分），并给出具体改进建议：

1. 技法准确度 - 本次练习的特定技法用对了没
2. 造型能力 - 形体/比例是否合理
3. 光影表现 - 明暗关系是否正确
4. 整体完成度 - 画面是否完整

请以 JSON 格式回复：
{
  "technique": 分数,
  "shape": 分数,
  "light": 分数,
  "completeness": 分数,
  "comment": "总体评价",
  "suggestions": ["建议1", "建议2"]
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: image.replace(/^data:image\/\w+;base64,/, ''),
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()
    const textContent = data.content?.[0]?.text || ''

    // Try to parse JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const scores = JSON.parse(jsonMatch[0])
      return {
        code: 0,
        message: 'success',
        data: scores,
      }
    }

    return {
      code: 0,
      message: 'success',
      data: {
        technique: 3,
        shape: 3,
        light: 3,
        completeness: 3,
        comment: textContent,
        suggestions: [],
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `AI scoring failed: ${error}`,
    })
  }
})
