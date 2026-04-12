// PocketBase seed script - creates collections and seed data
// Usage: node scripts/seed.js

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://localhost:8090')

async function seed() {
  // Auth as superuser
  await pb.collection('_superusers').authWithPassword('admin@paintcloud.com', 'admin123456')
  console.log('Authenticated as superuser')

  // 1. Create courses collection
  let coursesCollection
  try {
    coursesCollection = await pb.collections.create({
      name: 'courses',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'difficulty', type: 'text' },
        { name: 'icon', type: 'text' },
        { name: 'color', type: 'text' },
        { name: 'tag', type: 'text' },
        { name: 'tag_class', type: 'text' },
        { name: 'unit_count', type: 'number' },
      ],
      listRule: '',
      viewRule: '',
    })
    console.log('Created courses collection')
  } catch (e) {
    console.error('courses:', e.message)
    return
  }

  // 2. Create units collection
  let unitsCollection
  try {
    unitsCollection = await pb.collections.create({
      name: 'units',
      type: 'base',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
        { name: 'course', type: 'relation', required: true, options: { collectionId: coursesCollection.id, maxSelect: 1 } },
        { name: 'unit_index', type: 'number', required: true },
        { name: 'key_points', type: 'json' },
        { name: 'days', type: 'json' },
      ],
      listRule: '',
      viewRule: '',
    })
    console.log('Created units collection')
  } catch (e) {
    console.error('units:', e.message)
    return
  }

  // 3. Create enrollments collection
  try {
    await pb.collections.create({
      name: 'enrollments',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'course', type: 'relation', required: true, options: { collectionId: coursesCollection.id, maxSelect: 1 } },
        { name: 'current_unit', type: 'relation', options: { collectionId: unitsCollection.id, maxSelect: 1 } },
        { name: 'current_day', type: 'number' },
        { name: 'status', type: 'text' },
      ],
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
    })
    console.log('Created enrollments collection')
  } catch (e) {
    console.error('enrollments:', e.message)
  }

  // 4. Create practices collection
  try {
    await pb.collections.create({
      name: 'practices',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'unit', type: 'relation', options: { collectionId: unitsCollection.id, maxSelect: 1 } },
        { name: 'day_index', type: 'number' },
        { name: 'image', type: 'file', options: { maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/png', 'image/jpeg', 'image/webp'] } },
        { name: 'ai_score', type: 'json' },
        { name: 'self_passed', type: 'bool' },
      ],
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
      updateRule: '@request.auth.id != "" && user = @request.auth.id',
    })
    console.log('Created practices collection')
  } catch (e) {
    console.error('practices:', e.message)
  }

  // 5. Create checkins collection
  try {
    await pb.collections.create({
      name: 'checkins',
      type: 'base',
      fields: [
        { name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', maxSelect: 1 } },
        { name: 'date', type: 'text', required: true },
        { name: 'practice', type: 'relation', options: { collectionId: 'practices', maxSelect: 1 } },
      ],
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: '@request.auth.id != "" && user = @request.auth.id',
    })
    console.log('Created checkins collection')
  } catch (e) {
    console.error('checkins:', e.message)
  }

  // === Seed course data ===
  console.log('\nSeeding course data...')

  // Course 1: Basic
  const basicCourse = await pb.collection('courses').create({
    name: '通用基础课',
    description: '从零开始学习绘画基础，掌握线条、形体、光影等核心技能。适合完全零基础的初学者。',
    category: '基础',
    difficulty: 'beginner',
    icon: 'T',
    color: '#FF6B6B',
    tag: '免费',
    tag_class: 'bg-coral/10 text-coral',
    unit_count: 6,
  })
  console.log('Created course:', basicCourse.name)

  // Course 2: Sketch
  const sketchCourse = await pb.collection('courses').create({
    name: '写实素描',
    description: '系统学习素描技法，从几何体到人物肖像，逐步提升造型能力。',
    category: '传统',
    difficulty: 'intermediate',
    icon: 'P',
    color: '#666666',
    tag: '免费',
    tag_class: 'bg-coral/10 text-coral',
    unit_count: 2,
  })
  console.log('Created course:', sketchCourse.name)

  // Seed units for basic course
  const basicUnits = [
    {
      name: '线条与排线', unit_index: 1,
      description: '学习各种线条的画法，掌握排线技巧，这是所有绘画的基础。',
      key_points: ['直线、曲线、波浪线的稳定绘制', '排线的方向和疏密控制', '用线条表现明暗过渡'],
      days: [
        { index: 1, type: 'theory', title: '线条基础讲解', description: '了解线条的种类和画法要点。' },
        { index: 2, type: 'practice', title: '直线排线练习', description: '在指定区域内练习不同方向的直线排线。' },
        { index: 3, type: 'practice', title: '交叉排线练习', description: '用两组交叉排线表现不同的灰度层次。' },
        { index: 4, type: 'practice', title: '曲线排线练习', description: '沿着曲面方向排线，表现物体的立体感。' },
        { index: 5, type: 'practice', title: '综合排线 - 球体', description: '运用排线技法为球体上色。' },
        { index: 6, type: 'test', title: '综合测试', description: '综合运用本周所学排线技法。' },
        { index: 7, type: 'review', title: 'AI评分总结', description: '查看本周综合评分。' },
      ],
    },
    {
      name: '几何体光影', unit_index: 2,
      description: '学习光影基础原理，用明暗关系表现几何体的立体感。',
      key_points: ['光源方向与明暗面判断', '高光、明暗交界线、反光、投影', '三大面五调子的实际运用'],
      days: [
        { index: 1, type: 'theory', title: '光影原理讲解', description: '理解光如何影响物体表面。' },
        { index: 2, type: 'practice', title: '球体光影', description: '画出球体的光影关系。' },
        { index: 3, type: 'practice', title: '正方体光影', description: '画出正方体的光影。' },
        { index: 4, type: 'practice', title: '圆柱体光影', description: '画出圆柱体的光影。' },
        { index: 5, type: 'practice', title: '组合几何体', description: '画多个几何体的组合。' },
        { index: 6, type: 'test', title: '综合测试', description: '独立完成一幅几何体组合的光影素描。' },
        { index: 7, type: 'review', title: 'AI评分总结', description: '查看本周评分。' },
      ],
    },
    {
      name: '静物质感', unit_index: 3,
      description: '学习用不同笔触表现各种材质的质感。',
      key_points: ['光滑表面 vs 粗糙表面的表现', '透明材质（玻璃）的画法', '柔软材质（布料）的表现'],
      days: [
        { index: 1, type: 'theory', title: '质感表现原理', description: '不同材质的视觉特征和表现方法。' },
        { index: 2, type: 'practice', title: '金属质感', description: '画一个金属杯子。' },
        { index: 3, type: 'practice', title: '木质质感', description: '画木纹。' },
        { index: 4, type: 'practice', title: '玻璃质感', description: '画玻璃杯。' },
        { index: 5, type: 'practice', title: '布料质感', description: '画折叠的布料。' },
        { index: 6, type: 'test', title: '综合测试', description: '画一组不同材质的静物组合。' },
        { index: 7, type: 'review', title: 'AI评分总结', description: '查看评分。' },
      ],
    },
  ]

  for (const u of basicUnits) {
    await pb.collection('units').create({ ...u, course: basicCourse.id })
    console.log('  Created unit:', u.name)
  }

  // Seed units for sketch course
  const sketchUnits = [
    {
      name: '素描工具与线条', unit_index: 1,
      description: '了解素描工具的正确使用方法，掌握专业素描线条技法。',
      key_points: ['铅笔硬度选择', '握笔姿势', '专业排线技法'],
      days: [
        { index: 1, type: 'theory', title: '素描工具介绍', description: '铅笔、橡皮、纸张的选择和使用。' },
        { index: 2, type: 'practice', title: '铅笔灰度练习', description: '用不同硬度铅笔做出均匀的灰度条。' },
        { index: 3, type: 'practice', title: '排线技法', description: '练习均匀排线、交叉排线。' },
        { index: 4, type: 'practice', title: '涂抹技法', description: '学习用纸笔和手指涂抹的技法。' },
        { index: 5, type: 'practice', title: '擦提技法', description: '用橡皮提亮和制造高光效果。' },
        { index: 6, type: 'test', title: '灰度测试', description: '画出从白到黑的完整灰度过渡。' },
        { index: 7, type: 'review', title: 'AI评分总结', description: '查看评分。' },
      ],
    },
    {
      name: '石膏几何体', unit_index: 2,
      description: '通过石膏几何体练习，深入理解光影与形体。',
      key_points: ['精确测量和比例', '光影分析的完整流程', '背景和环境的处理'],
      days: [
        { index: 1, type: 'theory', title: '石膏几何体分析方法', description: '观察方法、测量比例、光影分析。' },
        { index: 2, type: 'practice', title: '石膏球体', description: '完整画一个石膏球体。' },
        { index: 3, type: 'practice', title: '石膏正方体', description: '完整画一个石膏正方体。' },
        { index: 4, type: 'practice', title: '石膏圆柱', description: '完整画一个石膏圆柱。' },
        { index: 5, type: 'practice', title: '石膏组合', description: '画两个石膏几何体的组合。' },
        { index: 6, type: 'test', title: '综合测试', description: '画三个石膏几何体的完整组合。' },
        { index: 7, type: 'review', title: 'AI评分总结', description: '查看评分。' },
      ],
    },
  ]

  for (const u of sketchUnits) {
    await pb.collection('units').create({ ...u, course: sketchCourse.id })
    console.log('  Created unit:', u.name)
  }

  console.log('\nSeed complete!')
}

seed().catch(e => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})
