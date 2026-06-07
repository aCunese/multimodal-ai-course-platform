# 仓库目录整理说明

## 目标

把原先分散在根目录的实训数据、原型图、HTML 参考稿和课程模板统一收纳，形成后续前后端开发都能直接承接的目录结构。

## 本次整理结果

### 1. 实训数据统一迁移到 `data/experiments/`

旧目录与新目录对应关系如下：

| 原目录 | 新目录 |
|---|---|
| `实训1/` | `data/experiments/experiment-01-herbal-image-classification/` |
| `实训2/` | `data/experiments/experiment-02-text-analysis-generation/` |
| `实训3/` | `data/experiments/experiment-03-museum-multimodal/` |

### 2. UI 参考资产拆分为“开发参考区”与“原始存档区”

| 资产来源 | 整理后位置 |
|---|---|
| 根目录原型图原文件 | `docs/source-assets/high-fidelity-originals/` |
| 根目录 `stitch 2` 原文件 | `docs/source-assets/stitch-2/` |
| 面向开发的高保真参考图 | `docs/ui-reference/high-fidelity/` |
| 面向开发的 HTML 参考稿 | `docs/ui-reference/html-reference/reference-*/` |

这样可以同时满足两类需求：

- 开发时直接看 `docs/ui-reference/`，文件命名稳定、便于对照。
- 需要回溯素材来源时看 `docs/source-assets/`，避免原始资料散落在项目根目录。

### 3. 课程交付材料统一迁移到 `docs/course-materials/`

| 资料类型 | 新目录 |
|---|---|
| 课程结业实验报告模板 | `docs/course-materials/` |
### 4. 预留运行时代码目录

- `web/`
  - 放统一前端应用。
- `backend/`
  - 放推理接口、导出接口、历史记录接口。

## 数据目录细分

### `experiment-01-herbal-image-classification`

- `raw/`
  - 原始图片分类数据。
- `archives/`
  - 原始压缩包，如 `data.rar`。

### `experiment-02-text-analysis-generation`

- `datasets/`
  - 文本实验数据，如 `imdb.npz`、`imdb_word_index.json`、`poetry.txt`。

### `experiment-03-museum-multimodal`

- `images/`
  - 按博物馆来源拆分的图像数据。
- `archives/`
  - 原始压缩包，如 `Harvard.zip`、`Metropolitan.zip`、`Princeton.zip`、`Smithsonian.zip`。

## 后续执行建议

1. 在 `web/` 初始化单一前端工程，不再额外创建平级散页目录。
2. 页面开发直接对照 `docs/ui-reference/high-fidelity/`。
3. 模型接入与记录接口统一收敛到 `backend/`。
4. 新增资料时优先放入 `docs/`、`data/`、`web/`、`backend/` 中对应位置，避免重新回到“根目录堆文件”状态。
