import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MuseumVisionPage } from "./page";

const { analyzeMuseumVisionMock, clipboardWriteTextMock, downloadMuseumVisionTagsMock, getMuseumVisionMetadataMock } = vi.hoisted(() => ({
  analyzeMuseumVisionMock: vi.fn(),
  clipboardWriteTextMock: vi.fn(),
  downloadMuseumVisionTagsMock: vi.fn(),
  getMuseumVisionMetadataMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  analyzeMuseumVision: analyzeMuseumVisionMock,
  downloadMuseumVisionTags: downloadMuseumVisionTagsMock,
  getMuseumVisionMetadata: getMuseumVisionMetadataMock,
}));

class MockImage {
  naturalWidth = 768;
  naturalHeight = 768;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;

  readAsDataURL(file: Blob) {
    const mimeType = file.type || "image/jpeg";
    this.result = `data:${mimeType};base64,${btoa("mock-museum-image")}`;
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

describe("MuseumVisionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clipboardWriteTextMock.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Blob(["museum-image"], { type: "image/jpeg" }))));
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("FileReader", MockFileReader);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:uploaded-museum-image"),
      revokeObjectURL: vi.fn(),
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: clipboardWriteTextMock,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the initial museum sample and refreshes results after switching presets", async () => {
    getMuseumVisionMetadataMock.mockResolvedValue({
      pageTitle: "后端博物馆图像页",
      pageDescription: "后端驱动的博物馆图像页面说明。",
      syncConnectingMessage: "后端连接博物馆接口中",
      syncAnalyzingMessage: "后端正在请求博物馆分析",
      syncReadyMessage: "后端博物馆首屏结果已接通。",
      syncUpdateMessage: "后端博物馆结果已写入历史。",
      syncFallbackMessage: "后端博物馆接口兜底。",
      copyActionLabel: "后端复制描述",
      copySuccessLabel: "后端已复制描述",
      copyFailureMessage: "后端复制失败提示。",
      exportTagsActionLabel: "后端导出标签",
      exportTagsSuccessLabel: "后端标签已导出",
      exportTagsSuccessMessage: "后端标签文件已生成。",
      exportTagsFallbackMessage: "后端标签导出兜底。",
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
          name: "portrait_backend_sample.jpg",
          format: "PNG",
          dimensions: "1000 × 1400",
          sizeLabel: "2.01 MB",
        },
        {
          id: "landscape",
          name: "museum_backend_sample.jpg",
          format: "WEBP",
          dimensions: "800 × 800",
          sizeLabel: "0.72 MB",
        },
      ],
      initialAnalysis: {
        name: "portrait_backend_sample.jpg",
        format: "PNG",
        dimensions: "1000 × 1400",
        sizeLabel: "2.01 MB",
        sourceNote: "来源样例：Backend Portrait Collection",
        uploadedAt: "2026-06-06 17:09:00",
        institution: "Metropolitan Museum",
        confidence: 88.8,
        description: "这是一幅由后端 metadata 初始化的人物绘画样例。",
        artworkClue: {
          title: "后端人物肖像样例",
          era: "古典风格",
          category: "人物肖像",
          museumHint: "Metropolitan Museum",
          basis: "该线索由后端 metadata 直接提供。",
        },
        tags: ["后端样例", "人物肖像"],
        matches: [
          { institution: "Metropolitan Museum", score: 88.8 },
          { institution: "Smithsonian Institution", score: 2.2 },
        ],
        historyRecord: {
          id: "#5099",
          date: "2026-06-06",
          time: "17:09",
          module: "博物馆图像理解",
          inputType: "图片",
          inputContent: "portrait_backend_sample.jpg",
          output: "Metropolitan Museum",
          confidence: "88.8%",
          status: "成功",
          route: "/museum-vision",
        },
      },
      sampleDescriptionNote: "样例描述由后端 metadata 提供。",
      uploadDescriptionNote: "上传描述由后端 metadata 提供。",
      dataSourceItems: [
        { title: "数据来源", body: "后端 metadata 数据来源说明。" },
        { title: "当前状态", body: "后端 metadata 当前状态说明。" },
      ],
    });

