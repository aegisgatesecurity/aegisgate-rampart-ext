import * as vscode from "vscode";
import { RampartClient } from "./client";

export class StatusBarManager implements vscode.Disposable {
  private statusItem: vscode.StatusBarItem;
  private client: RampartClient;
  private refreshInterval: ReturnType<typeof setInterval> | undefined;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext, client: RampartClient) {
    this.client = client;

    this.statusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.statusItem.command = "aegisgate-rampart.checkStatus";
    this.disposables.push(this.statusItem);

    // Refresh connection status every 30 seconds
    this.refreshInterval = setInterval(() => this.refresh(), 30_000);
    context.subscriptions.push(this);

    // Also refresh on configuration change
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("aegisgate-rampart.proxyUrl")) {
          const cfg = vscode.workspace.getConfiguration("aegisgate-rampart");
          this.client = new RampartClient(cfg.get("proxyUrl", "http://localhost:8080"));
          this.refresh();
        }
      }),
    );

    this.statusItem.show();
  }

  async refresh(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("aegisgate-rampart");
    const showStatusBar = cfg.get<boolean>("showStatusBar", true);

    if (!showStatusBar) {
      this.statusItem.hide();
      return;
    }

    this.statusItem.show();

    const alive = await this.client.isAlive();
    if (alive) {
      try {
        const stats = await this.client.getStatus();
        this.statusItem.text = `$(shield) ${stats.detections}`;
        this.statusItem.tooltip = `AegisGate Rampart\nDetections: ${stats.detections}\nBlocked: ${stats.blocked_requests}\nRequests: ${stats.total_requests}`;
        this.statusItem.backgroundColor = undefined;
      } catch {
        this.setDisconnected();
      }
    } else {
      this.setDisconnected();
    }
  }

  private setDisconnected(): void {
    this.statusItem.text = "$(shield) —";
    this.statusItem.tooltip = `AegisGate Rampart — Not connected\nProxy not reachable at ${this.client.getUrl()}`;
    this.statusItem.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground",
    );
  }

  dispose(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}