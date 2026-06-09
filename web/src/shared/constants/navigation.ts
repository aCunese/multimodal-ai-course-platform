import type { NavItem } from "../types/platform";

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "首页总览",
    icon: "home",
    summary: "查看模块入口与关键状态",
  },
  {
    path: "/image-recognition",
    label: "图像识别",
    icon: "image",
    summary: "上传图片并查看分类结果",
  },
  {
    path: "/sentiment-analysis",
    label: "情感分析",
    icon: "heart",
    summary: "文本情绪判断与关键词分析",
  },
  {
    path: "/text-generation",
    label: "文案生成",
    icon: "pen",
    summary: "根据主题生成多种文案",
  },
  {
    path: "/museum-vision",
    label: "博物馆图像理解",
    icon: "museum",
    summary: "图像来源识别与内容描述",
  },
  {
    path: "/history",
    label: "历史记录",
    icon: "history",
    summary: "查看各模块运行记录",
  },
];
