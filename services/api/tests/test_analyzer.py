from app.services.analyzer import compute_findings, segment_clauses


def test_segment_clauses_splits_numbered_points():
    clauses = segment_clauses("1. Первый пункт.\n2. Второй пункт.")
    assert len(clauses) == 2
    assert clauses[0]["index"] == 1


def test_compute_findings_detects_conflict():
    clauses = segment_clauses("1. Исполнитель вправе публиковать результат.\n2. Исполнителю запрещено публиковать результат.")
    findings = compute_findings(clauses, 0.8)
    assert any(item["type"] == "conflict" for item in findings)
