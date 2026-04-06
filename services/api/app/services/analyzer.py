from __future__ import annotations

import random
import re
import time
from typing import Any

RU_STOPWORDS = {
    "и", "в", "во", "не", "на", "я", "с", "со", "как", "а", "то", "к", "ко",
    "до", "за", "из", "у", "над", "под", "о", "от", "для", "по", "этот",
    "это", "так", "также", "ли", "же", "при", "или", "если", "что", "чтобы",
    "бы", "будет", "должен", "должна",
}

POSITIVE_WORDS = [
    "разрешено", "допускается", "может", "вправе", "праве", "разрешается", "должен", "обязан",
]
NEGATIVE_WORDS = [
    "запрещено", "не допускается", "не вправе", "не должен", "не обязан", "запрещается", "не может", "нельзя",
]
NUMBER_RE = re.compile(r"(\d+[\,\.]?\d*)\s*(дн[еяй]?|час(?:ов|а)?|минут(?:а|ы)?|%)?", re.IGNORECASE)


def uid(prefix: str = "id") -> str:
    return f"{prefix}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"


def normalize(text: str) -> str:
    without_punctuation = re.sub(r"[.,;:!?()\"'«»]", " ", text.lower())
    return re.sub(r"\s+", " ", without_punctuation).strip()


def tokenize(text: str) -> list[str]:
    return [token for token in normalize(text).split(" ") if token and token not in RU_STOPWORDS and len(token) > 2]


def jaccard(a: list[str], b: list[str]) -> float:
    sa, sb = set(a), set(b)
    inter = len(sa & sb)
    union = len(sa | sb)
    return 0.0 if union == 0 else inter / union


def extract_numbers(text: str) -> list[dict[str, Any]]:
    numbers: list[dict[str, Any]] = []
    for value, unit in NUMBER_RE.findall(text):
        numbers.append({"value": float(str(value).replace(",", ".")), "unit": unit.lower() if unit else None})
    return numbers


def has_any(text: str, words: list[str]) -> bool:
    source = normalize(text)
    return any(word in source for word in words)


def extract_keywords(text: str) -> list[str]:
    freq: dict[str, int] = {}
    for token in tokenize(text):
        freq[token] = freq.get(token, 0) + 1
    return [token for token, _ in sorted(freq.items(), key=lambda item: item[1], reverse=True)[:8]]


def likely_same_topic(a: str, b: str) -> bool:
    inter = len(set(extract_keywords(a)) & set(extract_keywords(b)))
    return inter >= 2


def sev_rank(severity: str) -> int:
    return {"high": 3, "medium": 2, "low": 1}.get(severity, 0)


def dedupe_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for finding in findings:
        if finding["type"] == "duplicate":
            key = f"duplicate:{'-'.join(map(str, sorted(finding['items'])))}"
        else:
            key = f"conflict:{'-'.join(map(str, sorted([finding['a'], finding['b']]))) }:{finding['signal']}"
        if key not in seen:
            seen.add(key)
            result.append(finding)
    return sorted(result, key=lambda item: (-sev_rank(item["severity"]), item.get("createdAt", 0)))


def segment_clauses(raw: str) -> list[dict[str, Any]]:
    lines = raw.splitlines()
    result: list[dict[str, Any]] = []
    buf: list[str] = []
    header: str | None = None
    header_re = re.compile(r"^(\s*(?:Раздел|Статья|Пункт)\s*\d+\.?|\s*\d+[\.|\)]\s*)", re.IGNORECASE)

    def flush() -> None:
        nonlocal buf, header
        text = "\n".join(buf).strip()
        if not text:
            return
        result.append(
            {
                "id": uid("clause"),
                "index": len(result) + 1,
                "text": text,
                "header": header,
                "tags": [],
            }
        )
        buf = []
        header = None

    for line in lines:
        if header_re.search(line):
            flush()
            header = line.strip()
            buf.append(line.strip())
        else:
            buf.append(line)
    flush()

    if len(result) <= 1:
        parts = [part.strip() for part in re.split(r"\n\s*\n", raw) if part.strip()]
        if len(parts) > 1:
            return [
                {"id": uid("clause"), "index": i + 1, "text": part, "header": None, "tags": []}
                for i, part in enumerate(parts)
            ]

        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+(?=[А-ЯA-Z])", raw) if sentence.strip()]
        if len(sentences) > 1:
            return [
                {"id": uid("clause"), "index": i + 1, "text": sentence, "header": None, "tags": []}
                for i, sentence in enumerate(sentences)
            ]

    return result


