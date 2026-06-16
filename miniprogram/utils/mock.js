/*
 * ========================================
 *  美甲款式 Mock 数据 — 2024/2025 主流趋势
 *  猫眼 · 冰透 · 腮红 · 镜面 · 晕染 · 极简 · 法式
 * ========================================
 */

const categories = [
  { id: 'all',       name: '全部',     icon: '✨' },
  { id: 'magnetic',  name: '猫眼',     icon: '🧲' },
  { id: 'jelly',     name: '冰透',     icon: '🧊' },
  { id: 'blush',     name: '腮红甲',   icon: '🌸' },
  { id: 'chrome',    name: '镜面',     icon: '🪩' },
  { id: 'ombre',     name: '晕染',     icon: '🎨' },
  { id: 'french',    name: '法式',     icon: '🤍' },
  { id: 'minimal',   name: '极简',     icon: '◽' },
  { id: 'gemstone',  name: '宝石风',   icon: '💎' },
  { id: 'floral',    name: '花卉',     icon: '🌷' },
  { id: 'matte',     name: '磨砂',     icon: '🪻' },
]

const categoryNames = {
  magnetic: '猫眼', jelly: '冰透', blush: '腮红甲', chrome: '镜面',
  ombre: '晕染', french: '法式', minimal: '极简', gemstone: '宝石风',
  floral: '花卉', matte: '磨砂',
}

const difficulties = ['easy', 'medium', 'hard']
const difficultyLabels = { easy: '入门', medium: '进阶', hard: '高阶' }

/*
 * ========================================
 *  20 款主流美甲款式
 *  每款：精准色彩 + 专业描述 + 真实趋势
 * ========================================
 */
