import * as vscode from 'vscode';

/**
 * Provides auto-completion for IDEF0 YAML files
 */
export class CompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.CompletionItem[] | undefined {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const completions: vscode.CompletionItem[] = [];

        // Top-level keys
        if (this.isTopLevel(linePrefix)) {
            completions.push(
                this.createSnippet('metadata', 'Diagram metadata',
                    'metadata:\n  title: "${1:Diagram Title}"\n  author: "${2:Author}"\n  version: "${3:1.0}"'),
                this.createSnippet('activities', 'Activity definitions',
                    'activities:\n  - code: ${1:A1}\n    label: ${2:Activity Name}\n    controls:\n      - label: ${3:Control}\n    outputs:\n      - label: ${4:Output}')
            );
        }

        // Activity properties
        if (this.isInActivityContext(document, position)) {
            completions.push(
                this.createSnippet('activity', 'New activity',
                    '- code: ${1:A1}\n  label: ${2:Activity Name}\n  controls:\n    - label: ${3:Control}\n  outputs:\n    - label: ${4:Output}'),
                this.createCompletion('code', 'Activity code (e.g., A1, A2)', vscode.CompletionItemKind.Property),
                this.createCompletion('label', 'Activity label', vscode.CompletionItemKind.Property),
                this.createCompletion('inputs', 'Input ICOMs', vscode.CompletionItemKind.Property),
                this.createCompletion('controls', 'Control ICOMs', vscode.CompletionItemKind.Property),
                this.createCompletion('outputs', 'Output ICOMs', vscode.CompletionItemKind.Property),
                this.createCompletion('mechanisms', 'Mechanism ICOMs', vscode.CompletionItemKind.Property)
            );
        }

        // ICOM properties
        if (this.isInICOMContext(document, position)) {
            completions.push(
                this.createSnippet('icom', 'New ICOM',
                    '- label: ${1:ICOM Label}${2:\n  code: ${3:code}}'),
                this.createCompletion('label', 'ICOM label', vscode.CompletionItemKind.Property),
                this.createCompletion('code', 'ICOM code for referencing', vscode.CompletionItemKind.Property)
            );
        }

        // ICOM section starters
        if (linePrefix.trim().endsWith('inputs:') || linePrefix.includes('inputs:')) {
            completions.push(
                this.createSnippet('external-input', 'External input',
                    '- label: ${1:Input Label}'),
                this.createSnippet('coded-input', 'Input with code reference',
                    '- label: ${1:Input Label}\n  code: ${2:code}')
            );
        }

        if (linePrefix.trim().endsWith('outputs:') || linePrefix.includes('outputs:')) {
            const outputCodes = this.extractOutputCodes(document);
            completions.push(
                this.createSnippet('external-output', 'External output',
                    '- label: ${1:Output Label}'),
                this.createSnippet('coded-output', 'Output with code',
                    '- label: ${1:Output Label}\n  code: ${2:code}')
            );
        }

        if (linePrefix.trim().endsWith('controls:') || linePrefix.includes('controls:')) {
            completions.push(
                this.createSnippet('control', 'Control',
                    '- label: ${1:Control Label}')
            );
        }

        if (linePrefix.trim().endsWith('mechanisms:') || linePrefix.includes('mechanisms:')) {
            completions.push(
                this.createSnippet('mechanism', 'Mechanism',
                    '- label: ${1:Mechanism Label}')
            );
        }

        // Output code suggestions for input codes
        if (this.isInputCodeField(document, position)) {
            const outputCodes = this.extractOutputCodes(document);
            completions.push(
                ...outputCodes.map(({ code, label }) =>
                    this.createCompletion(code, `Reference to output: ${label}`, vscode.CompletionItemKind.Reference)
                )
            );
        }

        return completions;
    }

    private createCompletion(
        label: string,
        detail: string,
        kind: vscode.CompletionItemKind
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, kind);
        item.detail = detail;
        return item;
    }

    private createSnippet(
        label: string,
        detail: string,
        snippet: string
    ): vscode.CompletionItem {
        const item = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
        item.detail = detail;
        item.insertText = new vscode.SnippetString(snippet);
        return item;
    }

    private isTopLevel(linePrefix: string): boolean {
        return linePrefix.trim() === '' || /^[a-z]*$/.test(linePrefix.trim());
    }

    private isInActivityContext(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text;
            if (line.includes('activities:')) {
                return true;
            }
            if (line.includes('metadata:')) {
                return false;
            }
        }
        return false;
    }

    private isInICOMContext(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text;
            if (line.match(/^\s+(inputs|controls|outputs|mechanisms):/)) {
                return true;
            }
            if (line.match(/^\s+code:/)) {
                return false;
            }
        }
        return false;
    }

    private isInputCodeField(document: vscode.TextDocument, position: vscode.Position): boolean {
        const line = document.lineAt(position).text;
        if (line.includes('code:')) {
            // Check if we're in an inputs section
            for (let i = position.line; i >= 0; i--) {
                const checkLine = document.lineAt(i).text;
                if (checkLine.includes('inputs:')) {
                    return true;
                }
                if (checkLine.match(/^\s+(controls|outputs|mechanisms):/)) {
                    return false;
                }
            }
        }
        return false;
    }

    private extractOutputCodes(document: vscode.TextDocument): Array<{ code: string; label: string }> {
        const codes: Array<{ code: string; label: string }> = [];
        const text = document.getText();
        const lines = text.split('\n');

        let inOutputSection = false;
        let currentLabel = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.match(/^\s+outputs:/)) {
                inOutputSection = true;
                continue;
            }

            if (inOutputSection) {
                if (line.match(/^\s+(inputs|controls|mechanisms):/)) {
                    inOutputSection = false;
                    continue;
                }

                const labelMatch = line.match(/^\s+-?\s*label:\s*(.+)/);
                if (labelMatch) {
                    currentLabel = labelMatch[1].trim().replace(/["']/g, '');
                }

                const codeMatch = line.match(/^\s+code:\s*([A-Za-z0-9_]+)/);
                if (codeMatch && currentLabel) {
                    codes.push({ code: codeMatch[1], label: currentLabel });
                    currentLabel = '';
                }
            }
        }

        return codes;
    }
}
