import * as assert from "assert";
import { DetectionSummary, ProxyStats, RampartClient } from "../client";

// We test the client types and URL construction without requiring Rampart to be running.

suite("RampartClient", () => {
  test("getUrl strips trailing slashes", () => {
    const c1 = new RampartClient("http://localhost:8080/");
    assert.strictEqual(c1.getUrl(), "http://localhost:8080");

    const c2 = new RampartClient("http://localhost:8080///");
    assert.strictEqual(c2.getUrl(), "http://localhost:8080");

    const c3 = new RampartClient("http://localhost:8080");
    assert.strictEqual(c3.getUrl(), "http://localhost:8080");
  });

  test("isAlive returns false when proxy is not running", async () => {
    const client = new RampartClient("http://localhost:19999");
    const alive = await client.isAlive();
    assert.strictEqual(alive, false);
  });

  test("detect throws when proxy is not running", async () => {
    const client = new RampartClient("http://localhost:19999");
    await assert.rejects(
      () => client.detect("test"),
    );
  });

  test("getStatus throws when proxy is not running", async () => {
    const client = new RampartClient("http://localhost:19999");
    await assert.rejects(
      () => client.getStatus(),
    );
  });
});

suite("Type contracts", () => {
  test("DetectionSummary has required fields", () => {
    const summary: DetectionSummary = {
      total_detections: 1,
      blocked: false,
      results: [
        {
          category: "pii-us-core",
          severity: "high",
          confidence: 1.0,
          rule: "ssn",
          is_threat: true,
          blocked: false,
          text: "SSN",
        },
      ],
      latency_ms: 5,
    };

    assert.strictEqual(summary.total_detections, 1);
    assert.strictEqual(summary.results.length, 1);
    assert.strictEqual(summary.results[0].category, "pii-us-core");
  });

  test("ProxyStats has required fields", () => {
    const stats: ProxyStats = {
      total_requests: 100,
      intercepted: 50,
      passed_through: 50,
      detections: 10,
      blocked_requests: 2,
      ml_detections: 3,
      start_time: "2026-08-07T00:00:00Z",
    };

    assert.strictEqual(stats.total_requests, 100);
    assert.strictEqual(stats.detections, 10);
  });
});