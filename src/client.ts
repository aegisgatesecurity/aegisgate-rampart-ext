/**
 * Rampart API client — talks to localhost only, zero external comms.
 *
 * Endpoints:
 *   POST /detect  {"text": "..."} → DetectionSummary
 *   GET  /stats                    → ProxyStats
 */

export interface DetectionResult {
  category: string;
  severity: string;
  confidence: number;
  text?: string;
  rule: string;
  is_threat: boolean;
  blocked: boolean;
  block_reason?: string;
  ml_score?: number;
}

export interface DetectionSummary {
  total_detections: number;
  blocked: boolean;
  block_reason?: string;
  results: DetectionResult[];
  pii_categories?: string[];
  secret_types?: string[];
  compliance?: Record<string, boolean>;
  ml_score?: number;
  latency_ms: number;
}

export interface ProxyStats {
  total_requests: number;
  intercepted: number;
  passed_through: number;
  detections: number;
  blocked_requests: number;
  ml_detections: number;
  start_time: string;
}

export class RampartClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  getUrl(): string {
    return this.baseUrl;
  }

  async detect(text: string): Promise<DetectionSummary> {
    const response = await fetch(`${this.baseUrl}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Rampart /detect returned ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as DetectionSummary;
  }

  async getStatus(): Promise<ProxyStats> {
    const response = await fetch(`${this.baseUrl}/stats`);

    if (!response.ok) {
      throw new Error(`Rampart /stats returned ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as ProxyStats;
  }

  async isAlive(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}