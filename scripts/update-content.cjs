// Update units with rich teaching content
// Usage: node scripts/update-content.js

const PocketBase = require('pocketbase').default
const pb = new PocketBase('http://localhost:8090')

async function updateContent() {
  await pb.collection('_superusers').authWithPassword('admin@paintcloud.com', 'admin123456')

  // Get all units
  const units = await pb.collection('units').getFullList()
  console.log(`Found ${units.length} units`)

  // ============ 通用基础课 - 线条与排线 (完整7天教材) ============
  const lineUnit = units.find(u => u.name === '线条与排线')
  if (lineUnit) {
    const content = {
      day1: {
        type: 'theory',
        title: '线条基础讲解',
        sections: [
          {
            title: '一、线条的种类',
            text: '绘画中最基本的元素就是线条。线条可以分为以下几类：\n\n**直线** — 最基础的线条，要求平稳均匀。直线练习是一切绘画的起点。运笔时注意用手臂带动，而非仅靠手腕。\n\n**曲线** — 富有韵律感的线条，在绘画中大量使用。曲线练习有助于提高手部控制力和线条流畅度。\n\n**波浪线** — 由连续的曲线组成，用于表现水纹、头发、布料等。绘制时保持均匀的节奏。\n\n**排线** — 有规律地排列线条，用于表现明暗和质感。排线的方向、间距和力度都会影响画面效果。'
          },
          {
            title: '二、正确的握笔姿势',
            text: '**写字式握法** — 和平时写字一样握笔，适合画细节和短线。笔尖与纸面呈60度角。\n\n**侧握式握法** — 将笔杆横放手心，用拇指和食指控制。适合画长线和大面积排线。笔尖与纸面呈30-45度角，可以利用笔的侧面画出较粗的线条。\n\n**上握式握法** — 手握笔的末端，像指挥棒一样。适合画长直线，更容易保持线条平稳。'
          },
          {
            title: '三、练习要点',
            text: '1. **慢速开始** — 先慢慢画，确保每一笔都稳定可控，再逐步提速\n2. **一笔到位** — 尽量一笔画完一条线，不要断断续续\n3. **方向练习** — 水平线、垂直线、45度斜线都要练\n4. **放松手臂** — 紧张的手臂画不出流畅的线条'
          }
        ],
        reference_images: [
          { url: 'https://pixabay.com/get/g5c4e3f2d1a0b9e8f7d6c5b4a3e2f1d0c', caption: '各种线条类型示例', source: 'Pixabay' }
        ],
        tips: ['不要用橡皮 — 接受不完美的线条', '每天练习10分钟线条，一周后会有明显进步']
      },
      day2: {
        type: 'practice',
        title: '直线排线练习',
        description: '在指定区域内练习不同方向的直线排线，注意线条间距均匀。',
        sections: [
          {
            title: '练习步骤',
            text: '**Step 1: 水平排线**\n在画纸上画一个 10x10cm 的方框，在里面从上到下画均匀的水平线。目标：线条间距基本一致，不交叉不重叠。\n\n**Step 2: 垂直排线**\n同上，改为垂直方向。\n\n**Step 3: 斜线排线**\n45度方向排线，这是素描中最常用的排线角度。\n\n**Step 4: 渐变排线**\n从密到疏（或从疏到密）的排线，用来表现明暗过渡。'
          }
        ],
        practice_goal: '完成4组排线练习，每组线条间距均匀、方向一致',
        scoring_criteria: {
          focus: '线条均匀度',
          description: '线条间距是否均匀、方向是否一致、线条是否流畅不断裂'
        }
      },
      day3: {
        type: 'practice',
        title: '交叉排线练习',
        sections: [
          {
            title: '什么是交叉排线',
            text: '交叉排线（Cross Hatching）是用两组或多组方向不同的排线叠加，来表现更深的明暗层次。\n\n**原理**：第一层排线留出的空白区域，被第二层排线部分覆盖，产生更深的色调。叠加的层数越多，色调越深。\n\n**常见组合**：\n- 45度 + 135度（最常用）\n- 水平 + 垂直\n- 三层交叉（更深的暗部）'
          },
          {
            title: '练习步骤',
            text: '**Step 1: 两层交叉**\n画一个方框，先画45度排线，再叠加135度排线。注意第二层线条比第一层稍稀疏。\n\n**Step 2: 渐变交叉**\n画一个方框，左侧只画一层排线（浅），右侧画两层交叉排线（深），中间自然过渡。\n\n**Step 3: 三色调练习**\n画三个方框：单层排线（浅灰）、两层交叉（中灰）、三层交叉（深灰）。'
          }
        ],
        practice_goal: '完成交叉排线的三种灰度表现',
        scoring_criteria: { focus: '灰度层次', description: '能否用交叉排线表现至少3个灰度层次' }
      },
      day4: {
        type: 'practice',
        title: '曲线排线练习',
        sections: [
          {
            title: '曲线排线的运用',
            text: '曲线排线用于表现圆润物体的表面，如球体、圆柱体。线条沿物体表面的弧度走，能自然地表现出立体感。\n\n**要点**：线条的方向要与物体表面的起伏一致。在球体上，排线应该是弧形的，从明暗交界线开始向暗部过渡。'
          },
          {
            title: '练习步骤',
            text: '**Step 1: 同心弧排线**\n画一组同心弧线，模拟球体的表面。\n\n**Step 2: 简单球体**\n画一个圆，用弧形排线表现明暗，光源设在左上方。\n\n**Step 3: 圆柱体**\n画一个圆柱，用横向弧线排线表现其圆润表面。'
          }
        ],
        practice_goal: '用曲线排线为球体上色，表现明暗过渡'
      },
      day5: {
        type: 'practice',
        title: '综合排线 - 球体',
        sections: [
          {
            title: '综合运用排线技法',
            text: '今天将前面学到的所有排线技法综合运用，完成一个完整的球体素描。\n\n**球体明暗分析**：\n- **高光区**（最亮）— 光源直射的区域，留白或少画\n- **亮部** — 高光周围的受光面，用稀疏排线\n- **明暗交界线** — 亮暗转折处，用密集排线\n- **暗部** — 背光面，用交叉排线加深\n- **反光** — 暗部底端略微提亮\n- **投影** — 球体下方的阴影，越远越淡'
          },
          {
            title: '绘画步骤',
            text: '**Step 1** — 画一个正圆轮廓\n**Step 2** — 确定光源方向（建议左上方），标出明暗交界线位置\n**Step 3** — 从明暗交界线开始，向暗部方向画排线\n**Step 4** — 加深暗部和投影\n**Step 5** — 用稀疏排线处理亮部过渡\n**Step 6** — 整体调整，确保明暗过渡自然'
          }
        ],
        practice_goal: '完成一幅有完整明暗关系的球体素描'
      },
      day6: {
        type: 'test',
        title: '综合测试',
        sections: [
          {
            title: '测试要求',
            text: '综合运用本周学到的排线技法，完成以下练习：\n\n**任务**：画一组几何体（球体 + 正方体），要求：\n1. 使用直线排线、交叉排线和曲线排线\n2. 表现出完整的明暗关系（高光/亮部/暗部/投影）\n3. 两个物体的投影方向一致（统一光源）\n4. 画面整体协调\n\n**时间**：30分钟内完成\n\n**评分重点**：排线技法的综合运用能力和明暗关系的准确性'
          }
        ],
        scoring_criteria: {
          technique: '是否正确使用了多种排线技法',
          shape: '几何体形状是否准确',
          light: '明暗关系是否正确',
          completeness: '画面是否完整，有无遗漏'
        }
      },
      day7: {
        type: 'review',
        title: '本周总结',
        sections: [
          {
            title: '本周回顾',
            text: '本周我们学习了：\n\n1. 线条的基本种类（直线/曲线/波浪线）\n2. 正确的握笔姿势\n3. 直线排线和交叉排线\n4. 曲线排线\n5. 综合运用排线表现明暗\n\n**通关标准**：\n- 综合测试得分 >= 3.5/5\n- 自评认为掌握了基础排线技法\n\n**如果未通过**：\n- 回到 Day2-5 重新练习\n- 重点练习薄弱环节'
          }
        ]
      }
    }

    await pb.collection('units').update(lineUnit.id, {
      content,
      days: [
        { index: 1, type: 'theory', title: '线条基础讲解', description: '了解线条的种类和画法要点。学习如何控制手腕和手臂来画出稳定的线条。' },
        { index: 2, type: 'practice', title: '直线排线练习', description: '在指定区域内练习水平、垂直、斜线排线，注意线条间距均匀。' },
        { index: 3, type: 'practice', title: '交叉排线练习', description: '用两组交叉排线表现不同的灰度层次，掌握交叉排线技法。' },
        { index: 4, type: 'practice', title: '曲线排线练习', description: '沿着曲面方向排线，表现物体的立体感，练习球体弧形排线。' },
        { index: 5, type: 'practice', title: '综合排线 - 球体', description: '综合运用排线技法为球体上色，表现完整的明暗关系。' },
        { index: 6, type: 'test', title: '综合测试', description: '30分钟内完成球体+正方体的排线素描，检验综合运用能力。' },
        { index: 7, type: 'review', title: '本周总结', description: '查看本周综合评分，决定是否通关进入下一单元。' }
      ]
    })
    console.log('Updated: 线条与排线 (7天完整教材)')
  }

  // ============ 写实素描 - 素描工具与线条 (完整7天教材) ============
  const sketchUnit = units.find(u => u.name === '素描工具与线条')
  if (sketchUnit) {
    const content = {
      day1: {
        type: 'theory',
        title: '素描工具介绍',
        sections: [
          {
            title: '一、铅笔选择',
            text: '素描铅笔按硬度分级，H系列硬且淡，B系列软且浓：\n\n**2H-H** — 适合画浅色辅助线和起稿\n**HB** — 通用型，适合日常练习\n**2B** — 最常用的素描铅笔，软硬适中\n**4B** — 适合画暗部和排线\n**6B-8B** — 非常软，适合画最深的暗部和粗线条\n\n**建议入门套装**：HB、2B、4B、6B 四支铅笔即可满足大部分需求。'
          },
          {
            title: '二、橡皮和纸笔',
            text: '**软橡皮（可塑橡皮）** — 可以捏成各种形状，用于提亮和减弱线条。不会完全擦除，适合做渐变效果。\n\n**硬橡皮** — 白色块状橡皮，擦除力强，适合擦干净区域。\n\n**纸笔（擦笔）** — 用纸卷成的笔状工具，用于涂抹和柔化排线，制造平滑的渐变效果。'
          },
          {
            title: '三、纸张选择',
            text: '**素描纸** — 表面有细微纹理（"齿"），能抓住铅笔粉末，便于排线和涂抹。建议选择 160-200g 厚度的纸。\n\n**速写纸** — 较薄较光滑，适合快速练习。\n\n**不要用** — 打印纸/复印纸（太光滑，铅笔附着力差）。'
          }
        ],
        tips: ['初学者建议从 2B 铅笔开始练习', '素描纸的粗糙面（正面）适合画素描']
      },
      day2: {
        type: 'practice',
        title: '铅笔灰度练习',
        sections: [
          {
            title: '练习目标',
            text: '学会用不同硬度的铅笔制造均匀的灰度，这是素描明暗控制的基础。\n\n**练习步骤**：\n\n**Step 1** — 在纸上画6个方框（约 3x8cm）\n**Step 2** — 分别用 2H、HB、2B、4B、6B 铅笔，在方框内填满均匀的灰色\n**Step 3** — 注意每个方框的灰度要均匀，不能有明显深浅不一\n**Step 4** — 按灰度从浅到深排列\n\n**要点**：运笔力度保持一致，排线方向统一，不要留白点。'
          }
        ],
        practice_goal: '完成5种铅笔的均匀灰度条，灰度过渡明显',
        scoring_criteria: { focus: '灰度均匀度', description: '每个灰度条是否均匀，不同铅笔的灰度差异是否明显' }
      },
      day3: {
        type: 'practice',
        title: '排线技法精练',
        sections: [
          {
            title: '专业排线技法',
            text: '**均匀排线** — 线条间距相等、力度一致，是最基本的排线方式。练习时注意保持间距均匀。\n\n**渐变排线** — 从密到疏或从疏到密的排线，用来表现渐变的明暗过渡。\n\n**粗细变化排线** — 通过控制力度，让同一条线有粗细变化，增加线条的表现力。\n\n**短排线（点排）** — 用短而密的排线表现质感，适合表现粗糙表面。'
          }
        ],
        practice_goal: '完成4种排线技法各一组'
      },
      day4: {
        type: 'practice',
        title: '涂抹技法',
        sections: [
          {
            title: '涂抹（Stumping）技法',
            text: '涂抹是用纸笔或手指将排线揉开，制造柔和平滑的渐变效果。\n\n**纸笔涂抹** — 用纸笔沿着排线方向轻轻涂抹，可以将明显的线条变得柔和。\n\n**手指涂抹** — 用食指侧面轻轻摩擦画面。注意手指要干净，油脂会影响画面。\n\n**适用场景**：\n- 表现光滑的物体表面（金属、瓷器）\n- 柔化明暗交界线\n- 制造朦胧的光影效果\n\n**不适用**：粗糙质感的物体（木纹、石头）'
          }
        ],
        practice_goal: '用涂抹技法画一个平滑渐变的圆柱体'
      },
      day5: {
        type: 'practice',
        title: '擦提技法',
        sections: [
          {
            title: '橡皮的创造性使用',
            text: '在素描中，橡皮不只是用来"擦错"的工具，它本身就是一种"画笔"。\n\n**提亮技法** — 在已经画好暗部的区域，用可塑橡皮轻轻按压，可以"提"出亮点。用于表现高光、反光。\n\n**擦线技法** — 用硬橡皮的棱角擦出细线，可以表现头发丝、金属反光条等。\n\n**擦出形状** — 先大面积铺暗色调，再用橡皮擦出亮的形状。这种"减法"画法在表现云层、烟雾时非常有效。'
          }
        ],
        practice_goal: '先铺暗色调，再用橡皮提亮出一个球体的形状'
      },
      day6: {
        type: 'test',
        title: '灰度过渡测试',
        sections: [
          {
            title: '测试要求',
            text: '画一个从纯白到纯黑的连续灰度渐变条（约 5x20cm）：\n\n**要求**：\n1. 左端最白（留白），右端最深（6B用力画）\n2. 中间过渡自然，没有明显的灰度跳跃\n3. 可以综合使用排线、涂抹和擦提技法\n4. 整体渐变平滑\n\n**时间**：20分钟\n\n这个练习看似简单，但要做到平滑过渡非常考验对笔触力度的控制。'
          }
        ],
        scoring_criteria: {
          technique: '是否综合运用了多种技法',
          completeness: '灰度过渡是否从白到黑完整',
          light: '渐变是否平滑自然'
        }
      },
      day7: {
        type: 'review',
        title: '本周总结',
        sections: [
          {
            title: '回顾与展望',
            text: '本周学习了素描工具的使用和基本技法：\n\n1. 铅笔硬度选择与灰度表现\n2. 专业排线技法（均匀/渐变/粗细变化/点排）\n3. 涂抹技法\n4. 橡皮的创造性使用（提亮/擦线/减法画法）\n\n**通关标准**：灰度过渡测试得分 >= 3.5/5\n\n**下周预告**：石膏几何体 — 将所学技法运用到实际物体上，开始真正的素描练习！'
          }
        ]
      }
    }

    await pb.collection('units').update(sketchUnit.id, {
      content,
      days: [
        { index: 1, type: 'theory', title: '素描工具介绍', description: '铅笔、橡皮、纸张的选择和正确使用方法。' },
        { index: 2, type: 'practice', title: '铅笔灰度练习', description: '用不同硬度铅笔做出均匀的灰度条，掌握灰度控制。' },
        { index: 3, type: 'practice', title: '排线技法精练', description: '练习均匀排线、渐变排线、粗细变化排线和点排。' },
        { index: 4, type: 'practice', title: '涂抹技法', description: '学习用纸笔和手指涂抹的技法，制造柔和平滑的渐变。' },
        { index: 5, type: 'practice', title: '擦提技法', description: '学习用橡皮提亮和制造高光效果，掌握减法画法。' },
        { index: 6, type: 'test', title: '灰度过渡测试', description: '画一个从白到黑的完整灰度渐变条，检验力度控制。' },
        { index: 7, type: 'review', title: '本周总结', description: '查看评分，决定是否通关进入石膏几何体单元。' }
      ]
    })
    console.log('Updated: 素描工具与线条 (7天完整教材)')
  }

  console.log('\nContent update complete!')
}

updateContent().catch(e => { console.error('Error:', e.message) })
