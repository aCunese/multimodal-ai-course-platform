from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

from ..schemas import (
    AppShellMetadataResponse,
    DashboardSummaryResponse,
    DashboardMetadataResponse,
    ApiErrorResponse,
    GenerationHistoryResponse,
    HealthResponse,
    HistoryExportResponse,
    HistoryMetadataResponse,
    HistoryListResponse,
    ImageRecognitionMetadataResponse,
    ImageRecognitionRequest,
    ImageRecognitionResponse,
    MuseumVisionMetadataResponse,
    MuseumVisionRequest,
    MuseumVisionResponse,
    MuseumVisionTagExportRequest,
    ProjectReportExportResponse,
    RuntimeAssetsResponse,
    RuntimeAssetsWarmupResponse,
    SearchResponse,
    SentimentAnalysisMetadataResponse,
    SentimentAnalysisRequest,
    SentimentAnalysisResponse,
    TextGenerationMetadataResponse,
    TextGenerationRequest,
    TextGenerationResponse,
)
from ..services.core import (
    analyze_museum_vision,
    analyze_sentiment,
    classify_image,
    export_project_delivery_bundle,
    export_history_records,
    export_museum_tags,
    export_project_report,
    get_app_shell_metadata,
    get_dashboard_metadata,
    generate_text,
    get_dashboard_summary,
    get_history_metadata,
    get_image_recognition_metadata,
    get_museum_vision_metadata,
    get_runtime_assets_status,
    get_sentiment_analysis_metadata,
    get_text_generation_metadata,
    list_generation_history,
    list_history_records,
    search_platform,
    warm_runtime_assets,
    UploadValidationError,
)

router = APIRouter(prefix="/api/v1")

HISTORY_EXPORT_RESPONSES = {
    200: {
        "description": "Exported history records as a downloadable JSON or CSV attachment.",
        "content": {
            "text/csv": {
                "schema": {
                    "type": "string",
                    "format": "binary",
                }
            }
        },
        "headers": {
            "Content-Disposition": {
                "description": "Suggested attachment filename for the exported history file.",
                "schema": {"type": "string"},
            }
        },
    }
}

PROJECT_REPORT_EXPORT_RESPONSES = {
    200: {
        "description": "Exported the current project overview as a downloadable JSON attachment.",
        "headers": {
            "Content-Disposition": {
                "description": "Suggested attachment filename for the exported project report.",
                "schema": {"type": "string"},
            }
        },
    }
}

PROJECT_DELIVERY_BUNDLE_EXPORT_RESPONSES = {
    200: {
        "description": "Exported the current project snapshot as a downloadable ZIP bundle.",
        "content": {
            "application/zip": {
                "schema": {
                    "type": "string",
                    "format": "binary",
                }
            }
        },
        "headers": {
            "Content-Disposition": {
                "description": "Suggested attachment filename for the exported delivery bundle.",
                "schema": {"type": "string"},
            }
        },
    }
}

MUSEUM_TAG_EXPORT_RESPONSES = {
    200: {
        "description": "Exported the current museum analysis tags as a downloadable text attachment.",
        "content": {
            "text/plain": {
                "schema": {
                    "type": "string",
                    "format": "binary",
                }
            }
        },
        "headers": {
            "Content-Disposition": {
                "description": "Suggested attachment filename for the exported museum tag file.",
                "schema": {"type": "string"},
            }
        },
    }
}


@router.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/dashboard", response_model=DashboardSummaryResponse)
def dashboard() -> DashboardSummaryResponse:
    return get_dashboard_summary()


@router.get("/dashboard/metadata", response_model=DashboardMetadataResponse)
def dashboard_metadata() -> DashboardMetadataResponse:
    return get_dashboard_metadata()


@router.get("/runtime-assets", response_model=RuntimeAssetsResponse)
def runtime_assets() -> RuntimeAssetsResponse:
    return get_runtime_assets_status()


@router.post("/runtime-assets/warmup", response_model=RuntimeAssetsWarmupResponse)
def runtime_assets_warmup() -> RuntimeAssetsWarmupResponse:
    return warm_runtime_assets()


