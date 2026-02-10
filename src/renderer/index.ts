import { LayoutResult, ArrowType } from '../types';

/**
 * Renders IDEF0 diagrams as SVG
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

        // Add styles
        svgParts.push(this.renderStyles());

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
                .arrow-head {
                    fill: black;
                }
                .connection-label {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    text-anchor: middle;
                    fill: #333;
                }
            </style>
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
        const width = 200;
        const height = 100;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        return `
            <g class="activity" data-code="${activity.code}">
                <rect class="activity-box" x="${x}" y="${y}" width="${width}" height="${height}" rx="5"/>
                <text class="activity-label" x="${centerX}" y="${centerY}">${this.escapeXml(activity.label)}</text>
                <text class="activity-code" x="${x + 10}" y="${y + 20}">${activity.code}</text>
            </g>
        `;
    }

    /**
     * Render a connection
     */
    private renderConnection(connection: any): string {
        if (!connection.points || connection.points.length < 2) {
            return '';
        }

        const [from, to] = connection.points;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        // Calculate arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowHeadSize = 10;

        // Position label based on connection type
        let labelX = midX;
        let labelY = midY - 10;

        // Adjust label position for vertical connections
        if (connection.type === ArrowType.Control || connection.type === ArrowType.Mechanism) {
            labelX = midX + 40;
            labelY = midY;
        }

        return `
            <g class="connection" data-type="${connection.type}">
                <line class="connection-line"
                    x1="${from.x}" y1="${from.y}"
                    x2="${to.x}" y2="${to.y}"
                    marker-end="url(#arrowhead)"/>
                <polygon class="arrow-head"
                    points="${to.x},${to.y}
                            ${to.x - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${to.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)}
                            ${to.x - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${to.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)}"/>
                <text class="connection-label" x="${labelX}" y="${labelY}">${this.escapeXml(connection.label)}</text>
            </g>
        `;
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
