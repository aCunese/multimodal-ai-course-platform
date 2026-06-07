export type IconName =
  | "home"
  | "image"
  | "heart"
  | "pen"
  | "museum"
  | "history"
  | "search"
  | "download"
  | "file"
  | "user"
  | "arrow-right"
  | "check"
  | "spark"
  | "chart"
  | "layers"
  | "shield"
  | "cube"
  | "upload"
  | "refresh"
  | "light"
  | "filter"
  | "clock"
  | "database"
  | "copy"
  | "tag";

export type StatusTone = "success" | "accent" | "warning" | "neutral";

export type HistoryStatus = "成功" | "警告" | "失败";

export type NavItem = {
  path: string;
  label: string;
  icon: IconName;
  summary: string;
};

export type ModuleCard = {
  title: string;
  description: string;
  route: string;
  statusLabel: string;
  statusTone: StatusTone;
  icon: IconName;
};

export type MetricCard = {
  label: string;
  value: string;
  caption: string;
  icon: IconName;
};

export type HistoryRecord = {
  id: string;
  date: string;
  time: string;
  module: string;
  inputType: string;
  inputContent: string;
  output: string;
  confidence: string;
  status: HistoryStatus;
  route: string;
};

export type GenerationType = "标题" | "宣传语" | "短文案" | "诗意表达";

export type GenerationTone = "正式" | "活泼" | "科技感" | "文艺";

export type GenerationOutput = {
  id: string;
  type: GenerationType;
  title: string;
  body: string;
};

export type GenerationHistoryItem = {
  id: string;
  theme: string;
  type: GenerationType;
  tone: GenerationTone;
  count: number;
  time: string;
  status: "已生成" | "草稿";
};
