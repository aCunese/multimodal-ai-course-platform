import type {
  GenerationHistoryItem,
  GenerationOutput,
  GenerationTone,
  GenerationType,
} from "../types/platform";
import type {
  GenerationQualityMetric,
  SentimentAnalysisResponse,
  TextGenerationRequest,
  TextGenerationResponse,
} from "../api/types";

type SentimentLexiconEntry = {
  token: string;
  label: string;
  score: number;
};

const positiveLexicon: SentimentLexiconEntry[] = [
  { token: "wonderful", label: "wonderful", score: 0.94 },
  { token: "stunning", label: "stunning", score: 0.87 },
  { token: "moving", label: "moving", score: 0.82 },
  { token: "great", label: "great", score: 0.8 },
  { token: "excellent", label: "excellent", score: 0.86 },
  { token: "recommend", label: "recommend", score: 0.78 },
  { token: "love", label: "love", score: 0.76 },
  { token: "amazing", label: "amazing", score: 0.85 },
  { token: "精彩", label: "精彩", score: 0.84 },
  { token: "出色", label: "出色", score: 0.82 },
  { token: "感人", label: "感人", score: 0.8 },
  { token: "推荐", label: "推荐", score: 0.76 },
];

const negativeLexicon: SentimentLexiconEntry[] = [
  { token: "flop", label: "flop", score: 0.91 },
  { token: "copied", label: "copied", score: 0.73 },
  { token: "boring", label: "boring", score: 0.7 },
  { token: "dull", label: "dull", score: 0.65 },
  { token: "slow", label: "slow", score: 0.64 },
  { token: "terrible", label: "terrible", score: 0.88 },
  { token: "bad", label: "bad", score: 0.62 },
  { token: "drag", label: "drag", score: 0.58 },
  { token: "无聊", label: "无聊", score: 0.7 },
  { token: "拖沓", label: "拖沓", score: 0.68 },
  { token: "失望", label: "失望", score: 0.72 },
  { token: "节奏慢", label: "节奏慢", score: 0.61 },
];

const toneKeywordMap: Record<GenerationTone, string[]> = {
  正式: ["结构清晰", "适合正式展示"],
  活泼: ["节奏轻快", "更有亲和力"],
  科技感: ["未来感强", "技术气质突出"],
  文艺: ["画面感明确", "更适合收尾表达"],
};

const toneBodyHintMap: Record<GenerationTone, string> = {
  正式: "以清晰结构串联实验目标、实现路径与展示亮点",
  活泼: "用更轻快的节奏突出项目亮点与课堂展示氛围",
  科技感: "突出系统能力、技术路径与平台化表达",
  文艺: "把项目成果转化成更有画面感和感染力的表达",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateParts(date: Date) {
  const fullDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const fullDateTime = `${fullDate} ${time}:${pad(date.getSeconds())}`;

  return { fullDate, time, fullDateTime };
}

function collectKeywordMatches(source: string, lexicon: SentimentLexiconEntry[], limit: number) {
  return lexicon
    .filter((entry) => source.includes(entry.token))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => ({ label: entry.label, score: Number(entry.score.toFixed(2)) }));
}

export function buildLocalSentimentAnalysis(text: string, now = new Date()): SentimentAnalysisResponse {
  const normalizedText = text.trim().toLowerCase();
  const positiveMatches = collectKeywordMatches(normalizedText, positiveLexicon, 5);
  const negativeMatches = collectKeywordMatches(normalizedText, negativeLexicon, 3);
  const positiveScore = positiveMatches.reduce((sum, item) => sum + item.score, 0);
  const negativeScore = negativeMatches.reduce((sum, item) => sum + item.score, 0);
  const rawScore = positiveScore - negativeScore;
  const normalizedScore = clamp(rawScore / Math.max(positiveScore + negativeScore, 1), -1, 1);

  const label =
    normalizedScore > 0.18 ? "正面" : normalizedScore < -0.18 ? "负面" : "中性";
  const englishLabel = label === "正面" ? "Positive" : label === "负面" ? "Negative" : "Neutral";
  const confidence = clamp(
    58 + Math.round(Math.abs(normalizedScore) * 26) + (positiveMatches.length + negativeMatches.length) * 4,
    60,
    96,
  );
  const tags =
    label === "正面"
      ? ["积极", "本地兜底"]
      : label === "负面"
        ? ["消极", "本地兜底"]
        : ["中性", "本地兜底"];
  const explanation =
    label === "正面"
      ? "检测到明显的正向词汇，当前在后端不可用时已基于输入内容完成本地正向判断。"
      : label === "负面"
        ? "检测到明显的负向词汇，当前在后端不可用时已基于输入内容完成本地负向判断。"
        : "当前未识别到足够强的正负向信号，系统在本地兜底模式下给出中性判断。";
  const { fullDate, time, fullDateTime } = formatDateParts(now);

  return {
    label,
    englishLabel,
    confidence,
    score: Number(normalizedScore.toFixed(2)),
    tags,
    positiveMatches,
    negativeMatches,
    explanation,
    status: "已完成",
    processingTime: "< 1 ms（本地兜底）",
    taskId: `SA-LOCAL-${now.getTime()}`,
    completedAt: fullDateTime,
    providerUsed: "local",
    usedFallback: true,
    providerStatusMessage: "当前分析引擎：本地规则兜底",
    historyRecord: {
      id: `#LOCAL-SA-${now.getTime()}`,
      date: fullDate,
      time,
      module: "情感分析",
      inputType: "文本",
      inputContent: text.trim().slice(0, 40) || "本地兜底文本",
      output: label,
      confidence: `${confidence}%`,
      status: "成功",
      route: "/sentiment-analysis",
    },
  };
}

