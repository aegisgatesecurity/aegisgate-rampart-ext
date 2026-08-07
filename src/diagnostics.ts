import * as vscode from "vscode";
import { DetectionResult } from "./client";

const SEVERITY_MAP: Record<string, vscode.DiagnosticSeverity> = {
  critical: vscode.DiagnosticSeverity.Error,
  high: vscode.DiagnosticSeverity.Error,
  medium: vscode.DiagnosticSeverity.Warning,
  low: vscode.DiagnosticSeverity.Information,
};

const CATEGORY_ICONS: Record<string, string> = {
  "pii-us-core": "🔐",
  "pii-us-extended": "🔐",
  "pii-financial": "💳",
  "pii-international": "🌍",
  secrets: "🔑",
  xss: "⚔️",
  compliance: "📋",
  ml_threat: "🧠",
};

export class DiagnosticManager {
  private collection: vscode.DiagnosticCollection;

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection("aegisgate-rampart");
  }

  setDiagnostics(
    uri: vscode.Uri,
    results: DetectionResult[],
    doc: vscode.TextDocument,
  ): void {
    const diagnostics: vscode.Diagnostic[] = [];

    for (const r of results) {
      const range = this.findRange(doc, r);
      const severity = SEVERITY_MAP[r.severity] ?? vscode.DiagnosticSeverity.Warning;
      const icon = CATEGORY_ICONS[r.category] ?? "🛡️";

      const message = `${icon} ${r.category}: ${r.text || r.rule}`;
      const diag = new vscode.Diagnostic(range, message, severity);

      diag.source = "Rampart";
      diag.code = r.rule;

      // Tag PII and secrets as unnecessary for quick-fix hints
      if (r.category.startsWith("pii") || r.category === "secrets") {
        diag.tags = [vscode.DiagnosticTag.Unnecessary];
      }

      diagnostics.push(diag);
    }

    this.collection.set(uri, diagnostics);
  }

  clear(uri: vscode.Uri): void {
    this.collection.delete(uri);
  }

  clearAll(): void {
    this.collection.clear();
  }

  dispose(): void {
    this.collection.dispose();
  }

  /**
   * Find the text range for a detection result. Since Rampart returns
   * category/rule info but not character offsets, we search for the
   * matched text in the document. Falls back to a single-line scan.
   */
  private findRange(doc: vscode.TextDocument, result: DetectionResult): vscode.Range {
    const searchText = result.text || result.rule;

    if (searchText) {
      // Try to find the detection text in the document
      const fullText = doc.getText();
      const idx = fullText.indexOf(searchText);
      if (idx >= 0) {
        const start = doc.positionAt(idx);
        const end = doc.positionAt(idx + searchText.length);
        return new vscode.Range(start, end);
      }
    }

    // Fallback: if we can't find the text, highlight the first line
    // (the detection is real, we just don't have exact offsets)
    const firstLine = doc.lineAt(0);
    return firstLine.range;
  }
}