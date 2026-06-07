# 数据目录说明

`data/` 用来统一管理课程实验数据，避免数据集、压缩包和中间资源散落到工程代码目录里。

## 当前结构

```text
data/
└── experiments/
    ├── experiment-01-herbal-image-classification/
    ├── experiment-02-text-analysis-generation/
    └── experiment-03-museum-multimodal/
```

## 目录职责

- `experiment-01-herbal-image-classification/`
  - 图像分类实验数据，适合继续细分 `raw/`、`archives/`、`processed/`。
- `experiment-02-text-analysis-generation/`
  - 文本分析与生成实验数据，当前以 `datasets/` 为主。
- `experiment-03-museum-multimodal/`
  - 博物馆多模态实验数据，当前包含 `images/` 和 `archives/`。

## 维护建议

- 原始压缩包优先放 `archives/`。
- 可直接读取的数据放 `datasets/`、`images/` 或 `raw/`。
- 后续如果出现清洗后的结果，单独新增 `processed/`，不要和原始数据混放。
- 不要把数据文件直接塞进 `web/` 或 `backend/`。