def compute_findings(clauses: list[dict[str, Any]], dup_threshold: float = 0.85) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    tokens_cache: dict[int, list[str]] = {}

    def tokens(idx: int) -> list[str]:
        if idx not in tokens_cache:
            tokens_cache[idx] = tokenize(clauses[idx]["text"])
        return tokens_cache[idx]

    for i in range(len(clauses)):
        for j in range(i + 1, len(clauses)):
            left = clauses[i]["text"]
            right = clauses[j]["text"]

            similarity = jaccard(tokens(i), tokens(j))
            if similarity >= dup_threshold:
                findings.append(
                    {
                        "id": uid("dup"),
                        "type": "duplicate",
                        "items": [clauses[i]["index"], clauses[j]["index"]],
                        "similarity": similarity,
                        "severity": "high" if similarity > 0.92 else "medium",
                        "reason": f"Пункты {clauses[i]['index']} и {clauses[j]['index']} дублируют друг друга (похожесть {round(similarity * 100)}%).",
                        "resolved": False,
                        "createdAt": int(time.time() * 1000),
                    }
                )
                continue

            if not likely_same_topic(left, right):
                continue

            pos_left = has_any(left, POSITIVE_WORDS)
            pos_right = has_any(right, POSITIVE_WORDS)
            neg_left = has_any(left, NEGATIVE_WORDS)
            neg_right = has_any(right, NEGATIVE_WORDS)

            if (pos_left and neg_right) or (pos_right and neg_left):
                findings.append(
                    {
                        "id": uid("conf"),
                        "type": "conflict",
                        "a": clauses[i]["index"],
                        "b": clauses[j]["index"],
                        "signal": "negation",
                        "severity": "high",
                        "reason": f"Противоречие разрешено/запрещено между пунктами {clauses[i]['index']} и {clauses[j]['index']}.",
                        "resolved": False,
                        "createdAt": int(time.time() * 1000),
                    }
                )
                continue

            modal_pos_left = bool(re.search(r"\b(должен|обязан|может|вправе)\b", left, re.IGNORECASE))
            modal_pos_right = bool(re.search(r"\b(должен|обязан|может|вправе)\b", right, re.IGNORECASE))
            modal_neg_left = bool(re.search(r"\bне\s+(должен|обязан|может|вправе)\b", left, re.IGNORECASE))
            modal_neg_right = bool(re.search(r"\bне\s+(должен|обязан|может|вправе)\b", right, re.IGNORECASE))

            if (modal_pos_left and modal_neg_right) or (modal_pos_right and modal_neg_left):
                findings.append(
                    {
                        "id": uid("conf"),
                        "type": "conflict",
                        "a": clauses[i]["index"],
                        "b": clauses[j]["index"],
                        "signal": "modal",
                        "severity": "high",
                        "reason": f"Противоречие по обязанностям/правам между пунктами {clauses[i]['index']} и {clauses[j]['index']}.",
                        "resolved": False,
                        "createdAt": int(time.time() * 1000),
                    }
                )
                continue

            left_numbers = extract_numbers(left)
            right_numbers = extract_numbers(right)
            if left_numbers and right_numbers:
                pairs: list[dict[str, Any]] = []
                for left_num in left_numbers:
                    for right_num in right_numbers:
                        if not left_num["unit"] or not right_num["unit"] or left_num["unit"] == right_num["unit"]:
                            pairs.append(
                                {
                                    "a": left_num["value"],
                                    "b": right_num["value"],
                                    "unit": left_num["unit"] or right_num["unit"],
                                }
                            )
                if pairs:
                    max_diff = max(
                        abs(pair["a"] - pair["b"]) / max(1, min(pair["a"], pair["b"])) for pair in pairs
                    )
                    if max_diff >= 0.5:
                        findings.append(
                            {
                                "id": uid("conf"),
                                "type": "conflict",
                                "a": clauses[i]["index"],
                                "b": clauses[j]["index"],
                                "signal": "numbers",
                                "severity": "medium",
                                "reason": f"Различие числовых значений между пунктами {clauses[i]['index']} и {clauses[j]['index']} (например, сроки/проценты).",
                                "resolved": False,
                                "createdAt": int(time.time() * 1000),
                                "meta": {"pairs": pairs},
                            }
                        )

    return dedupe_findings(findings)
