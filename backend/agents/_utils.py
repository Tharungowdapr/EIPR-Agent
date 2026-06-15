import json
from html import escape

MAX_CONTEXT_CHARS = 2000


def summarize_context(data: dict, max_chars: int = MAX_CONTEXT_CHARS) -> str:
    parts = []
    for k, v in data.items():
        if v is None:
            continue
        label = k.replace("_", " ").title()
        if isinstance(v, str) and len(v) > 5:
            parts.append(f"{label}: {v[:300]}")
        elif isinstance(v, (int, float)):
            parts.append(f"{label}: {v}")
        elif isinstance(v, list):
            items = [str(x)[:100] for x in v[:5]]
            if items:
                parts.append(f"{label}: {'; '.join(items)}")
        elif isinstance(v, dict):
            nested = summarize_context(v, max_chars=500)
            if nested:
                parts.append(f"{label}: {nested}")
    result = " | ".join(parts)
    return result[:max_chars]
