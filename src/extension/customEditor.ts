import * as vscode from "vscode";
import { Statement } from "../idef0/model/statement";
import { Process } from "../idef0/model/process";

type ViewMode = "schematic" | "decompose" | "focus" | "toc";

export class Idef0EditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = "idef0.editor";

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      Idef0EditorProvider.viewType,
      new Idef0EditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
      }
    );
  }

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };

    let viewMode: ViewMode = "schematic";
    let focusTarget: string | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const updateWebview = () => {
      const text = document.getText();
      let svg: string;
      let error: string | null = null;

      try {
        svg = render(text, viewMode, focusTarget);
      } catch (e: any) {
        svg = "";
        error = e.message;
      }

      webviewPanel.webview.html = getEditorHtml(text, svg, error, viewMode);
    };

    const debouncedUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateWebview, 300);
    };

    const docChange = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        debouncedUpdate();
      }
    });

    webviewPanel.webview.onDidReceiveMessage((msg) => {
      switch (msg.type) {
        case "edit": {
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          edit.replace(document.uri, fullRange, msg.text);
          vscode.workspace.applyEdit(edit);
          break;
        }
        case "setViewMode":
          viewMode = msg.mode;
          focusTarget = msg.target ?? null;
          updateWebview();
          break;
      }
    });

    webviewPanel.onDidDispose(() => {
      docChange.dispose();
      if (debounceTimer) clearTimeout(debounceTimer);
    });

    updateWebview();
  }
}

function render(
  text: string,
  viewMode: ViewMode,
  focusTarget: string | null
): string {
  if (!text.trim()) return "";

  const statements = Statement.parse(text);
  const process = Process.parse(statements);
  const targetName = focusTarget ?? process.name;
  const target = process.find(targetName) ?? process;

  switch (viewMode) {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getEditorHtml(
  text: string,
  svg: string,
  error: string | null,
  viewMode: ViewMode
): string {
  const modes: { id: ViewMode; label: string }[] = [
    { id: "schematic", label: "Schematic" },
    { id: "decompose", label: "Decompose" },
    { id: "focus", label: "Focus" },
    { id: "toc", label: "TOC" },
  ];

  const buttons = modes
    .map(
      (m) =>
        `<button class="${m.id === viewMode ? "active" : ""}" onclick="setMode('${m.id}')">${m.label}</button>`
    )
    .join("");

  const diagramContent = error
    ? `<pre style="color: red;">${escapeHtml(error)}</pre>`
    : svg || '<p style="color: #888;">Enter IDEF0 statements to see a diagram.</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .toolbar {
      background: #f3f3f3;
      padding: 6px 10px;
      border-bottom: 1px solid #ddd;
      display: flex;
      gap: 4px;
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
    .main { flex: 1; display: flex; overflow: hidden; }
    .editor-pane {
      width: 40%;
      min-width: 200px;
      border-right: 1px solid #ddd;
      display: flex;
      flex-direction: column;
    }
    .editor-pane textarea {
      flex: 1;
      border: none;
      padding: 10px;
      font-family: "SF Mono", Monaco, "Cascadia Code", monospace;
      font-size: 13px;
      line-height: 1.5;
      resize: none;
      outline: none;
    }
    .preview-pane {
      flex: 1;
      overflow: auto;
      padding: 20px;
      background: white;
    }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="toolbar">${buttons}</div>
  <div class="main">
    <div class="editor-pane">
      <textarea id="source" spellcheck="false">${escapeHtml(text)}</textarea>
    </div>
    <div class="preview-pane" id="diagram">${diagramContent}</div>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const textarea = document.getElementById('source');
    let debounce;
    textarea.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        vscode.postMessage({ type: 'edit', text: textarea.value });
      }, 300);
    });
    function setMode(mode, target) {
      vscode.postMessage({ type: 'setViewMode', mode, target });
    }
  </script>
</body>
</html>`;
}
