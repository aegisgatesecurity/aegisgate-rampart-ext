import * as vscode from "vscode";
import { RampartClient } from "./client";
import { Scanner } from "./scanner";
import { DiagnosticManager } from "./diagnostics";
import { StatusBarManager } from "./statusbar";

let client: RampartClient;
let scanner: Scanner;
let diagnostics: DiagnosticManager;
let statusBar: StatusBarManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const cfg = vscode.workspace.getConfiguration("aegisgate-rampart");
  const proxyUrl = cfg.get<string>("proxyUrl", "http://localhost:8080");

  client = new RampartClient(proxyUrl);
  diagnostics = new DiagnosticManager();
  statusBar = new StatusBarManager(context, client);
  scanner = new Scanner(client, diagnostics, cfg);

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("aegisgate-rampart.checkStatus", () => checkStatus()),
    vscode.commands.registerCommand("aegisgate-rampart.scanSelection", () => scanSelection()),
    vscode.commands.registerCommand("aegisgate-rampart.scanDocument", () => scanDocument()),
    vscode.commands.registerCommand("aegisgate-rampart.showStats", () => showStats()),
    vscode.commands.registerCommand("aegisgate-rampart.clearDiagnostics", () => clearDiagnostics()),
  );

  // Auto-scan on text change (debounced)
  const autoScan = cfg.get<boolean>("autoScan", true);
  if (autoScan) {
    scanner.startWatching();
  }

  // Scan on save
  const scanOnSave = cfg.get<boolean>("scanOnSave", true);
  if (scanOnSave) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (scanner.shouldScan(doc)) {
          scanner.scanDocument(doc);
        }
      }),
    );
  }

  // Initial status check
  await statusBar.refresh();

  vscode.window.showInformationMessage("AegisGate Rampart extension activated");
}

export function deactivate(): void {
  scanner?.dispose();
  statusBar?.dispose();
}

async function checkStatus(): Promise<void> {
  try {
    const status = await client.getStatus();
    const msg = `Rampart running — ${status.total_requests} requests, ${status.detections} detections`;
    vscode.window.showInformationMessage(msg);
  } catch {
    vscode.window.showWarningMessage("Rampart proxy not reachable at " + client.getUrl());
  }
}

async function scanSelection(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }
  const selection = editor.selection;
  const text = editor.document.getText(selection);
  if (!text) {
    vscode.window.showWarningMessage("No text selected");
    return;
  }
  await scanner.scanText(text, editor.document, selection.start);
}

async function scanDocument(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active editor");
    return;
  }
  scanner.scanDocument(editor.document);
}

async function showStats(): Promise<void> {
  try {
    const status = await client.getStatus();
    const lines = [
      `Total Requests: ${status.total_requests}`,
      `Intercepted: ${status.intercepted}`,
      `Passed Through: ${status.passed_through}`,
      `Detections: ${status.detections}`,
      `Blocked: ${status.blocked_requests}`,
      `ML Detections: ${status.ml_detections}`,
      `Running Since: ${status.start_time}`,
    ];
    vscode.window.showInformationMessage(lines.join("\n"), { modal: true });
  } catch {
    vscode.window.showWarningMessage("Rampart proxy not reachable");
  }
}

function clearDiagnostics(): void {
  diagnostics.clearAll();
  vscode.window.showInformationMessage("Rampart diagnostics cleared");
}