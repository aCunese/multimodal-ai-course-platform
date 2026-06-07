import type {
  GenerationHistoryItem,
  GenerationOutput,
  HistoryRecord,
  MetricCard,
  ModuleCard,
} from "../shared/types/platform";

export const dashboardModules: ModuleCard[] = [
  {
    title: "图像识别",
    description: "上传图片并识别图像类别，展示分类概率与置信度。",
    route: "/image-recognition",
    statusLabel: "已完成",
    statusTone: "success",
    icon: "image",
  },
  {
    title: "情感分析",
    description: "输入评论文本，判断情绪倾向并输出关键词解释。",
    route: "/sentiment-analysis",
    statusLabel: "已完成",
    statusTone: "success",
    icon: "heart",
  },
  {
    title: "文案生成",
    description: "根据主题生成标题、宣传语与短文案结果。",
    route: "/text-generation",
    statusLabel: "可演示",
    statusTone: "accent",
    icon: "pen",
  },
  {
    title: "博物馆图像理解",
    description: "识别博物馆图像来源，生成内容描述并提取关键词标签。",
    route: "/museum-vision",
    statusLabel: "可演示",
    statusTone: "accent",
    icon: "museum",
  },
];

export const dashboardMetrics: MetricCard[] = [
  {
    label: "已整合实验",
    value: "4 个",
    caption: "涵盖图像、文本、生成与跨模态展示。",
    icon: "cube",
  },
  {
    label: "支持任务类型",
    value: "图像 / 文本 / 生成 / 跨模态",
    caption: "统一 UI 框架与共享数据结构已建立。",
    icon: "layers",
  },
  {
    label: "历史记录",
    value: "128 条",
    caption: "同一套 mock 记录可驱动首页与历史页。",
    icon: "clock",
  },
  {
    label: "平均置信度",
    value: "92.6%",
    caption: "与高保真原型中展示的统计口径保持一致。",
    icon: "chart",
  },
];

export const historyRecords: HistoryRecord[] = [
  {
    id: "#1024",
    date: "2026-06-05",
    time: "14:25",
    module: "图像识别",
    inputType: "图片",
    inputContent: "cat.jpg",
    output: "猫",
    confidence: "92.8%",
    status: "成功",
    route: "/image-recognition",
  },
  {
    id: "#1023",
    date: "2026-06-05",
    time: "14:18",
    module: "情感分析",
    inputType: "文本",
    inputContent: "IMDB 评论",
    output: "正面",
    confidence: "88.4%",
    status: "成功",
    route: "/sentiment-analysis",
  },
  {
    id: "#1022",
    date: "2026-06-05",
    time: "13:55",
    module: "文案生成",
    inputType: "主题",
    inputContent: "AI 课程展示",
    output: "已生成 3 条",
    confidence: "92%",
    status: "成功",
    route: "/text-generation",
  },
  {
    id: "#1021",
    date: "2026-06-05",
    time: "13:35",
    module: "博物馆图像理解",
    inputType: "图片",
    inputContent: "museum_01.jpg",
    output: "古代青铜器",
    confidence: "90.1%",
    status: "成功",
    route: "/museum-vision",
  },
  {
    id: "#1020",
    date: "2026-06-05",
    time: "12:48",
    module: "图像识别",
    inputType: "图片",
    inputContent: "dog.png",
    output: "狗",
    confidence: "91.3%",
    status: "成功",
    route: "/image-recognition",
  },
  {
    id: "#1019",
    date: "2026-06-05",
    time: "12:30",
    module: "情感分析",
    inputType: "文本",
    inputContent: "产品评价文本",
    output: "负面",
    confidence: "72.6%",
    status: "警告",
    route: "/sentiment-analysis",
  },
  {
    id: "#1018",
    date: "2026-06-05",
    time: "11:50",
    module: "文案生成",
    inputType: "活动主题",
    inputContent: "活动宣传文案",
    output: "已生成 5 条",
    confidence: "89%",
    status: "成功",
    route: "/text-generation",
  },
  {
    id: "#1017",
    date: "2026-06-05",
    time: "11:10",
    module: "博物馆图像理解",
    inputType: "图片",
    inputContent: "artifact_02.jpg",
    output: "唐三彩骆驼俑",
    confidence: "87.2%",
    status: "失败",
    route: "/museum-vision",
  },
];

export const positiveKeywords = [
  ["精彩", 0.94],
  ["出色", 0.89],
  ["感人", 0.83],
  ["动人", 0.82],
  ["推荐", 0.78],
] as const;

export const negativeKeywords = [
  ["拖沓", 0.21],
  ["节奏慢", 0.18],
  ["无聊", 0.16],
] as const;

export const generationOutputs: GenerationOutput[] = [
  {
    id: "gen-1",
    type: "标题",
    title: "课程成果平台展示标题",
    body: "多模态 AI 实验一站式展示，让图像、文本与知识理解在同一界面协同呈现。",
  },
  {
    id: "gen-2",
    type: "宣传语",
    title: "答辩宣传语",
    body: "从原始实验数据到可交互演示页面，统一呈现课程成果的技术路径与应用价值。",
  },
  {
    id: "gen-3",
    type: "短文案",
    title: "短说明文案",
    body: "系统支持图像识别、情感分析、文案生成与博物馆图像理解四类任务，适合课堂汇报与课程答辩演示。",
  },
];

export const generationHistory: GenerationHistoryItem[] = [
  {
    id: "hist-1",
    theme: "人工智能课程展示",
    type: "标题",
    tone: "科技感",
    count: 3,
    time: "14:32",
    status: "已生成",
  },
  {
    id: "hist-2",
    theme: "多模态 AI 应用探索",
    type: "宣传语",
    tone: "正式",
    count: 5,
    time: "14:18",
    status: "已生成",
  },
  {
    id: "hist-3",
    theme: "图像与文本的融合创新",
    type: "短文案",
    tone: "活泼",
    count: 3,
    time: "13:55",
    status: "已生成",
  },
  {
    id: "hist-4",
    theme: "走进 AI 的未来世界",
    type: "诗意表达",
    tone: "文艺",
    count: 3,
    time: "13:35",
    status: "草稿",
  },
  {
    id: "hist-5",
    theme: "课程项目亮点总结",
    type: "标题",
    tone: "正式",
    count: 5,
    time: "12:48",
    status: "已生成",
  },
];

export const museumMatches = [
  {
    institution: "大都会艺术博物馆",
    score: "91.2%",
    description: "山水画构图与元数据风格与馆藏记录高度一致。",
  },
  {
    institution: "哈佛艺术博物馆",
    score: "85.6%",
    description: "墨色层次和纸本纹理与样本子集存在相近分布。",
  },
  {
    institution: "普林斯顿大学艺术博物馆",
    score: "73.4%",
    description: "画面边缘留白与题跋布局相近，但来源一致性略低。",
  },
];
