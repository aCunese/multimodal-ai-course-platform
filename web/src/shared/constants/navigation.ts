import type { NavItem } from "../types/platform";

export const navItems: NavItem[] = [
  {
    path: "/",
    label: "首页总览",
    icon: "home",
    summary: "平台入口与综合统计",
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
    summary: "根据主题生成课程演示文案",
  },
  {
    path: "/museum-vision",
    label: "博物馆图像识别 / 描述",
    icon: "museum",
    summary: "图像来源识别与内容描述",
  },
  {
    path: "/history",
    label: "历史记录与项目说明",
    icon: "history",
    summary: "查看执行日志和项目结构",
  },
];
