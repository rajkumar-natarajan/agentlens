from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Mapping, Sequence


class AgentLensClient:
    """Small synchronous client for the AgentLens trace ingestion API."""

    def __init__(
        self,
        api_key: str,
        endpoint: str = "http://localhost:3000",
        timeout: float = 5.0,
    ) -> None:
        if not api_key:
            raise ValueError("AgentLens api_key is required.")
        self._api_key = api_key
        self._endpoint = endpoint.rstrip("/") + "/api/v1/traces"
        self._timeout = timeout

    def send_trace(self, trace: Mapping[str, Any]) -> None:
        self.send_batch([trace])

    def send_batch(self, traces: Sequence[Mapping[str, Any]]) -> None:
        if not traces:
            raise ValueError("At least one trace is required.")
        body = json.dumps(traces, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            self._endpoint,
            data=body,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(f"AgentLens ingestion failed ({response.status}).")
        except urllib.error.HTTPError as error:
            detail = error.read(2048).decode("utf-8", errors="replace")
            raise RuntimeError(
                f"AgentLens ingestion failed ({error.code}): {detail}"
            ) from error
        except urllib.error.URLError as error:
            raise RuntimeError(f"AgentLens ingestion request failed: {error.reason}") from error