function buildGenerationBody(
  theme: string,
  type: GenerationType,
  tone: GenerationTone,
  index: number,
) {
  const prefix = index + 1;

  switch (type) {
    case "标题":
      return `${theme}第 ${prefix} 版标题，${toneBodyHintMap[tone]}，适合直接放进课程答辩或展示封面。`;
    case "宣传语":
      return `围绕“${theme}”，${toneBodyHintMap[tone]}，适合放在模块介绍、答辩摘要或项目亮点区域。`;
    case "短文案":
      return `${theme}可在一段文案内快速说明任务目标、系统能力与课堂展示价值，并保持${tone === "正式" ? "稳健" : tone === "科技感" ? "技术化" : tone === "文艺" ? "诗性" : "轻快"}表达。`;
    case "诗意表达":
      return `以“${theme}”为核心意象，把实验、交互与成果串联成更有画面感的收尾句，适合展示页或答辩结尾。`;
    default:
      return `${theme}本地兜底文案 ${prefix}`;
  }
}

function buildQualityMetrics(tone: GenerationTone, type: GenerationType): GenerationQualityMetric[] {
  const toneBias = tone === "科技感" ? 2 : tone === "正式" ? 1 : 0;
  const typeBias = type === "宣传语" ? 1 : type === "标题" ? 2 : 0;

  return [
    { label: "主题相关度", value: 90 + typeBias },
    { label: "语言流畅度", value: 88 + toneBias },
    { label: "创意表达", value: 84 + (tone === "文艺" ? 4 : tone === "活泼" ? 3 : 2) },
  ];
}

function buildQualityTip(type: GenerationType, tone: GenerationTone) {
  if (type === "宣传语") {
    return `推荐用于${tone === "正式" ? "答辩摘要、模块概览和成果总览" : "海报展示与亮点说明"}。`;
  }

  if (type === "标题") {
    return "推荐用于首页横幅、章节标题和演示封面。";
  }

  if (type === "诗意表达") {
    return "推荐用于收尾页、课程感悟和答辩结语区域。";
  }

  return "推荐用于模块说明、页面摘要和实验结果解读区域。";
}

export function buildLocalTextGeneration(
  request: TextGenerationRequest,
  previousHistory: GenerationHistoryItem[],
  now = new Date(),
): TextGenerationResponse {
  const theme = request.theme.trim() || "未命名主题";
  const quantity = clamp(request.quantity, 1, 5);
  const { fullDate, time, fullDateTime } = formatDateParts(now);
  const toneKeywords = [theme, ...toneKeywordMap[request.tone]];
  const outputs: GenerationOutput[] = Array.from({ length: quantity }, (_, index) => ({
    id: `local-gen-${now.getTime()}-${index + 1}`,
    type: request.type,
    title: `${theme}${request.type} ${index + 1}`,
    body: buildGenerationBody(theme, request.type, request.tone, index),
  }));

  const historyEntry: GenerationHistoryItem = {
    id: `local-hist-${now.getTime()}`,
    theme,
    type: request.type,
    tone: request.tone,
    count: quantity,
    time,
    status: "已生成",
  };

  return {
    outputs,
    historyEntry,
    history: [historyEntry, ...previousHistory],
    qualityMetrics: buildQualityMetrics(request.tone, request.type),
    qualityTip: buildQualityTip(request.type, request.tone),
    toneKeywords,
    generatedAt: fullDateTime.split(" ")[1] ?? fullDateTime,
    providerUsed: "local",
    usedFallback: true,
    providerStatusMessage: "当前生成引擎：本地模板兜底",
    historyRecord: {
      id: `#LOCAL-TG-${now.getTime()}`,
      date: fullDate,
      time,
      module: "文案生成",
      inputType: "主题",
      inputContent: theme,
      output: `已生成 ${quantity} 条`,
      confidence: `${buildQualityMetrics(request.tone, request.type)[0]?.value ?? 90}%`,
      status: "成功",
      route: "/text-generation",
    },
  };
}