    analyzeMuseumVisionMock
      .mockResolvedValueOnce({
        name: "portrait_backend_sample.jpg",
        format: "PNG",
        dimensions: "1000 × 1400",
        sizeLabel: "2.01 MB",
        sourceNote: "来源样例：Backend Portrait Collection",
        uploadedAt: "2026-06-06 17:10:00",
        institution: "Metropolitan Museum",
        confidence: 89.6,
        description: "这是一幅具有古典风格的人物绘画作品。",
        artworkClue: {
          title: "古典人物肖像",
          era: "古典风格",
          category: "人物肖像",
          museumHint: "Metropolitan Museum",
          basis: "该线索由样例名称和题材标签归纳生成。",
        },
        tags: ["人物肖像", "古典绘画"],
        matches: [
          { institution: "Metropolitan Museum", score: 89.6 },
          { institution: "Smithsonian Institution", score: 1.4 },
        ],
        historyRecord: {
          id: "#5101",
          date: "2026-06-06",
          time: "17:10",
          module: "博物馆图像理解",
          inputType: "图片",
          inputContent: "portrait_classical.jpg",
          output: "Metropolitan Museum",
          confidence: "89.6%",
          status: "成功",
          route: "/museum-vision",
        },
      })
      .mockResolvedValueOnce({
        name: "museum_sample.jpg",
        format: "JPG",
        dimensions: "768 × 768",
        sizeLabel: "0.68 MB",
        sourceNote: "来源样例：Smithsonian Dataset Match",
        uploadedAt: "2026-06-06 17:11:00",
        institution: "Smithsonian Institution",
        confidence: 92.4,
        description: "该样例与 Smithsonian 课程数据集中的馆藏图像最为接近。",
        artworkClue: {
          title: "馆藏图像课程样例",
          era: "",
          category: "馆藏图像",
          museumHint: "Smithsonian Institution",
          basis: "该线索由样例名称和课程标签归纳生成。",
        },
        tags: ["馆藏图像", "课程样例"],
        matches: [
          { institution: "Smithsonian Institution", score: 92.4 },
          { institution: "Metropolitan Museum", score: 4.5 },
        ],
        historyRecord: {
          id: "#5102",
          date: "2026-06-06",
          time: "17:11",
          module: "博物馆图像理解",
          inputType: "图片",
          inputContent: "museum_sample.jpg",
          output: "Smithsonian Institution",
          confidence: "92.4%",
          status: "成功",
          route: "/museum-vision",
        },
      });

