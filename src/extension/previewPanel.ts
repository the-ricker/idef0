import * as vscode from "vscode";
import { Statement } from "../idef0/model/statement";
import { Process } from "../idef0/model/process";

type ViewMode = "schematic" | "decompose" | "focus" | "toc";

export class PreviewPanel {
  private static panels = new Map<string, PreviewPanel>();
  private panel: vscode.WebviewPanel;
  private document: vscode.TextDocument;
  private viewMode: ViewMode = "schematic";
  private focusTarget: string | null = null;
  private disposables: vscode.Disposable[] = [];

  static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    column?: vscode.ViewColumn
  ): PreviewPanel {
    const key = document.uri.toString();
    const existing = PreviewPanel.panels.get(key);
    if (existing) {
      existing.panel.reveal(column);
      return existing;
    }
    const p = new PreviewPanel(extensionUri, document, column);
    PreviewPanel.panels.set(key, p);
    return p;
  }

  private constructor(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
    column?: vscode.ViewColumn
  ) {
    this.document = document;
    this.panel = vscode.window.createWebviewPanel(
      "idef0.preview",
      `IDEF0 Preview: ${this.shortName}`,
      column ?? vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      }
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );

    const changeDoc = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === this.document.uri.toString()) {
        this.update();
      }
    });
    this.disposables.push(changeDoc);

    this.update();
  }

  private get shortName(): string {
    const parts = this.document.uri.path.split("/");
    return parts[parts.length - 1];
  }

  private handleMessage(msg: { type: string; mode?: ViewMode; target?: string }): void {
    switch (msg.type) {
      case "setViewMode":
        if (msg.mode) {
          this.viewMode = msg.mode;
          this.focusTarget = msg.target ?? null;
          this.update();
        }
        break;
    }
  }

  private update(): void {
    try {
      const text = this.document.getText();
      const content = this.render(text);
      this.panel.webview.html = this.getHtml(content);
    } catch (e: any) {
      this.panel.webview.html = this.getHtml(
        `<pre style="color: red;">${escapeHtml(e.message)}</pre>`
      );
    }
  }

  private render(text: string): string {
    if (!text.trim()) {
      return '<p style="color: #888;">Enter IDEF0 statements to see a diagram.</p>';
    }

    const statements = Statement.parse(text);
    const process = Process.parse(statements);

    const targetName = this.focusTarget ?? process.name;
    const target = process.find(targetName) ?? process;

    switch (this.viewMode) {
      case "schematic":
        return target.schematic().toSvg();
      case "decompose":
        return target.decompose().toSvg();
      case "focus":
        return target.focus().toSvg();
      case "toc":
        return `<pre>${escapeHtml(target.toc())}</pre>`;
    }
  }

  private getHtml(content: string): string {
    const modes: { id: ViewMode; label: string }[] = [
      { id: "schematic", label: "Schematic" },
      { id: "decompose", label: "Decompose" },
      { id: "focus", label: "Focus" },
      { id: "toc", label: "TOC" },
    ];

    const buttons = modes
      .map(
        (m) =>
          `<button class="${m.id === this.viewMode ? "active" : ""}" onclick="setMode('${m.id}')">${m.label}</button>`
      )
      .join("");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .toolbar {
      position: sticky;
      top: 0;
      background: #f3f3f3;
      padding: 6px 10px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
      z-index: 10;
    }
    .toolbar button {
      padding: 4px 12px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }
    .toolbar button.active {
      background: #007acc;
      color: white;
      border-color: #007acc;
    }
    .toolbar button:hover:not(.active) {
      background: #e8e8e8;
    }
    #diagram {
      padding: 20px;
      overflow: auto;
    }
    svg {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="toolbar">${buttons}</div>
  <div id="diagram">${content}</div>
  <script>
    const vscode = acquireVsCodeApi();
    function setMode(mode, target) {
      vscode.postMessage({ type: 'setViewMode', mode, target });
    }
  </script>
</body>
</html>`;
  }

  private dispose(): void {
    PreviewPanel.panels.delete(this.document.uri.toString());
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
