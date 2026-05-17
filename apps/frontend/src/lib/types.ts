export type Severity = "low" | "medium" | "high";

export type Clause = {
  id: string;
  index: number;
  text: string;
  header?: string;
  tags?: string[];
};

export type FindingBase = {
  id: string;
  severity: Severity;
  reason: string;
  resolved?: boolean;
  createdAt: number;
};

export type DuplicateFinding = FindingBase & {
  type: "duplicate";
  items: number[];
  similarity: number;
};

export type ConflictFinding = FindingBase & {
  type: "conflict";
  a: number;
  b: number;
  signal: "negation" | "numbers" | "modal" | "policy" | "other";
  meta?: Record<string, unknown>;
};

export type Finding = DuplicateFinding | ConflictFinding;
