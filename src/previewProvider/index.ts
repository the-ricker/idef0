import * as vscode from 'vscode';
import * as path from 'path';
import { Parser } from '../parser';
import { Validator } from '../validator';
import { LayoutEngine } from '../layout';
import { Renderer } from '../renderer';

/**
 * Provides preview webview for IDEF0 diagrams
 */
export class PreviewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private currentDocument: vscode.TextDocument | undefined;
    private updateTimeout: NodeJS.Timeout | undefined;
    private parser = new Parser();
    private validator = new Validator();
    private layoutEngine = new LayoutEngine();
    private renderer = new Renderer();

    constructor(private context: vscode.ExtensionContext) {}

    /**
     * Open preview in specified column
     */
    openPreview(column: vscode.ViewColumn) {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'idef0') {
            vscode.window.showErrorMessage('Open an IDEF0 (.idef) file to preview');
            return;
        }

        this.currentDocument = editor.document;

        if (this.panel) {
            this.panel.reveal(column);
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'idef0Preview',
                `Preview: ${path.basename(editor.document.fileName)}`,
                column,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
                vscode.commands.executeCommand('setContext', 'idef0PreviewVisible', false);
            });
        }

        vscode.commands.executeCommand('setContext', 'idef0PreviewVisible', true);
        this.updatePreview(this.currentDocument);
    }

    /**
     * Set the active document for preview
     */
    setActiveDocument(document: vscode.TextDocument) {
        this.currentDocument = document;
        if (this.panel) {
            this.panel.title = `Preview: ${path.basename(document.fileName)}`;
        }
    }

    /**
     * Update preview with document content
     */
    updatePreview(document: vscode.TextDocument) {
        if (!this.panel || document !== this.currentDocument) {
            return;
        }

        // Debounce updates
        const config = vscode.workspace.getConfiguration('idef0');
        const debounceDelay = config.get<number>('preview.debounceDelay', 300);

        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.renderPreview(document.getText());
        }, debounceDelay);
    }

    /**
     * Render the preview content
     */
    private renderPreview(content: string) {
        if (!this.panel) {
            return;
        }

        try {
            // Parse YAML
            const model = this.parser.parse(content);

            // Validate model
            const validation = this.validator.validate(model);

            // Generate layout
            const layout = this.layoutEngine.layout(model);

            // Render SVG
            const svg = this.renderer.render(layout);

            // Create HTML with SVG and validation errors
            const html = this.getHtmlContent(svg, validation.errors);
            this.panel.webview.html = html;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.panel.webview.html = this.getErrorHtml(errorMessage);
        }
    }

    /**
     * Generate HTML content for webview
     */
    private getHtmlContent(svg: string, errors: any[]): string {
        const errorHtml = errors.length > 0
            ? `
                <div class="errors">
                    <h3>⚠️ Validation Errors</h3>
                    <ul>
                        ${errors.map(e => `<li class="${e.severity}">${e.message}</li>`).join('')}
                    </ul>
                </div>
            `
            : '';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IDEF0 Preview</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        background: #f5f5f5;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    .diagram {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        overflow: auto;
                    }
                    .errors {
                        background: #fff3cd;
                        border: 1px solid #ffc107;
                        border-radius: 4px;
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                    .errors h3 {
                        margin-top: 0;
                        color: #856404;
                    }
                    .errors ul {
                        margin: 0;
                        padding-left: 20px;
                    }
                    .errors li {
                        margin: 5px 0;
                    }
                    .errors li.error {
                        color: #d32f2f;
                    }
                    .errors li.warning {
                        color: #f57c00;
                    }
                    svg {
                        max-width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    ${errorHtml}
                    <div class="diagram">
                        ${svg}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate error HTML
     */
    private getErrorHtml(errorMessage: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IDEF0 Preview Error</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                    .error-container {
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        border-radius: 4px;
                        padding: 20px;
                        color: #721c24;
                    }
                    h2 {
                        margin-top: 0;
                    }
                    pre {
                        background: white;
                        padding: 10px;
                        border-radius: 4px;
                        overflow: auto;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h2>❌ Error</h2>
                    <pre>${this.escapeHtml(errorMessage)}</pre>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Export diagram as SVG
     */
    exportSVG() {
        if (!this.currentDocument) {
            return;
        }

        try {
            const model = this.parser.parse(this.currentDocument.getText());
            const layout = this.layoutEngine.layout(model);
            const svg = this.renderer.render(layout);

            const fileName = path.basename(this.currentDocument.fileName, '.idef') + '.svg';
            const defaultUri = vscode.Uri.file(path.join(path.dirname(this.currentDocument.fileName), fileName));

            vscode.window.showSaveDialog({
                defaultUri,
                filters: { 'SVG': ['svg'] }
            }).then(uri => {
                if (uri) {
                    vscode.workspace.fs.writeFile(uri, Buffer.from(svg, 'utf8'));
                    vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Export failed: ${error}`);
        }
    }

    /**
     * Export diagram as PNG
     */
    exportPNG() {
        vscode.window.showWarningMessage('PNG export not yet implemented. Use SVG export for now.');
        // TODO: Implement PNG export using canvas or similar
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