@router.get("/history", response_model=HistoryListResponse)
def history(
    keyword: str = Query(default=""),
    module: str = Query(default="全部"),
    status: str = Query(default="全部"),
) -> HistoryListResponse:
    return list_history_records(keyword=keyword, module=module, status=status)


@router.get("/history/metadata", response_model=HistoryMetadataResponse)
def history_metadata() -> HistoryMetadataResponse:
    return get_history_metadata()


@router.get("/app-shell/metadata", response_model=AppShellMetadataResponse)
def app_shell_metadata() -> AppShellMetadataResponse:
    return get_app_shell_metadata()


@router.get("/search", response_model=SearchResponse)
def search(keyword: str = Query(default="")) -> SearchResponse:
    return search_platform(keyword)


@router.get(
    "/project-report/export",
    response_model=ProjectReportExportResponse,
    responses=PROJECT_REPORT_EXPORT_RESPONSES,
)
def project_report_export() -> Response:
    filename, media_type, content = export_project_report()
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/project-deliverables/export",
    responses=PROJECT_DELIVERY_BUNDLE_EXPORT_RESPONSES,
)
def project_delivery_bundle_export() -> Response:
    filename, media_type, content = export_project_delivery_bundle()
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/image-recognition/metadata",
    response_model=ImageRecognitionMetadataResponse,
)
def image_recognition_metadata() -> ImageRecognitionMetadataResponse:
    return get_image_recognition_metadata()


@router.get(
    "/history/export",
    response_model=HistoryExportResponse,
    responses=HISTORY_EXPORT_RESPONSES,
)
def export_history(
    keyword: str = Query(default=""),
    module: str = Query(default="全部"),
    status: str = Query(default="全部"),
    format: Literal["json", "csv"] = Query(default="json"),
) -> Response:
    filename, media_type, content = export_history_records(
        keyword=keyword,
        module=module,
        status=status,
        export_format=format,
    )
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/image-recognition/predict",
    response_model=ImageRecognitionResponse,
    responses={400: {"model": ApiErrorResponse}},
)
def image_recognition(payload: ImageRecognitionRequest) -> ImageRecognitionResponse:
    try:
        return classify_image(payload)
    except UploadValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/sentiment-analysis/analyze", response_model=SentimentAnalysisResponse)
def sentiment_analysis(payload: SentimentAnalysisRequest) -> SentimentAnalysisResponse:
    return analyze_sentiment(payload)


@router.get("/sentiment-analysis/metadata", response_model=SentimentAnalysisMetadataResponse)
def sentiment_analysis_metadata() -> SentimentAnalysisMetadataResponse:
    return get_sentiment_analysis_metadata()


@router.get("/text-generation/history", response_model=GenerationHistoryResponse)
def text_generation_history() -> GenerationHistoryResponse:
    return list_generation_history()


@router.get("/text-generation/metadata", response_model=TextGenerationMetadataResponse)
def text_generation_metadata() -> TextGenerationMetadataResponse:
    return get_text_generation_metadata()


@router.get("/museum-vision/metadata", response_model=MuseumVisionMetadataResponse)
def museum_vision_metadata() -> MuseumVisionMetadataResponse:
    return get_museum_vision_metadata()


@router.post("/text-generation/generate", response_model=TextGenerationResponse)
def text_generation(payload: TextGenerationRequest) -> TextGenerationResponse:
    return generate_text(payload)


@router.post(
    "/museum-vision/analyze",
    response_model=MuseumVisionResponse,
    responses={400: {"model": ApiErrorResponse}},
)
def museum_vision(payload: MuseumVisionRequest) -> MuseumVisionResponse:
    try:
        return analyze_museum_vision(payload)
    except UploadValidationError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post(
    "/museum-vision/export-tags",
    responses=MUSEUM_TAG_EXPORT_RESPONSES,
)
def museum_vision_export_tags(payload: MuseumVisionTagExportRequest) -> Response:
    filename, media_type, content = export_museum_tags(payload)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
