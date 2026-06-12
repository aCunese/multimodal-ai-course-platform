import { afterEach, describe, expect, it, vi } from "vitest";

import {
  analyzeSentiment,
  downloadProjectDeliveryBundle,
  getDashboardMetadata,
  getAppShellMetadata,
  getHistoryMetadata,
  downloadHistoryRecords,
  downloadMuseumVisionTags,
  downloadProjectReport,
  getImageRecognitionMetadata,
  getMuseumVisionMetadata,
  getSentimentAnalysisMetadata,
  getTextGenerationMetadata,
  searchPlatform,
} from "./client";

describe("api client download helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads history exports with operation-aware query params and filename headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(["id,name"], { type: "text/csv" }), {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="history-records-20260606.csv"',
          "Content-Type": "text/csv; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadHistoryRecords(
      {
        keyword: "flop",
        module: "情感分析",
        status: "成功",
      },
      "csv",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/history/export?keyword=flop&module=%E6%83%85%E6%84%9F%E5%88%86%E6%9E%90&status=%E6%88%90%E5%8A%9F&format=csv",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.filename).toBe("history-records-20260606.csv");
    expect(result.blob.type).toContain("text/csv");
  });

  it("falls back to a local filename when the download response does not expose one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['{"count":1}'], { type: "application/json" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadHistoryRecords(
      {
        keyword: "",
        module: "全部",
        status: "全部",
      },
      "json",
    );

    expect(result.filename).toBe("history-records.json");
    expect(result.blob.type).toContain("application/json");
  });

  it("uses generated validation-error metadata to surface 422 messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        detail: [
          {
            loc: ["body", "text"],
            msg: "String should have at least 1 character",
            type: "string_too_short",
          },
        ],
      }), {
        status: 422,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(analyzeSentiment("")).rejects.toThrow("String should have at least 1 character");
  });

  it("searches the platform with operation-aware query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        keyword: "flop",
        total: 1,
        results: [
          {
            id: "history-1025",
            title: "情感分析 · Negative",
            subtitle: "历史记录 · 成功 · 2026-06-06 08:00",
            description: "This sequel is a flop and feels copied. -> Negative",
            route: "/history?keyword=%231025",
            icon: "heart",
            scope: "history",
          },
        ],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPlatform("flop");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/search?keyword=flop",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    expect(result.total).toBe(1);
    expect(result.results[0]?.route).toBe("/history?keyword=%231025");
  });

  it("loads dashboard metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "课程成果总览",
        pageDescription: "后端下发的首页说明文案。",
        syncLoadingMessage: "后端摘要同步中",
        syncReadyMessage: "后端摘要已接通。",
        syncFallbackMessage: "摘要接口暂不可用。",
        heroTitle: "后端首页横幅标题",
        heroDescription: "后端首页横幅描述文案。",
        primaryAction: {
          label: "进入图像模块",
          route: "/image-recognition",
        },
        secondaryAction: {
          label: "查看项目记录",
          route: "/history",
        },
        moduleActionLabel: "后端进入模块",
        runtimePanelTitle: "后端运行时面板",
        runtimePanelLoadingMessage: "后端运行时加载中",
        runtimePanelErrorMessage: "后端运行时失败",
        runtimeWarmActionColdLabel: "后端执行预热",
        runtimeWarmActionReadyLabel: "后端重新预热",
        runtimeWarmActionBusyLabel: "后端预热中",
        runtimeAssetCacheFileLabel: "后端缓存文件",
        runtimeAssetCacheReadyLabel: "后端已生成",
        runtimeAssetCacheMissingLabel: "后端未生成",
        runtimeAssetCacheSizeLabel: "后端缓存体积",
        runtimeAssetUpdatedAtLabel: "后端更新时间",
        runtimeAssetMissingUpdatedAtLabel: "后端暂无",
        historyPanelTitle: "后端历史面板",
        historyPanelActionLabel: "后端查看记录",
        historyTableHeaders: ["后端时间", "后端模块", "后端输入", "后端输出", "后端状态"],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDashboardMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/dashboard/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.pageTitle).toBe("课程成果总览");
    expect(result.syncLoadingMessage).toBe("后端摘要同步中");
    expect(result.moduleActionLabel).toBe("后端进入模块");
    expect(result.runtimeAssetCacheMissingLabel).toBe("后端未生成");
    expect(result.primaryAction.route).toBe("/image-recognition");
  });

  it("loads history metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "后端历史页标题",
        pageDescription: "后端历史页说明文案。",
        syncConnectedMessage: "后端已连接提示",
        syncLoadingMessage: "后端同步中",
        syncReadyMessage: "后端实时同步完成。",
        syncFallbackMessage: "后端同步失败兜底。",
        filterPanelTitle: "后端筛选区标题",
        searchFieldLabel: "后端搜索标签",
        searchPlaceholder: "后端搜索占位",
        moduleFilterLabel: "后端模块筛选",
        statusFilterLabel: "后端状态筛选",
        exportFormatLabel: "后端导出格式",
        clearFiltersLabel: "后端清空",
        exportButtonLabel: "后端导出",
        exportButtonBusyLabel: "后端导出中",
        exportSuccessMessageTemplate: "后端已导出 {format}",
        exportFallbackMessage: "后端导出兜底",
        tableTitle: "后端历史表格标题",
        tableLoadingMessage: "后端表格同步中",
        tableCountTemplate: "后端共 {count} 条",
        tableHeaders: ["后端记录列", "后端时间列", "后端模块列", "后端输入列", "后端输出列", "后端评分列", "后端状态列", "后端操作列"],
        rowActionLabel: "后端查看记录",
        projectOverviewTitle: "后端项目说明标题",
        moduleSpotlightActionLabel: "后端查看详情",
        moduleFilters: ["全部", "图像识别", "运行时资源"],
        statusFilters: ["全部", "成功", "失败"],
        exportFormats: [
          { label: "JSON", value: "json" },
          { label: "CSV", value: "csv" },
        ],
        overviewSections: [],
        valuePoints: [],
        moduleSpotlights: [],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getHistoryMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/history/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.pageTitle).toBe("后端历史页标题");
    expect(result.syncReadyMessage).toBe("后端实时同步完成。");
    expect(result.exportSuccessMessageTemplate).toBe("后端已导出 {format}");
    expect(result.tableHeaders[0]).toBe("后端记录列");
    expect(result.rowActionLabel).toBe("后端查看记录");
    expect(result.moduleSpotlightActionLabel).toBe("后端查看详情");
  });

  it("loads app-shell metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        searchFieldAriaLabel: "后端全局搜索",
        searchPlaceholder: "后端搜索占位",
        searchResultsAriaLabel: "后端搜索建议",
        searchLoadingMessage: "后端搜索中",
        searchEmptyMessage: "后端暂无匹配",
        searchUnavailableMessage: "后端搜索暂不可用",
        projectReportButtonLabel: "后端导出演示报告",
        projectReportFallbackTitle: "后端演示报告标题",
        projectReportFallbackFilename: "backend-demo-report.json",
        projectDeliverablesButtonLabel: "后端导出交付包",
        projectOverviewButtonLabel: "后端查看项目说明",
        accountDisplayName: "后端课程用户",
        accountRoleLabel: "Backend Student",
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getAppShellMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/app-shell/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.searchFieldAriaLabel).toBe("后端全局搜索");
    expect(result.searchUnavailableMessage).toBe("后端搜索暂不可用");
    expect(result.projectReportFallbackFilename).toBe("backend-demo-report.json");
    expect(result.accountRoleLabel).toBe("Backend Student");
  });

  it("loads text-generation metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "后端文案页标题",
        pageDescription: "后端文案页说明。",
        syncConnectingMessage: "后端连接中",
        syncHistoryReadyMessage: "后端历史已接通",
        syncFallbackMessage: "后端历史兜底",
        generateLoadingMessage: "后端生成中",
        generateSuccessMessage: "后端生成成功",
        generateFallbackMessage: "后端生成失败兜底",
        restoreExampleMessage: "后端已恢复示例",
        copyActionLabel: "后端复制",
        copySuccessLabel: "后端已复制",
        copyFailureMessage: "后端复制失败",
        restoreExampleButtonLabel: "后端恢复示例",
        generateButtonLabel: "后端开始生成",
        generateButtonBusyLabel: "后端生成中...",
        regenerateButtonLabel: "后端重新生成",
        toneOptions: ["正式", "活泼", "科技感", "文艺"],
        generationTypes: ["标题", "宣传语", "短文案", "诗意表达"],
        defaultConfig: {
          theme: "人工智能课程展示",
          tone: "科技感",
          type: "标题",
          quantity: 3,
        },
        sampleOutputs: [],
        defaultQualityMetrics: [],
        defaultQualityTip: "推荐用于产品化展示、模块介绍和平台价值主张区域。",
        defaultToneKeywords: ["技术气质", "未来感强", "适合产品页"],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getTextGenerationMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/text-generation/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.pageTitle).toBe("后端文案页标题");
    expect(result.generateButtonLabel).toBe("后端开始生成");
    expect(result.copySuccessLabel).toBe("后端已复制");
    expect(result.defaultConfig.theme).toBe("人工智能课程展示");
    expect(result.toneOptions[2]).toBe("科技感");
  });

  it("loads image-recognition metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "后端图像识别页",
        pageDescription: "后端图像识别页面说明。",
        syncLoadingMessage: "后端识别结果同步中",
        syncAnalyzingMessage: "后端识别接口分析中",
        syncReadyMessage: "后端识别结果已接通",
        syncFallbackMessage: "后端识别结果兜底",
        uploadPanelTitle: "后端上传区",
        uploadDropzoneTitle: "后端拖拽上传标题",
        uploadHint: "后端上传格式说明",
        uploadButtonLabel: "后端上传按钮",
        exampleButtonLabel: "后端示例按钮",
        uploadedPreviewTitle: "后端已上传图片",
        reuploadButtonLabel: "后端重新上传",
        previewLoadedStatusLabel: "后端已加载",
        previewAnalyzingStatusLabel: "后端识别中",
        resultPanelTitle: "后端识别结果",
        resultReadyStatusLabel: "后端识别完成",
        resultAnalyzingStatusLabel: "后端识别中",
        predictedCategoryLabel: "后端预测类别",
        confidenceLabel: "后端置信度",
        resultExplanationTitle: "后端结果解释",
        probabilityPanelTitle: "后端概率分布",
        modelInfoPanelTitle: "后端模型信息",
        sampleAsset: {
          sampleId: "dangshen_1",
          name: "dangshen_1.jpg",
          sizeLabel: "139 KB",
          dimensionsLabel: "700 × 466",
        },
        initialResult: {
          label: "党参 / Dangshen",
          confidence: 90.5,
          explanation: "图像的条状根茎结构、褐黄色纹理和表面纤维细节与课程样本中的党参特征更接近。",
          probabilities: [
            { label: "党参 / Dangshen", value: 90.5 },
            { label: "百合 / Baihe", value: 4.1 },
          ],
          historyRecord: {
            id: "#1024",
            date: "2026-06-05",
            time: "14:25",
            module: "图像识别",
            inputType: "图片",
            inputContent: "dangshen_1.jpg",
            output: "Dangshen",
            confidence: "90.5%",
            status: "成功",
            route: "/image-recognition",
          },
        },
        modelInfo: [
          { label: "模型类型", value: "课程中药样本分类器" },
          { label: "输出类型", value: "5 类中药材概率" },
        ],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getImageRecognitionMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/image-recognition/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.sampleAsset.sampleId).toBe("dangshen_1");
    expect(result.pageTitle).toBe("后端图像识别页");
    expect(result.syncAnalyzingMessage).toBe("后端识别接口分析中");
    expect(result.uploadButtonLabel).toBe("后端上传按钮");
    expect(result.confidenceLabel).toBe("后端置信度");
    expect(result.modelInfo[0]?.value).toBe("课程中药样本分类器");
  });

  it("downloads the project report from the backend contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['{"title":"多模态 AI 课程成果平台项目概览"}'], { type: "application/json" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="multimodal-ai-project-overview-20260606.json"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadProjectReport();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/project-report/export",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.filename).toBe("multimodal-ai-project-overview-20260606.json");
    expect(result.blob.type).toContain("application/json");
  });

  it("downloads the project delivery bundle from the backend contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(["PK"], { type: "application/zip" }), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="multimodal-ai-project-snapshot-20260606.zip"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadProjectDeliveryBundle();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/project-deliverables/export",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.filename).toBe("multimodal-ai-project-snapshot-20260606.zip");
    expect(result.blob.type).toContain("application/zip");
  });

  it("loads museum-vision metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "后端博物馆页面标题",
        pageDescription: "后端博物馆页面说明文案。",
        syncConnectingMessage: "后端连接博物馆接口中",
        syncAnalyzingMessage: "后端正在分析图像",
        syncReadyMessage: "后端首屏结果已接通",
        syncUpdateMessage: "后端重分析结果已写入历史",
        syncFallbackMessage: "后端博物馆接口兜底",
        copyActionLabel: "后端复制描述",
        copySuccessLabel: "后端已复制描述",
        copyFailureMessage: "后端复制失败提示",
        exportTagsActionLabel: "后端导出标签",
        exportTagsSuccessLabel: "后端标签已导出",
        exportTagsSuccessMessage: "后端标签文件已生成",
        exportTagsFallbackMessage: "后端标签导出兜底",
        uploadButtonLabel: "后端上传图像",
        switchSampleButtonLabel: "后端切换样例",
        sampleLoadedStatusLabel: "后端已载入样例",
        uploadSuccessStatusLabel: "后端上传成功",
        sampleSourceBadgeLabel: "后端课程样例",
        uploadSourceBadgeLabel: "后端本地文件",
        openPreviewAriaLabel: "后端打开预览",
        downloadPreviewAriaLabel: "后端下载图片",
        switchPreviewAriaLabel: "后端切换预览",
        initialAssetId: "portrait",
        sampleAssets: [
          {
            id: "portrait",
            name: "portrait_classical.jpg",
            format: "JPG",
            dimensions: "960 × 1280",
            sizeLabel: "1.82 MB",
          },
          {
            id: "landscape",
            name: "museum_sample.jpg",
            format: "JPG",
            dimensions: "768 × 768",
            sizeLabel: "0.68 MB",
          },
        ],
        initialAnalysis: {
          name: "portrait_classical.jpg",
          format: "JPG",
          dimensions: "960 × 1280",
          sizeLabel: "1.82 MB",
          sourceNote: "来源样例：Metropolitan Portrait Collection",
          uploadedAt: "2026-06-06 12:00:00",
          institution: "Metropolitan Museum",
          confidence: 89.6,
          description: "这是一幅具有古典风格的人物绘画作品。",
          artworkClue: {
            title: "古典人物肖像",
            era: "古典风格",
            category: "人物肖像",
            museumHint: "Metropolitan Museum",
            basis: "该线索根据课程样例名称与人物构图特征生成。",
          },
          tags: ["人物肖像", "古典绘画"],
          matches: [{ institution: "Metropolitan Museum", score: 89.6 }],
          historyRecord: {
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
        },
        sampleDescriptionNote: "当前描述结合样例图像的主体内容、构图风格与课程实验设定生成。",
        uploadDescriptionNote: "当前描述会同时参考上传文件名中的作品线索，以及图像颜色、纹理与构图特征，再结合课程数据集中的相似样本生成。",
        dataSourceItems: [
          {
            title: "数据来源",
            body: "本模块基于课程中的图像理解 / 跨模态实验设计。",
          },
        ],
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getMuseumVisionMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/museum-vision/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.initialAssetId).toBe("portrait");
    expect(result.pageTitle).toBe("后端博物馆页面标题");
    expect(result.syncUpdateMessage).toBe("后端重分析结果已写入历史");
    expect(result.exportTagsSuccessMessage).toBe("后端标签文件已生成");
    expect(result.sampleAssets[1]?.name).toBe("museum_sample.jpg");
    expect(result.dataSourceItems[0]?.title).toBe("数据来源");
  });

  it("loads sentiment-analysis metadata from the generated operation contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        pageTitle: "后端情感分析页",
        pageDescription: "后端情感页说明文案。",
        syncLoadingMessage: "后端同步中",
        syncAnalyzingMessage: "后端分析调用中",
        syncReadyMessage: "后端分析已接通",
        syncFallbackMessage: "后端分析兜底",
        emptyInputMessage: "后端要求先输入文本",
        textInputLabel: "后端文本输入标签",
        clearButtonLabel: "后端清空",
        sampleButtonLabel: "后端示例文本",
        analyzeButtonLabel: "后端开始分析",
        analyzeButtonBusyLabel: "后端分析中...",
        positiveOnlyButtonLabel: "后端仅积极",
        showAllButtonLabel: "后端显示全部",
        sampleText: "Backend sample review text.",
        pendingResult: {
          label: "中性",
          englishLabel: "Neutral",
          confidence: 50,
          score: 0,
          tags: ["待分析"],
          positiveMatches: [{ label: "wonderful", score: 0.94 }],
          negativeMatches: [{ label: "slow", score: 0.18 }],
          explanation: "请输入文本并点击“开始分析”。",
          status: "待分析",
          processingTime: "--",
          taskId: "SA-PENDING",
          completedAt: "--",
          historyRecord: {
            id: "#1023",
            date: "2026-06-05",
            time: "14:18",
            module: "情感分析",
            inputType: "文本",
            inputContent: "IMDB 评论",
            output: "Positive",
            confidence: "88.4%",
            status: "成功",
            route: "/sentiment-analysis",
          },
        },
        modelLabel: "后端情感模型说明",
        analysisNote: "后端分析说明文案。",
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSentimentAnalysisMetadata();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/sentiment-analysis/metadata",
      expect.objectContaining({
        method: "GET",
      }),
    );
    expect(result.pageTitle).toBe("后端情感分析页");
    expect(result.analyzeButtonLabel).toBe("后端开始分析");
    expect(result.positiveOnlyButtonLabel).toBe("后端仅积极");
    expect(result.sampleText).toBe("Backend sample review text.");
    expect(result.modelLabel).toBe("后端情感模型说明");
  });

  it("downloads museum tags with the backend filename contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(["# Smithsonian Institution\n课程数据集比对"], { type: "text/plain" }), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": 'attachment; filename="smithsonian_786-tags-20260606-080000.txt"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadMuseumVisionTags({
      fileName: "smithsonian_786.jpg",
      institution: "Smithsonian Institution",
      tags: ["课程数据集比对", "Smithsonian Institution"],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/museum-vision/export-tags",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fileName: "smithsonian_786.jpg",
          institution: "Smithsonian Institution",
          tags: ["课程数据集比对", "Smithsonian Institution"],
        }),
      }),
    );
    expect(result.filename).toBe("smithsonian_786-tags-20260606-080000.txt");
    expect(result.blob.type).toContain("text/plain");
  });
});
