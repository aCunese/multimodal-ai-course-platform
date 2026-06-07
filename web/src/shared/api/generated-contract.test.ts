import { describe, expect, it } from "vitest";

import { backendApiOperations } from "./types";

describe("generated API contract runtime metadata", () => {
  it("preserves backend query defaults for history operations", () => {
    expect(backendApiOperations.history_api_v1_history_get.queryDefaults).toEqual({
      keyword: "",
      module: "全部",
      status: "全部",
    });

    expect(backendApiOperations.export_history_api_v1_history_export_get.queryDefaults).toEqual({
      keyword: "",
      module: "全部",
      status: "全部",
      format: "json",
    });

    expect(backendApiOperations.search_api_v1_search_get.queryDefaults).toEqual({
      keyword: "",
    });
  });

  it("preserves backend error-response schemas for typed client parsing", () => {
    expect(backendApiOperations.image_recognition_api_v1_image_recognition_predict_post.errorResponseSchemas).toEqual({
      "400": "ApiErrorResponse",
      "422": "HTTPValidationError",
    });

    expect(backendApiOperations.sentiment_analysis_api_v1_sentiment_analysis_analyze_post.errorResponseSchemas).toEqual({
      "422": "HTTPValidationError",
    });
  });
});
