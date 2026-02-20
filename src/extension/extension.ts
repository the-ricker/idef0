import * as vscode from "vscode";
import { PreviewPanel } from "./previewPanel";
import { Idef0EditorProvider } from "./customEditor";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("idef0.openPreview", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "idef0") {
        PreviewPanel.createOrShow(
          context.extensionUri,
          editor.document,
          vscode.ViewColumn.Active
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("idef0.openPreviewToSide", () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === "idef0") {
        PreviewPanel.createOrShow(
          context.extensionUri,
          editor.document,
          vscode.ViewColumn.Beside
        );
      }
    })
  );

  context.subscriptions.push(Idef0EditorProvider.register(context));
}

export function deactivate(): void {}
