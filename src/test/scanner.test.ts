import * as assert from "assert";
import { DetectionResult } from "../client";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function filterResults(
  results: DetectionResult[],
  threshold: string,
  max: number,
): DetectionResult[] {
  const minLevel = SEVERITY_ORDER[threshold] ?? 1;
  return results
    .filter((r) => (SEVERITY_ORDER[r.severity] ?? 1) >= minLevel)
    .sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 1) - (SEVERITY_ORDER[a.severity] ?? 1))
    .slice(0, max);
}

suite("Scanner filter logic", () => {
  test("filterResults respects severity threshold", () => {
    const results: DetectionResult[] = [
      { category: "secrets", severity: "high", confidence: 1.0, rule: "aws_key", is_threat: true, blocked: false, text: "AWS key" },
      { category: "pii-us-core", severity: "low", confidence: 0.8, rule: "email", is_threat: true, blocked: false, text: "email" },
      { category: "xss", severity: "medium", confidence: 0.9, rule: "script_tag", is_threat: true, blocked: false, text: "<script>" },
    ];

    const filtered = filterResults(results, "high", 50);
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].severity, "high");
  });

  test("filterResults respects maxDiagnostics limit", () => {
    const results: DetectionResult[] = Array.from({ length: 100 }, (_, i) => ({
      category: "secrets",
      severity: "high" as const,
      confidence: 1.0,
      rule: `rule_${i}`,
      is_threat: true,
      blocked: false,
      text: `detection_${i}`,
    }));

    const filtered = filterResults(results, "low", 10);
    assert.strictEqual(filtered.length, 10);
  });

  test("filterResults sorts by severity descending", () => {
    const results: DetectionResult[] = [
      { category: "xss", severity: "low", confidence: 0.9, rule: "script", is_threat: true, blocked: false, text: "<script>" },
      { category: "secrets", severity: "critical", confidence: 1.0, rule: "aws_key", is_threat: true, blocked: false, text: "AKIA..." },
      { category: "pii", severity: "medium", confidence: 0.8, rule: "email", is_threat: true, blocked: false, text: "test@" },
    ];

    const filtered = filterResults(results, "low", 50);
    assert.strictEqual(filtered[0].severity, "critical");
    assert.strictEqual(filtered[1].severity, "medium");
    assert.strictEqual(filtered[2].severity, "low");
  });

  test("filterResults includes all when threshold is low", () => {
    const results: DetectionResult[] = [
      { category: "secrets", severity: "low", confidence: 0.5, rule: "r1", is_threat: true, blocked: false, text: "t1" },
      { category: "pii", severity: "high", confidence: 1.0, rule: "r2", is_threat: true, blocked: false, text: "t2" },
    ];

    const filtered = filterResults(results, "low", 50);
    assert.strictEqual(filtered.length, 2);
  });

  test("filterResults filters out all when threshold is critical and nothing is critical", () => {
    const results: DetectionResult[] = [
      { category: "pii", severity: "low", confidence: 0.5, rule: "r1", is_threat: true, blocked: false, text: "t1" },
    ];

    const filtered = filterResults(results, "critical", 50);
    assert.strictEqual(filtered.length, 0);
  });
});