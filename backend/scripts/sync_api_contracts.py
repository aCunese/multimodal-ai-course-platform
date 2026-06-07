from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import app

PROJECT_ROOT = BACKEND_ROOT.parent
OPENAPI_OUTPUT_PATH = PROJECT_ROOT / "docs" / "api" / "openapi.json"
TS_OUTPUT_PATH = PROJECT_ROOT / "web" / "src" / "shared" / "api" / "generated-contract.ts"


def _quote(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _property_name(name: str) -> str:
    if name.isidentifier():
        return name
    return _quote(name)


def _wrap_array(item_type: str) -> str:
    if "|" in item_type or "&" in item_type:
        return f"Array<{item_type}>"
    return f"Array<{item_type}>"


def _schema_to_ts(schema: dict[str, Any]) -> str:
    ref = schema.get("$ref")
    if ref:
        return ref.rsplit("/", 1)[-1]

    enum = schema.get("enum")
    if enum:
        return " | ".join(_quote(item) for item in enum)

    const = schema.get("const")
    if const is not None:
        return _quote(const)

    any_of = schema.get("anyOf")
    if any_of:
        return " | ".join(_schema_to_ts(option) for option in any_of)

    one_of = schema.get("oneOf")
    if one_of:
        return " | ".join(_schema_to_ts(option) for option in one_of)

    all_of = schema.get("allOf")
    if all_of:
        return " & ".join(_schema_to_ts(option) for option in all_of)

    schema_type = schema.get("type")

    if schema_type == "array":
        return _wrap_array(_schema_to_ts(schema.get("items", {})))

    if schema_type == "object" or "properties" in schema:
        properties = schema.get("properties", {})
        required = set(schema.get("required", []))
        additional_properties = schema.get("additionalProperties")

        if not properties and not additional_properties:
            return "Record<string, unknown>"

        lines = ["{"]
        for name, property_schema in properties.items():
            optional_marker = "" if name in required else "?"
            lines.append(f"  {_property_name(name)}{optional_marker}: {_schema_to_ts(property_schema)};")

        if additional_properties:
            if additional_properties is True:
                lines.append("  [key: string]: unknown;")
            else:
                lines.append(f"  [key: string]: {_schema_to_ts(additional_properties)};")

        lines.append("}")
        return "\n".join(lines)

    if schema_type == "string":
        return "string"
    if schema_type == "integer" or schema_type == "number":
        return "number"
    if schema_type == "boolean":
        return "boolean"
    if schema_type == "null":
        return "null"

    if schema:
        return "unknown"
    return "never"


def _render_parameter_object(parameters: list[dict[str, Any]], location: str) -> str:
    scoped_parameters = [parameter for parameter in parameters if parameter.get("in") == location]

    if not scoped_parameters:
        return "never"

    lines = ["{"]
    for parameter in scoped_parameters:
        parameter_name = parameter["name"]
        optional_marker = "" if parameter.get("required") else "?"
        parameter_type = _schema_to_ts(parameter.get("schema", {}))
        lines.append(f"  {_property_name(parameter_name)}{optional_marker}: {parameter_type};")
    lines.append("}")
    return "\n".join(lines)


def _render_request_body_type(operation: dict[str, Any]) -> str:
    request_body = operation.get("requestBody")
    if not request_body:
        return "never"

    content = request_body.get("content", {})
    if "application/json" in content:
        schema = content["application/json"].get("schema")
        return _schema_to_ts(schema) if schema else "unknown"

    for media_type in content.values():
        schema = media_type.get("schema")
        return _schema_to_ts(schema) if schema else "unknown"

    return "unknown"


def _collect_query_defaults(parameters: list[dict[str, Any]]) -> dict[str, Any]:
    defaults: dict[str, Any] = {}

    for parameter in parameters:
        if parameter.get("in") != "query":
            continue

        schema = parameter.get("schema", {})
        if "default" not in schema:
            continue

        defaults[parameter["name"]] = schema["default"]

    return defaults


def _render_default_object(defaults: dict[str, Any]) -> str:
    if not defaults:
        return "Record<string, never>"

    lines = ["{"]
    for name, value in defaults.items():
        lines.append(f"  {_property_name(name)}: {_quote(value)};")
    lines.append("}")
    return "\n".join(lines)


def _get_success_response(operation: dict[str, Any]) -> tuple[str | None, dict[str, Any] | None]:
    responses = operation.get("responses", {})

    for status_code in ("200", "201", "202", "204"):
        response = responses.get(status_code)
        if response:
            return status_code, response

    return None, None


def _collect_error_responses(operation: dict[str, Any]) -> dict[str, dict[str, Any]]:
    responses = operation.get("responses", {})
    error_responses: dict[str, dict[str, Any]] = {}

    for status_code, response in responses.items():
        if status_code in {"200", "201", "202", "204"}:
            continue
        error_responses[status_code] = response

    return error_responses


def _extract_response_schema_name(response: dict[str, Any]) -> str | None:
    content = response.get("content", {})

    if "application/json" in content:
        schema = content["application/json"].get("schema", {})
        ref = schema.get("$ref")
        if ref:
            return ref.rsplit("/", 1)[-1]
        if schema:
            return _schema_to_ts(schema)
        return None

    for media_type in content.values():
        schema = media_type.get("schema", {})
        ref = schema.get("$ref")
        if ref:
            return ref.rsplit("/", 1)[-1]
        if schema:
            return _schema_to_ts(schema)

    return None


def _render_error_response_types(error_responses: dict[str, dict[str, Any]]) -> str:
    if not error_responses:
        return "Record<string, never>"

    lines = ["{"]
    for status_code, response in sorted(error_responses.items(), key=lambda item: int(item[0])):
        schema_name = _extract_response_schema_name(response) or "unknown"
        lines.append(f"  {status_code}: {schema_name};")
    lines.append("}")
    return "\n".join(lines)


def _collect_error_response_schemas(error_responses: dict[str, dict[str, Any]]) -> dict[str, str]:
    schemas: dict[str, str] = {}

    for status_code, response in sorted(error_responses.items(), key=lambda item: int(item[0])):
        schema_name = _extract_response_schema_name(response)
        if schema_name:
            schemas[status_code] = schema_name

    return schemas


def _render_success_response_type(operation: dict[str, Any]) -> str:
    _, response = _get_success_response(operation)
    if not response:
        return "unknown"

    content = response.get("content", {})
    if "application/json" in content:
        schema = content["application/json"].get("schema")
        return _schema_to_ts(schema) if schema else "unknown"

    for media_type in content.values():
        schema = media_type.get("schema")
        return _schema_to_ts(schema) if schema else "unknown"

    return "unknown"


def _collect_success_response_content_types(operation: dict[str, Any]) -> list[str]:
    _, response = _get_success_response(operation)
    if not response:
        return []

    return sorted(response.get("content", {}).keys())


def _collect_success_response_header_keys(operation: dict[str, Any]) -> list[str]:
    _, response = _get_success_response(operation)
    if not response:
        return []

    return sorted(response.get("headers", {}).keys())


def _render_operation_contracts(openapi_schema: dict[str, Any]) -> list[str]:
    path_items = openapi_schema.get("paths", {})
    lines = ["export type BackendApiOperationMap = {"]
    runtime_lines = ["export const backendApiOperations = {"]

    for path_name in sorted(path_items):
        path_item = path_items[path_name]
        for method_name in sorted(path_item):
            operation = path_item[method_name]
            operation_id = operation.get("operationId")
            if not operation_id:
                continue

            parameters = operation.get("parameters", [])
            query_type = _render_parameter_object(parameters, "query")
            path_type = _render_parameter_object(parameters, "path")
            request_body_type = _render_request_body_type(operation)
            response_body_type = _render_success_response_type(operation)
            success_status, _ = _get_success_response(operation)
            error_responses = _collect_error_responses(operation)
            query_defaults = _collect_query_defaults(parameters)
            query_keys = [
                parameter["name"]
                for parameter in parameters
                if parameter.get("in") == "query"
            ]
            response_content_types = _collect_success_response_content_types(operation)
            response_header_keys = _collect_success_response_header_keys(operation)
            error_response_schemas = _collect_error_response_schemas(error_responses)

            lines.append(f"  {operation_id}: {{")
            lines.append(f"    method: {_quote(method_name)};")
            lines.append(f"    path: {_quote(path_name)};")
            lines.append(f"    query: {query_type};")
            lines.append(f"    queryDefaults: {_render_default_object(query_defaults)};")
            lines.append(f"    pathParams: {path_type};")
            lines.append(f"    requestBody: {request_body_type};")
            lines.append(f"    responseBody: {response_body_type};")
            lines.append(f"    errorResponses: {_render_error_response_types(error_responses)};")
            lines.append(f"    successStatus: {success_status or 'never'};")
            lines.append(f"    responseContentTypes: Array<string>;")
            lines.append(f"    responseHeaderKeys: Array<string>;")
            lines.append("    errorResponseSchemas: Record<string, string>;")
            lines.append("  };")

            runtime_lines.append(f"  {operation_id}: {{")
            runtime_lines.append(f"    method: {_quote(method_name)},")
            runtime_lines.append(f"    path: {_quote(path_name)},")
            runtime_lines.append(f"    queryKeys: {_quote(query_keys)},")
            runtime_lines.append(f"    queryDefaults: {_quote(query_defaults)},")
            runtime_lines.append(f"    successStatus: {success_status if success_status is not None else 'null'},")
            runtime_lines.append(f"    responseContentTypes: {_quote(response_content_types)},")
            runtime_lines.append(f"    responseHeaderKeys: {_quote(response_header_keys)},")
            runtime_lines.append(f"    errorResponseSchemas: {_quote(error_response_schemas)},")
            runtime_lines.append("  },")

    lines.append("};")
    lines.append("")
    lines.append("export type BackendApiOperationId = keyof BackendApiOperationMap;")
    lines.append("")
    runtime_lines.append("} as const;")
    runtime_lines.append("")

    return lines + runtime_lines


def _render_typescript_contract(openapi_schema: dict[str, Any]) -> str:
    component_schemas = openapi_schema.get("components", {}).get("schemas", {})

    lines = [
        "// Auto-generated from backend FastAPI OpenAPI components.",
        "// Run `cd backend && uv run python scripts/sync_api_contracts.py` to regenerate.",
        "",
    ]

    for schema_name in sorted(component_schemas):
        lines.append(f"export type {schema_name} = {_schema_to_ts(component_schemas[schema_name])};")
        lines.append("")

    lines.extend(_render_operation_contracts(openapi_schema))

    return "\n".join(lines).rstrip() + "\n"


def _render_openapi_snapshot(openapi_schema: dict[str, Any]) -> str:
    return json.dumps(openapi_schema, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _sync_file(path: Path, content: str, *, check: bool) -> bool:
    if check:
        if not path.exists():
            return False
        return path.read_text(encoding="utf-8") == content

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync the backend OpenAPI contract into checked-in project artifacts.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Verify that generated contract artifacts are up to date without rewriting them.",
    )
    args = parser.parse_args()

    openapi_schema = app.openapi()
    artifacts = {
        OPENAPI_OUTPUT_PATH: _render_openapi_snapshot(openapi_schema),
        TS_OUTPUT_PATH: _render_typescript_contract(openapi_schema),
    }

    mismatches: list[Path] = []
    for path, content in artifacts.items():
        if not _sync_file(path, content, check=args.check):
            mismatches.append(path)

    if args.check and mismatches:
        print("API contract artifacts are out of date. Regenerate them with:", file=sys.stderr)
        print("  cd backend && uv run python scripts/sync_api_contracts.py", file=sys.stderr)
        for path in mismatches:
            print(f"  - {path}", file=sys.stderr)
        return 1

    if not args.check:
        for path in artifacts:
            print(f"updated {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
