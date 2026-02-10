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
                    'activities:\n  - id: "${1:A1}"\n    label: "${2:Activity Name}"'),
                this.createSnippet('arrows', 'Arrow definitions',
                    'arrows:\n  - type: ${1|input,control,output,mechanism|}\n    from: ${2:external}\n    to: ${3:A1}\n    label: "${4:Arrow Label}"')
            );
        }

        // Activity properties
        if (linePrefix.includes('activities:') || linePrefix.trim().startsWith('-')) {
            completions.push(
                this.createSnippet('activity', 'New activity',
                    '- id: "${1:A1}"\n  label: "${2:Activity Name}"')
            );
        }

        // Arrow properties
        if (linePrefix.includes('arrows:') || this.isInArrowContext(document, position)) {
            completions.push(
                this.createSnippet('arrow', 'New arrow',
                    '- type: ${1|input,control,output,mechanism|}\n  from: ${2:external}\n  to: ${3:A1}\n  label: "${4:Arrow Label}"'),
                this.createCompletion('type', 'Arrow type', vscode.CompletionItemKind.Property),
                this.createCompletion('from', 'Arrow source', vscode.CompletionItemKind.Property),
                this.createCompletion('to', 'Arrow target', vscode.CompletionItemKind.Property),
                this.createCompletion('label', 'Arrow label', vscode.CompletionItemKind.Property)
            );
        }

        // Arrow type values
        if (linePrefix.includes('type:')) {
            completions.push(
                this.createCompletion('input', 'Input arrow (left side)', vscode.CompletionItemKind.Value),
                this.createCompletion('control', 'Control arrow (top side)', vscode.CompletionItemKind.Value),
                this.createCompletion('output', 'Output arrow (right side)', vscode.CompletionItemKind.Value),
                this.createCompletion('mechanism', 'Mechanism arrow (bottom side)', vscode.CompletionItemKind.Value)
            );
        }

        // Activity ID suggestions for from/to fields
        if (linePrefix.includes('from:') || linePrefix.includes('to:')) {
            const activityIds = this.extractActivityIds(document);
            completions.push(
                this.createCompletion('external', 'External entity', vscode.CompletionItemKind.Value),
                ...activityIds.map(id =>
                    this.createCompletion(id, `Activity ${id}`, vscode.CompletionItemKind.Reference)
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

    private isInArrowContext(document: vscode.TextDocument, position: vscode.Position): boolean {
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text;
            if (line.includes('arrows:')) {
                return true;
            }
            if (line.includes('activities:') || line.includes('metadata:')) {
                return false;
            }
        }
        return false;
    }

    private extractActivityIds(document: vscode.TextDocument): string[] {
        const ids: string[] = [];
        const text = document.getText();
        const regex = /^\s*-?\s*id:\s*["']?([A-Za-z0-9_]+)["']?/gm;
        let match;

        while ((match = regex.exec(text)) !== null) {
            ids.push(match[1]);
        }

        return ids;
    }
}
