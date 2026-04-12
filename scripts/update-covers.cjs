// Add cover field to courses and set themed images
const PocketBase = require('pocketbase').default
const pb = new PocketBase('http://localhost:8090')

async function updateCovers() {
  await pb.collection('_superusers').authWithPassword('admin@paintcloud.com', 'admin123456')

  // Add cover field to courses collection
  try {
    const col = await pb.collections.getOne('courses')
    const hasCover = col.fields.some(f => f.name === 'cover')
    if (!hasCover) {
      col.fields.push({ name: 'cover', type: 'text' })
      await pb.collections.update(col.id, col)
      console.log('Added cover field to courses')
    }
  } catch (e) {
    console.error('Failed to add cover field:', e.message)
  }

  // Course-specific cover images (art-related free images)
  const covers = {
    '通用基础课': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop&q=80',
    '写实素描': 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&h=400&fit=crop&q=80',
  }

  const courses = await pb.collection('courses').getFullList()
  for (const c of courses) {
    const cover = covers[c.name]
    if (cover) {
      await pb.collection('courses').update(c.id, { cover })
      console.log(`Set cover for: ${c.name}`)
    }
  }

  console.log('Done!')
}

updateCovers().catch(e => console.error('Error:', e.message))
