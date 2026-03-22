export const SUBJECT_CONFIGS: Record<string, {
  name: string
  examples: string
  graphTypes: string
  formulaHints: string
}> = {
  '数学': {
    name: '数学',
    examples: '代数、几何、函数、概率、统计、三角函数、导数、向量',
    graphTypes: '几何图形（三角形、圆、四边形）、函数图像、坐标系、概率树、统计图',
    formulaHints: '使用LaTeX公式标记：分数用$\\frac{a}{b}$，根号用$\\sqrt{x}$，上下标用$x^2$、$a_n$等',
  },
  '物理': {
    name: '物理',
    examples: '力学、电学、光学、热学、电磁学、运动学',
    graphTypes: '受力分析图、电路图、光路图、运动学图像(s-t/v-t)、实验装置图',
    formulaHints: '使用LaTeX公式：$F=ma$、$I=\\frac{U}{R}$、$W=Fs\\cos\\theta$等，注意单位标注',
  },
  '化学': {
    name: '化学',
    examples: '化学反应、离子方程式、有机化学、实验操作、化学平衡、电化学',
    graphTypes: '实验装置图、有机结构式、滴定曲线、溶解度曲线',
    formulaHints: '化学方程式用文本表示，如 2H₂ + O₂ → 2H₂O，计算公式用LaTeX：$n=\\frac{m}{M}$',
  },
  '生物': {
    name: '生物',
    examples: '细胞生物学、遗传学、生态学、代谢、调节、进化',
    graphTypes: '细胞结构图、遗传图解、生态系统图、代谢流程图、实验结果图',
    formulaHints: '比例和概率表达用LaTeX：$\\frac{3}{4}$，遗传比用文本：3:1',
  },
  '地理': {
    name: '地理',
    examples: '自然地理、人文地理、区域地理、地球运动、气候、地貌',
    graphTypes: '地形图、气候图、洋流图、人口金字塔、产业布局图',
    formulaHints: '经纬度用文本：40°N, 116°E，比例尺和计算用LaTeX',
  },
  '英语': {
    name: '英语',
    examples: '阅读理解、完形填空、语法填空、写作、翻译',
    graphTypes: '数据图表、信息匹配图、语篇结构图',
    formulaHints: '英语题目一般不含数学公式，但图表题中的数据可用文本表达',
  },
  '政治': {
    name: '政治',
    examples: '经济生活、政治生活、文化生活、哲学、法律',
    graphTypes: '关系图、流程图、经济循环图、政策传导图、统计图',
    formulaHints: '经济公式用LaTeX：$GDP=C+I+G+NX$，增长率计算等',
  },
  '历史': {
    name: '历史',
    examples: '中国古代史、中国近代史、世界史、时间线、历史事件',
    graphTypes: '时间轴、历史地图、比较表、人物关系图、贸易路线图',
    formulaHints: '历史学科较少公式，朝代年份和统计数据用文本表达',
  },
}

export function getSubjectConfig(subject: string) {
  return SUBJECT_CONFIGS[subject] || SUBJECT_CONFIGS['数学']
}