const STYLE_DEFS = [
  // ── 猫眼系列 ──
  {
    _id: 'style_1', name: '深蓝银河猫眼',
    category: 'magnetic',
    colors: ['#1B2838', '#2D4A7A', '#5B8BD4', '#A8C8F0'],
    desc: '深邃夜空蓝底搭配磁石猫眼效果，一道银河光带横贯甲面，冷艳高级',
    tags: ['猫眼', '深蓝', '高级感', '显白'],
    difficulty: 'medium',
    vibe: '冷艳 | 高级 | 适合秋冬',
  },
  {
    _id: 'style_2', name: '酒红琥珀猫眼',
    category: 'magnetic',
    colors: ['#722F37', '#A0525A', '#C8797E', '#DEA5A5'],
    desc: '浓郁红酒底色，暖琥珀色猫眼光带，如陈年佳酿般醇厚迷人',
    tags: ['猫眼', '酒红', '轻奢', '约会'],
    difficulty: 'medium',
    vibe: '醇厚 | 轻奢 | 适合约会',
  },
  {
    _id: 'style_3', name: '灰月光石猫眼',
    category: 'magnetic',
    colors: ['#8B8B8B', '#B0B0B0', '#D4D4D4', '#F0F0F0'],
    desc: '高级灰底色配月光白猫眼光泽，低调中透露冷清质感',
    tags: ['猫眼', '灰色', '极简', '通勤'],
    difficulty: 'medium',
    vibe: '冷清 | 极简 | 适合通勤',
  },

  // ── 冰透系列 ──
  {
    _id: 'style_4', name: '冰透粉晶',
    category: 'jelly',
    colors: ['#F5E6E8', '#FADDE0', '#FFD1D7', '#FFE8EC'],
    desc: '清透如冰的粉晶质感，若隐若现的温柔，指尖透出健康光泽',
    tags: ['冰透', '粉色', '清纯', '日常'],
    difficulty: 'easy',
    vibe: '清透 | 温柔 | 适合日常',
  },
  {
    _id: 'style_5', name: '冰茶棕',
    category: 'jelly',
    colors: ['#D4C5B9', '#E0D3C8', '#ECDED4', '#F5EDE6'],
    desc: '冰透质感的茶棕色，如一杯冷泡乌龙，素雅知性',
    tags: ['冰透', '棕色', '气质', 'OL'],
    difficulty: 'easy',
    vibe: '知性 | 素雅 | 适合职场',
  },
  {
    _id: 'style_6', name: '冰透葡萄紫',
    category: 'jelly',
    colors: ['#D5C6E0', '#E0D4EB', '#EBE2F3', '#F5F0F8'],
    desc: '清透葡萄紫，仿佛冻葡萄果肉般的晶莹剔透，俏皮又温柔',
    tags: ['冰透', '紫色', '甜美', '春夏'],
    difficulty: 'easy',
    vibe: '甜美 | 晶莹 | 适合春夏',
  },

  // ── 腮红甲系列 ──
  {
    _id: 'style_7', name: '蜜桃腮红',
    category: 'blush',
    colors: ['#FDE0D9', '#FCC9BB', '#FAAE9C', '#FCE4DB'],
    desc: '从甲面中央晕开的蜜桃粉，像脸颊透出的自然红晕，元气减龄',
    tags: ['腮红甲', '蜜桃', '元气', '约会'],
    difficulty: 'medium',
    vibe: '元气 | 减龄 | 适合约会',
  },
  {
    _id: 'style_8', name: '玫瑰豆沙腮红',
    category: 'blush',
    colors: ['#E8D5D7', '#DDBFC2', '#D4A9AD', '#C89499'],
    desc: '豆沙玫瑰色从甲心向外淡出，低饱和高级温柔，黄皮友好',
    tags: ['腮红甲', '豆沙', '温柔', '显白'],
    difficulty: 'medium',
    vibe: '温柔 | 显白 | 黄皮友好',
  },

  // ── 镜面系列 ──
  {
    _id: 'style_9', name: '液态银镜面',
    category: 'chrome',
    colors: ['#C0C0C0', '#D4D4D4', '#E8E8E8', '#FAFAFA'],
    desc: '高反射液态金属银，冷酷未来感，指尖的流动光泽',
    tags: ['镜面', '银色', '未来感', '个性'],
    difficulty: 'hard',
    vibe: '酷感 | 未来 | 适合派对',
  },
  {
    _id: 'style_10', name: '香槟金镜面',
    category: 'chrome',
    colors: ['#D4AF37', '#E0C068', '#EDD9A3', '#FAF0D7'],
    desc: '柔和香槟金镜面光泽，温暖贵气但不刺眼，日常也能驾驭',
    tags: ['镜面', '金色', '贵气', '百搭'],
    difficulty: 'hard',
    vibe: '轻奢 | 百搭 | 日常可驾驭',
  },

  // ── 晕染系列 ──
  {
    _id: 'style_11', name: '水墨大理石晕染',
    category: 'ombre',
    colors: ['#F5F5F5', '#D5D5D5', '#A0A0A0', '#666666'],
    desc: '黑白灰三色水墨晕染，大理石的天然纹理，东方留白美学',
    tags: ['晕染', '大理石', '国风', '气质'],
    difficulty: 'hard',
    vibe: '东方 | 留白 | 气质首选',
  },
  {
    _id: 'style_12', name: '日落海岸渐变',
    category: 'ombre',
    colors: ['#FF8C69', '#FFB89A', '#FFD4C4', '#FFF0E8'],
    desc: '日落橙到贝壳粉的温暖渐变，如海岸线的温柔暮色',
    tags: ['渐变', '橙色', '暖调', '度假'],
    difficulty: 'medium',
    vibe: '温暖 | 度假感 | 适合夏季',
  },

  // ── 法式系列 ──
  {
    _id: 'style_13', name: '黑白撞色法式',
    category: 'french',
    colors: ['#FAFAFA', '#F0F0F0', '#262626', '#000000'],
    desc: '经典法式白边的黑白反转演绎，极简线条勾勒指尖轮廓',
    tags: ['法式', '黑白', '极简', '通勤'],
    difficulty: 'easy',
    vibe: '极简 | 通勤 | 不出错',
  },
  {
    _id: 'style_14', name: '彩色糖豆法式',
    category: 'french',
    colors: ['#FFB3C6', '#A8D8EA', '#C3E8CD', '#FFF3CD'],
    desc: '五颜六色的法式指尖，每指不同色，像彩色糖豆般俏皮可爱',
    tags: ['法式', '彩色', '俏皮', '春夏'],
    difficulty: 'easy',
    vibe: '俏皮 | 活泼 | 适合度假',
  },

  // ── 极简系列 ──
  {
    _id: 'style_15', name: '一根金线',
    category: 'minimal',
    colors: ['#FAF5F0', '#FFFBF7', '#D4AF37', '#F5EDE0'],
    desc: '裸色打底，一根细金线从中划过——少即是多的高级感',
    tags: ['极简', '金线', '高级', '日常'],
    difficulty: 'easy',
    vibe: '高级 | 极简 | 日常不挑',
  },
  {
    _id: 'style_16', name: '微光裸色',
    category: 'minimal',
    colors: ['#F5EDE6', '#FAF5F0', '#EDE0D4', '#FFFFFF'],
    desc: '极淡裸色配微光泽，仿佛指尖自带光芒，干净到极致即是美',
    tags: ['极简', '裸色', '通透', '日常'],
    difficulty: 'easy',
    vibe: '干净 | 通透 | 素颜也美',
  },

  // ── 宝石风 ──
  {
    _id: 'style_17', name: '祖母绿碎钻',
    category: 'gemstone',
    colors: ['#1B4D3E', '#2E6B5A', '#3D8B76', '#D4AF37'],
    desc: '浓郁祖母绿底色镶嵌金色碎钻，宝石切面般的光泽层次',
    tags: ['宝石', '绿色', '华丽', '宴会'],
    difficulty: 'hard',
    vibe: '华丽 | 贵气 | 适合宴会',
  },
  {
    _id: 'style_18', name: '海蓝宝冰晶',
    category: 'gemstone',
    colors: ['#8EC8D9', '#A8D8EA', '#C5E8F7', '#E8F5FA'],
    desc: '海蓝宝石般的清透蓝色，银箔碎片如冰晶漂浮其中',
    tags: ['宝石', '蓝色', '清透', '夏日'],
    difficulty: 'hard',
    vibe: '清透 | 凉爽 | 夏日专属',
  },

  // ── 花卉系列 ──
  {
    _id: 'style_19', name: '干花押花标本',
    category: 'floral',
    colors: ['#FAF5F0', '#F5EDE6', '#D4A9AD', '#C8B894'],
    desc: '透明甲面封入真实干花，仿佛植物标本般自然雅致',
    tags: ['花卉', '干花', '文艺', '春夏'],
    difficulty: 'hard',
    vibe: '文艺 | 自然 | 独一无二',
  },
  {
    _id: 'style_20', name: '小雏菊田园',
    category: 'floral',
    colors: ['#FFFDF8', '#F5F5DC', '#FFD700', '#90C695'],
    desc: '奶白底上手绘黄色小雏菊，田园清新风，治愈系首选',
    tags: ['花卉', '雏菊', '田园', '治愈'],
    difficulty: 'medium',
    vibe: '治愈 | 田园 | 适合出游',
  },

  // ── 磨砂系列 ──
  {
    _id: 'style_21', name: '磨砂雾霾蓝',
    category: 'matte',
    colors: ['#A8BFCF', '#B8CFDF', '#C8DFEF', '#D8E8F5'],
    desc: '哑光雾面雾霾蓝，丝绒般的高级触感，低调耐看',
    tags: ['磨砂', '蓝色', '高级', '秋冬'],
    difficulty: 'easy',
    vibe: '低调 | 高级 | 秋冬必备',
  },
  {
    _id: 'style_22', name: '磨砂裸粉',
    category: 'matte',
    colors: ['#E2CFCF', '#EAD8D8', '#F2E1E1', '#FAEAEA'],
    desc: '哑光裸粉色，棉花糖一般的柔和质感，温柔到骨子里',
    tags: ['磨砂', '粉色', '温柔', '日常'],
    difficulty: 'easy',
    vibe: '软糯 | 温柔 | 素颜友好',
  },
]

/**
 * 生成款式列表
 */
const generateMockStyles = (count = 22) => {
  const base = STYLE_DEFS.slice(0, Math.min(count, STYLE_DEFS.length))
  return base.map((def, i) => ({
    ...def,
    categoryName: categoryNames[def.category] || def.category,
    primaryColor: def.colors[0],
    likes: Math.floor(Math.random() * 8000) + 200,
    isHot: i < 7,
    isNew: i >= 16,
    imageUrl: '',
    thumbnailUrl: '',
    difficultyLabel: difficultyLabels[def.difficulty],
  }))
}

const hotSearchKeywords = [
  '猫眼', '冰透', '腮红甲', '镜面', '法式', '晕染',
  '大理石', '磨砂', '极简', '宝石', '干花', '渐变',
]

module.exports = {
  categories,
  categoryNames,
  difficulties,
  difficultyLabels,
  generateMockStyles,
  hotSearchKeywords,
}
