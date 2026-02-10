import * as vscode from 'vscode';
import { PreviewProvider } from './previewProvider';
import { CompletionProvider } from './languageService/completionProvider';

/**
 * Extension activation entry point
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('IDEF0 extension is now active');

    // Register language features
    const completionProvider = new CompletionProvider();
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { language: 'idef0' },
            completionProvider,
            ':', '-', ' '
        )
    );

    // Register preview provider
    const previewProvider = new PreviewProvider(context);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('idef0.openPreview', () => {
            previewProvider.openPreview(vscode.ViewColumn.Active);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('idef0.openPreviewToSide', () => {
            previewProvider.openPreview(vscode.ViewColumn.Beside);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('idef0.exportSVG', () => {
            previewProvider.exportSVG();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('idef0.exportPNG', () => {
            previewProvider.exportPNG();
        })
    );

    // Watch for document changes to update preview
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId === 'idef0') {
                previewProvider.updatePreview(event.document);
            }
        })
    );

    // Watch for active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.languageId === 'idef0') {
                previewProvider.setActiveDocument(editor.document);
            }
        })
    );
}

/**
 * Extension deactivation
 */
export function deactivate() {
    console.log('IDEF0 extension is now deactivated');
}
