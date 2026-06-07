from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.core import warm_runtime_assets


def main() -> int:
    response = warm_runtime_assets()
    payload = response.model_dump()
    print(json.dumps(payload, ensure_ascii=False, indent=2))

    all_ready = all(asset["cacheReady"] or asset["datasetStatus"] == "missing" for asset in payload["assets"])
    return 0 if all_ready else 1


if __name__ == "__main__":
    raise SystemExit(main())
