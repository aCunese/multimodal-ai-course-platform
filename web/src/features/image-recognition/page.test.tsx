import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ImageRecognitionPage } from "./page";

const { classifyImageMock, getImageRecognitionMetadataMock } = vi.hoisted(() => ({
  classifyImageMock: vi.fn(),
  getImageRecognitionMetadataMock: vi.fn(),
}));

vi.mock("../../shared/api/client", () => ({
  classifyImage: classifyImageMock,
  getImageRecognitionMetadata: getImageRecognitionMetadataMock,
}));

class MockImage {
  naturalWidth = 640;
  naturalHeight = 480;
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
    this.result = `data:${mimeType};base64,${btoa("mock-image-data")}`;
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

describe("ImageRecognitionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Blob(["sample-image"], { type: "image/jpeg" }))));
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("FileReader", MockFileReader);
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:uploaded-herbal-image"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the sample and updates recognition results after a file upload", async () => {
    getImageRecognitionMetadataMock.mockResolvedValue({
      pageTitle: "后端图像识别页",
      pageDescription: "后端图像识别页面说明。",
      syncLoadingMessage: "后端识别结果同步中",
      syncAnalyzingMessage: "后端识别接口分析中",
      syncReadyMessage: "后端识别结果已接通。",
      syncFallbackMessage: "后端识别结果兜底。",
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
        name: "curriculum-dangshen-sample.jpg",
        sizeLabel: "256 KB",
        dimensionsLabel: "800 × 600",
      },
      initialResult: {
        label: "党参 / Dangshen",
        confidence: 90.5,
        explanation: "课程样例与党参特征高度匹配。",
        probabilities: [
          { label: "党参 / Dangshen", value: 90.5 },
          { label: "百合 / Baihe", value: 4.1 },
        ],
        historyRecord: {
          id: "#4099",
          date: "2026-06-06",
          time: "16:59",
          module: "图像识别",
          inputType: "图片",
          inputContent: "curriculum-dangshen-sample.jpg",
          output: "Dangshen",
          confidence: "90.5%",
          status: "成功",
          route: "/image-recognition",
        },
      },
      modelInfo: [
        { label: "模型类型", value: "课程中药样本分类器（后端 metadata）" },
        { label: "输出类型", value: "5 类中药材概率" },
      ],
    });

    classifyImageMock
      .mockResolvedValueOnce({
        label: "党参 / Dangshen",
        confidence: 90.5,
        explanation: "课程样例与党参特征高度匹配。",
        probabilities: [
          { label: "党参 / Dangshen", value: 90.5 },
          { label: "百合 / Baihe", value: 4.1 },
        ],
        historyRecord: {
          id: "#4101",
          date: "2026-06-06",
          time: "17:00",
          module: "图像识别",
          inputType: "图片",
          inputContent: "dangshen_1.jpg",
          output: "Dangshen",
          confidence: "90.5%",
          status: "成功",
          route: "/image-recognition",
        },
      })
      .mockResolvedValueOnce({
        label: "槐花 / Huaihua",
        confidence: 66.1,
        explanation: "上传图片的纹理与槐花课程样本更接近。",
        probabilities: [
          { label: "槐花 / Huaihua", value: 66.1 },
          { label: "党参 / Dangshen", value: 18.2 },
        ],
        historyRecord: {
          id: "#4102",
          date: "2026-06-06",
          time: "17:01",
          module: "图像识别",
          inputType: "图片",
          inputContent: "huaihua_1.jpg",
          output: "Huaihua",
          confidence: "66.1%",
          status: "成功",
          route: "/image-recognition",
        },
      });

    render(<ImageRecognitionPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "后端图像识别页" })).toBeInTheDocument();
    expect(screen.getByText("后端图像识别页面说明。")).toBeInTheDocument();
    expect(screen.queryByText("后端识别结果已接通。")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "党参" })).toBeInTheDocument();
    expect(getImageRecognitionMetadataMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("curriculum-dangshen-sample.jpg")).toBeInTheDocument();
    expect(screen.getByText("课程中药样本分类器（后端 metadata）")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端上传区" })).toBeInTheDocument();
    expect(screen.getByText("后端拖拽上传标题")).toBeInTheDocument();
    expect(screen.getByText("后端上传格式说明")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端上传按钮" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端示例按钮" })).toBeInTheDocument();
    expect(screen.getByText("后端已上传图片")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "后端重新上传" })).toBeInTheDocument();
    expect(screen.getByText("后端已加载")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端识别结果" })).toBeInTheDocument();
    expect(screen.getByText("后端预测类别")).toBeInTheDocument();
    expect(screen.getByText("后端结果解释")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端概率分布" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "后端模型信息" })).toBeInTheDocument();
    await waitFor(() => {
      expect(classifyImageMock).toHaveBeenCalledTimes(1);
    });
    expect(classifyImageMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        fileName: "curriculum-dangshen-sample.jpg",
        width: 800,
        height: 600,
        sizeLabel: "256 KB",
        imageDataUrl: expect.any(String),
      }),
    );

    const file = new File(["huaihua-image"], "huaihua_1.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await userEvent.upload(fileInput as HTMLInputElement, file);

    await waitFor(() => {
      expect(classifyImageMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("后端识别结果已接通。")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "槐花" })).toBeInTheDocument();
    expect(await screen.findByText("huaihua_1.jpg")).toBeInTheDocument();
    expect(classifyImageMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        fileName: "huaihua_1.jpg",
        width: 640,
        height: 480,
        sizeLabel: expect.stringContaining("KB"),
        imageDataUrl: expect.any(String),
      }),
    );
  });

  it("shows the backend validation message when an uploaded image is invalid", async () => {
    getImageRecognitionMetadataMock.mockRejectedValueOnce(new Error("metadata offline"));

    classifyImageMock
      .mockResolvedValueOnce({
        label: "党参 / Dangshen",
        confidence: 90.5,
        explanation: "课程样例与党参特征高度匹配。",
        probabilities: [
          { label: "党参 / Dangshen", value: 90.5 },
          { label: "百合 / Baihe", value: 4.1 },
        ],
        historyRecord: {
          id: "#4101",
          date: "2026-06-06",
          time: "17:00",
          module: "图像识别",
          inputType: "图片",
          inputContent: "dangshen_1.jpg",
          output: "Dangshen",
          confidence: "90.5%",
          status: "成功",
          route: "/image-recognition",
        },
      })
      .mockRejectedValueOnce(new Error("上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。"));

    render(<ImageRecognitionPage />);

    expect(await screen.findByRole("heading", { name: "党参" })).toBeInTheDocument();
    await waitFor(() => {
      expect(classifyImageMock).toHaveBeenCalledTimes(1);
    });

    const file = new File(["broken-upload"], "broken-upload.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    await userEvent.upload(fileInput as HTMLInputElement, file);

    await waitFor(() => {
      expect(classifyImageMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("上传的文件不是有效图片，请重新选择 JPG、PNG 或 WEBP 图片。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "党参" })).toBeInTheDocument();
  });
});
