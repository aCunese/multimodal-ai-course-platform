const herbalLabelMap: Record<string, string> = {
  Dangshen: "党参",
  Baihe: "百合",
  Jinyinhua: "金银花",
  Huaihua: "槐花",
  Gouqi: "枸杞",
  Dog: "狗",
  Cat: "猫",
  Rabbit: "兔子",
};

const museumInstitutionMap: Record<string, string> = {
  "Metropolitan Museum": "大都会艺术博物馆",
  "Metropolitan Museum of Art": "大都会艺术博物馆",
  "Harvard Art Museums": "哈佛艺术博物馆",
  "Princeton University Art Museum": "普林斯顿大学艺术博物馆",
  "Smithsonian Institution": "史密森学会",
};

const museumTextMap: Record<string, string> = {
  "Metropolitan Portrait Collection": "大都会肖像馆藏样例",
  "Smithsonian Dataset Match": "史密森数据集匹配结果",
  "Backend Portrait Collection": "后端肖像馆藏样例",
};

const sentimentKeywordMap: Record<string, string> = {
  wonderful: "精彩",
  excellent: "出色",
  touching: "感人",
  moving: "动人",
  recommended: "推荐",
  long: "拖沓",
  slow: "节奏慢",
  boring: "无聊",
  stunning: "惊艳",
  beautiful: "优美",
  great: "优秀",
  good: "不错",
  bad: "糟糕",
  awful: "很差",
  terrible: "差劲",
  poor: "薄弱",
  copied: "缺乏新意",
  flop: "失败",
};

const sentimentResultMap: Record<string, string> = {
  Positive: "正面判断",
  Neutral: "中性判断",
  Negative: "负面判断",
};

function extractChinesePart(value: string) {
  const slashParts = value.split("/").map((part) => part.trim());
  if (slashParts.length >= 2 && /[\u4e00-\u9fff]/.test(slashParts[0])) {
    return slashParts[0];
  }

  const fullWidthParenthesesMatch = value.match(/^(.+?)（(.+?)）$/);
  if (fullWidthParenthesesMatch) {
    const [, first, second] = fullWidthParenthesesMatch;
    if (/[\u4e00-\u9fff]/.test(first)) {
      return first.trim();
    }
    if (/[\u4e00-\u9fff]/.test(second)) {
      return second.trim();
    }
  }

  return null;
}

export function formatHerbalLabel(value: string) {
  const chinesePart = extractChinesePart(value);
  if (chinesePart) {
    return chinesePart;
  }

  return herbalLabelMap[value] ?? value;
}

export function formatMuseumInstitution(value: string) {
  return museumInstitutionMap[value] ?? value;
}

export function formatMuseumCopy(value: string) {
  let formatted = value;

  for (const [source, target] of Object.entries(museumInstitutionMap)) {
    formatted = formatted.replaceAll(source, target);
  }

  for (const [source, target] of Object.entries(museumTextMap)) {
    formatted = formatted.replaceAll(source, target);
  }

  return formatted;
}

export function formatSentimentKeyword(value: string) {
  return sentimentKeywordMap[value.toLowerCase()] ?? value;
}

export function formatSentimentResultLabel(value: string) {
  return sentimentResultMap[value] ?? value;
}

export function formatAccountRoleLabel(value: string) {
  return value.replaceAll("Student", "学生");
}

export function formatHistoryOutput(module: string, output: string) {
  if (module === "图像识别") {
    return formatHerbalLabel(output);
  }

  if (module === "情感分析") {
    return formatSentimentResultLabel(output);
  }

  if (module === "博物馆图像理解") {
    return formatMuseumInstitution(output);
  }

  return output;
}
