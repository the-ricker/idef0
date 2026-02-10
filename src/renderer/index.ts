import { LayoutResult, ArrowType } from '../types';
import { LAYOUT_CONSTANTS as C } from '../layout/constants';

/**
 * Renders IDEF0 diagrams as SVG with proper IDEF0 conventions
 */
export class Renderer {
    /**
     * Render layout result to SVG string
     */
    render(layout: LayoutResult): string {
        const { activities, connections, bounds } = layout;

        const svgParts: string[] = [];

        // SVG header
        svgParts.push(
            `<svg xmlns="http://www.w3.org/2000/svg" `,
            `width="${bounds.width}" height="${bounds.height}" `,
            `viewBox="0 0 ${bounds.width} ${bounds.height}">`
        );

        // Add styles and arrow marker
        svgParts.push(this.renderStyles());
        svgParts.push(this.renderArrowMarkers());

        // Render connections first (so they appear behind activities)
        svgParts.push('<g class="connections">');
        for (const connection of connections) {
            svgParts.push(this.renderConnection(connection));
        }
        svgParts.push('</g>');

        // Render activities
        svgParts.push('<g class="activities">');
        for (const activity of activities) {
            svgParts.push(this.renderActivity(activity));
        }
        svgParts.push('</g>');

        // SVG footer
        svgParts.push('</svg>');

        return svgParts.join('\n');
    }

    /**
     * Render SVG styles
     */
    private renderStyles(): string {
        return `
            <style>
                .activity-box {
                    fill: white;
                    stroke: black;
                    stroke-width: 2;
                }
                .activity-label {
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    text-anchor: middle;
                    dominant-baseline: middle;
                }
                .activity-code {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    fill: #666;
                }
                .connection-line {
                    fill: none;
                    stroke: black;
                    stroke-width: 2;
                }
                .connection-line-external {
                    fill: none;
                    stroke: black;
                    stroke-width: 2;
                    stroke-dasharray: 5,5;
                }
                .connection-label {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    fill: #333;
                }
            </style>
        `;
    }

    /**
     * Render arrow markers
     */
    private renderArrowMarkers(): string {
        return `
            <defs>
                <marker id="arrowhead" markerWidth="${C.ARROW_HEAD_LENGTH}" markerHeight="${C.ARROW_HEAD_WIDTH}"
                    refX="${C.ARROW_HEAD_LENGTH}" refY="${C.ARROW_HEAD_WIDTH / 2}" orient="auto">
                    <polygon points="0 0, ${C.ARROW_HEAD_LENGTH} ${C.ARROW_HEAD_WIDTH / 2}, 0 ${C.ARROW_HEAD_WIDTH}"
                        fill="black" />
                </marker>
            </defs>
        `;
    }

    /**
     * Render an activity box
     */
    private renderActivity(activity: any): string {
        if (!activity.position) {
            return '';
        }

        const { x, y } = activity.position;
        const dim = this.getActivityDimensions(activity);
        const centerX = x + dim.width / 2;
        const centerY = y + dim.height / 2;

        return `
            <g class="activity" data-code="${activity.code}">
                <rect class="activity-box" x="${x}" y="${y}" width="${dim.width}" height="${dim.height}" rx="0"/>
                <text class="activity-label" x="${centerX}" y="${centerY}">${this.escapeXml(activity.label)}</text>
                <text class="activity-code" x="${x + 10}" y="${y + 15}">${activity.code}</text>
            </g>
        `;
    }

    /**
     * Render a connection with path-based routing
     */
    private renderConnection(connection: any): string {
        if (!connection.path) {
            return '';
        }

        // Determine if external (dashed) or internal (solid)
        const isExternal = connection.from === 'external' || connection.to === 'external';
        const lineClass = isExternal ? 'connection-line-external' : 'connection-line';

        return `
            <g class="connection" data-type="${connection.type}" data-from="${connection.from}" data-to="${connection.to}">
                <path class="${lineClass}" d="${connection.path}" marker-end="url(#arrowhead)" />
                <text class="connection-label" x="${connection.labelPosition.x}" y="${connection.labelPosition.y}">
                    ${this.escapeXml(connection.label)}
                </text>
            </g>
        `;
    }

    /**
     * Get activity dimensions (same logic as layout engine)
     */
    private getActivityDimensions(activity: any): { width: number; height: number } {
        const inputCount = activity.inputs?.length || 0;
        const controlCount = activity.controls?.length || 0;
        const outputCount = activity.outputs?.length || 0;
        const mechanismCount = activity.mechanisms?.length || 0;

        const horizontalAnchors = Math.max(controlCount, mechanismCount);
        const labelWidth = activity.label.length * C.CHAR_WIDTH + C.LABEL_PADDING;
        const anchorWidth = horizontalAnchors > 0
            ? horizontalAnchors * C.ANCHOR_SPACING + C.BASE_MARGIN
            : 0;
        const width = Math.max(C.MIN_BOX_WIDTH, labelWidth, anchorWidth);

        const verticalAnchors = Math.max(inputCount, outputCount);
        const anchorHeight = verticalAnchors > 0
            ? verticalAnchors * C.ANCHOR_SPACING + C.BASE_MARGIN
            : 0;
        const height = Math.max(C.MIN_BOX_HEIGHT, anchorHeight);

        return { width, height };
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
