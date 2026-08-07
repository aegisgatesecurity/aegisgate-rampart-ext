import * as vscode from "vscode";
import { DetectionResult } from "./client";
import { DiagnosticManager } from "./diagnostics";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export class Scanner implements vscode.Disposable {
  private client: { detect: (text: string) => Promise<unknown> };
  private diagnostics: DiagnosticManager;
  private config: vscode.WorkspaceConfiguration;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private disposable: vscode.Disposable;

  constructor(
    client: { detect: (text: string) => Promise<unknown> },
    diagnostics: DiagnosticManager,
    config: vscode.WorkspaceConfiguration,
  ) {
    this.client = client;
    this.diagnostics = diagnostics;
    this.config = config;
    this.disposable = { dispose: () => {} };
  }

  shouldScan(doc: vscode.TextDocument): boolean {
    const languageIds = this.config.get<string[]>("languageIds", []);
    return languageIds.length === 0 || languageIds.includes(doc.languageId);
  }

  startWatching(): void {
    const debounceMs = this.config.get<number>("scanDebounceMs", 500);

    this.disposable = vscode.workspace.onDidChangeTextDocument((e) => {
      if (!this.shouldScan(e.document)) {
        return;
      }
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.scanDocument(e.document);
      }, debounceMs);
    });
  }

  scanDocument(doc: vscode.TextDocument): void {
    const text = doc.getText();
    if (!text.trim()) {
      this.diagnostics.clear(doc.uri);
      return;
    }
    this.scanText(text, doc, new vscode.Position(0, 0));
  }

  async scanText(
    text: string,
    doc: vscode.TextDocument,
    _offset: vscode.Position,
  ): Promise<void> {
    const threshold = this.config.get<string>("severityThreshold", "low");
    const maxDiagnostics = this.config.get<number>("maxDiagnostics", 50);

    try {
      const summary = await this.client.detect(text) as import("./client").DetectionSummary;
      const filtered = this.filterResults(summary.results, threshold, maxDiagnostics);
      this.diagnostics.setDiagnostics(doc.uri, filtered, doc);
    } catch {
      // Silently fail — status bar shows disconnected state
    }
  }

  filterResults(
    results: DetectionResult[],
    threshold: string,
    max: number,
  ): DetectionResult[] {
    const minLevel = SEVERITY_ORDER[threshold] ?? 1;

    return results
      .filter((r) => {
        const level = SEVERITY_ORDER[r.severity] ?? 1;
        return level >= minLevel;
      })
      .sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 1) - (SEVERITY_ORDER[a.severity] ?? 1))
      .slice(0, max);
  }

  dispose(): void {
    this.disposable?.dispose();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}