    render(<MuseumVisionPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "后端博物馆图像页" })).toBeInTheDocument();
    expect(screen.getByText("后端驱动的博物馆图像页面说明。")).toBeInTheDocument();
    expect(screen.queryByText("后端博物馆首屏结果已接通。")).not.toBeInTheDocument();
    expect(getMuseumVisionMetadataMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("heading", { level: 2, name: "大都会艺术博物馆" })).toBeInTheDocument();
    expect(await screen.findByText("portrait_backend_sample.jpg")).toBeInTheDocument();
    expect(screen.getByText("古典人物肖像")).toBeInTheDocument();
    expect(screen.getByText("样例描述由后端 metadata 提供。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端复制描述" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端导出标签" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端上传图像" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端切换样例" })).toBeInTheDocument();
    expect(screen.getByText("后端已载入样例")).toBeInTheDocument();
    expect(screen.getByText("后端课程样例")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端打开预览" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端下载图片" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端切换预览" })).toBeInTheDocument();
    await waitFor(() => {
      expect(analyzeMuseumVisionMock).toHaveBeenCalledTimes(1);
    });
    expect(analyzeMuseumVisionMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        fileName: "portrait_backend_sample.jpg",
        format: "PNG",
        dimensions: "1000 × 1400",
        sizeLabel: "2.01 MB",
        sourceMode: "sample",
        imageDataUrl: expect.stringContaining("data:image/svg+xml"),
      }),
    );

    await userEvent.click(screen.getByRole("button", { name: "后端复制描述" }));

    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledWith("这是一幅具有古典风格的人物绘画作品。");
    });

    expect(await screen.findByRole("button", { name: "后端已复制描述" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "后端切换样例" }));

    await waitFor(() => {
      expect(analyzeMuseumVisionMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByRole("heading", { level: 2, name: "史密森学会" })).toBeInTheDocument();
    expect(await screen.findByText("来源样例：史密森数据集匹配结果")).toBeInTheDocument();
    expect(await screen.findByText("museum_backend_sample.jpg")).toBeInTheDocument();
    expect(await screen.findByText("馆藏图像课程样例")).toBeInTheDocument();
    expect(await screen.findByText("后端博物馆结果已写入历史。")).toBeInTheDocument();
    expect(analyzeMuseumVisionMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        fileName: "museum_backend_sample.jpg",
        format: "WEBP",
        dimensions: "800 × 800",
        sizeLabel: "0.72 MB",
        sourceMode: "sample",
        imageDataUrl: expect.any(String),
      }),
    );
  });

  it("shows the backend validation message when an uploaded museum image is invalid", async () => {
    getMuseumVisionMetadataMock.mockRejectedValueOnce(new Error("metadata offline"));

    analyzeMuseumVisionMock
      .mockResolvedValueOnce({
        name: "portrait_classical.jpg",
        format: "JPG",
        dimensions: "960 × 1280",
        sizeLabel: "1.82 MB",
        sourceNote: "来源样例：Metropolitan Portrait Collection",
        uploadedAt: "2026-06-06 17:10:00",
        institution: "Metropolitan Museum",
        confidence: 89.6,
        description: "这是一幅具有古典风格的人物绘画作品。",
        artworkClue: {
          title: "古典人物肖像",
          era: "古典风格",
          category: "人物肖像",
          museumHint: "Metropolitan Museum",
          basis: "该线索由样例名称和题材标签归纳生成。",
        },
        tags: ["人物肖像", "古典绘画"],
        matches: [
          { institution: "Metropolitan Museum", score: 89.6 },
          { institution: "Smithsonian Institution", score: 1.4 },
        ],
        historyRecord: {
          id: "#5101",
          date: "2026-06-06",
          time: "17:10",
          module: "博物馆图像理解",
          inputType: "图片",
          inputContent: "portrait_classical.jpg",
          output: "Metropolitan Museum",
          confidence: "89.6%",
          status: "成功",
          route: "/museum-vision",
        },
      })
      .mockRejectedValueOnce(new Error("上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。"));

    render(<MuseumVisionPage />);

    expect(await screen.findByRole("heading", { name: "大都会艺术博物馆" })).toBeInTheDocument();
    await waitFor(() => {
      expect(analyzeMuseumVisionMock).toHaveBeenCalledTimes(1);
    });

    const file = new File(["broken-upload"], "broken-upload.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await userEvent.upload(fileInput as HTMLInputElement, file);

    await waitFor(() => {
      expect(analyzeMuseumVisionMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole("heading", { name: "大都会艺术博物馆" })).toBeInTheDocument();
  });

  it("exports museum tags through the backend download helper", async () => {
    getMuseumVisionMetadataMock.mockRejectedValueOnce(new Error("metadata offline"));

    analyzeMuseumVisionMock.mockResolvedValueOnce({
      name: "portrait_classical.jpg",
      format: "JPG",
      dimensions: "960 × 1280",
      sizeLabel: "1.82 MB",
      sourceNote: "来源样例：Metropolitan Portrait Collection",
      uploadedAt: "2026-06-06 17:10:00",
      institution: "Metropolitan Museum",
      confidence: 89.6,
      description: "这是一幅具有古典风格的人物绘画作品。",
      artworkClue: {
        title: "古典人物肖像",
        era: "古典风格",
        category: "人物肖像",
        museumHint: "Metropolitan Museum",
        basis: "该线索由样例名称和题材标签归纳生成。",
      },
      tags: ["人物肖像", "古典绘画"],
      matches: [
        { institution: "Metropolitan Museum", score: 89.6 },
        { institution: "Smithsonian Institution", score: 1.4 },
      ],
      historyRecord: {
        id: "#5101",
        date: "2026-06-06",
        time: "17:10",
        module: "博物馆图像理解",
        inputType: "图片",
        inputContent: "portrait_classical.jpg",
        output: "Metropolitan Museum",
        confidence: "89.6%",
        status: "成功",
        route: "/museum-vision",
      },
    });
    downloadMuseumVisionTagsMock.mockResolvedValue({
      blob: new Blob(["# Metropolitan Museum\n人物肖像"], { type: "text/plain;charset=utf-8" }),
      filename: "portrait_classical-tags-20260606.txt",
    });

    const createObjectURLSpy = vi.fn<(object: Blob | MediaSource) => string>().mockReturnValue("blob:museum-tags");
    const revokeObjectURLSpy = vi.fn<(url: string) => void>();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURLSpy,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURLSpy,
    });

    const createElementOriginal = document.createElement.bind(document);
    const anchor = createElementOriginal("a");
    const clickSpy = vi.fn();
    anchor.click = clickSpy;
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => (tagName === "a" ? anchor : createElementOriginal(tagName)));

    render(<MuseumVisionPage />);

    expect(await screen.findByRole("heading", { name: "大都会艺术博物馆" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "导出标签" }));

    await waitFor(() => {
      expect(downloadMuseumVisionTagsMock).toHaveBeenCalledWith({
        fileName: "portrait_classical.jpg",
        institution: "Metropolitan Museum",
        tags: ["人物肖像", "古典绘画"],
      });
    });

    expect(anchor.download).toBe("portrait_classical-tags-20260606.txt");
    expect(anchor.href).toBe("blob:museum-tags");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:museum-tags");
    expect(await screen.findByText("标签导出文件已由后端接口生成。")).toBeInTheDocument();

    createElementSpy.mockRestore();
  });
});
