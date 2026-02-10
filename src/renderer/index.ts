import { LayoutResult, ArrowType } from '../types';

/**
 * Renders IDEF0 diagrams as SVG
 */
export class Renderer {
    /**
     * Render layout result to SVG string
     */
    render(layout: LayoutResult): string {
        const { activities, arrows, bounds } = layout;

        const svgParts: string[] = [];

        // SVG header
        svgParts.push(
            `<svg xmlns="http://www.w3.org/2000/svg" `,
            `width="${bounds.width}" height="${bounds.height}" `,
            `viewBox="0 0 ${bounds.width} ${bounds.height}">`
        );

        // Add styles
        svgParts.push(this.renderStyles());

        // Render arrows first (so they appear behind activities)
        svgParts.push('<g class="arrows">');
        for (const arrow of arrows) {
            svgParts.push(this.renderArrow(arrow, activities));
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
                .arrow {
                    fill: none;
                    stroke: black;
                    stroke-width: 2;
                }
                .arrow-head {
                    fill: black;
                }
                .arrow-label {
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    text-anchor: middle;
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
            <g class="activity" data-id="${activity.id}">
                <rect class="activity-box" x="${x}" y="${y}" width="${width}" height="${height}" rx="5"/>
                <text class="activity-label" x="${centerX}" y="${centerY}">${this.escapeXml(activity.label)}</text>
                <text class="activity-id" x="${x + 10}" y="${y + 20}" font-size="10" fill="#666">${activity.id}</text>
            </g>
        `;
    }

    /**
     * Render an arrow
     */
    private renderArrow(arrow: any, activities: any[]): string {
        // Handle external connections
        if (!arrow.points || arrow.points.length < 2) {
            return this.renderExternalArrow(arrow, activities);
        }

        const [from, to] = arrow.points;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        // Calculate arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowHeadSize = 10;

        return `
            <g class="arrow" data-type="${arrow.type}">
                <line class="arrow" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>
                <polygon class="arrow-head"
                    points="${to.x},${to.y}
                            ${to.x - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${to.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)}
                            ${to.x - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${to.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)}"/>
                <text class="arrow-label" x="${midX}" y="${midY - 10}">${this.escapeXml(arrow.label)}</text>
            </g>
        `;
    }

    /**
     * Render external arrow (from/to external)
     */
    private renderExternalArrow(arrow: any, activities: any[]): string {
        const activity = activities.find(a =>
            a.id === (arrow.from !== 'external' ? arrow.from : arrow.to)
        );

        if (!activity || !activity.position) {
            return '';
        }

        const { x, y } = activity.position;
        const width = 200;
        const height = 100;
        const isInput = arrow.to !== 'external';

        let x1, y1, x2, y2;

        switch (arrow.type) {
            case ArrowType.Input:
                x2 = x;
                y2 = y + height / 2;
                x1 = x - 80;
                y1 = y2;
                break;
            case ArrowType.Control:
                x2 = x + width / 2;
                y2 = y;
                x1 = x2;
                y1 = y - 80;
                break;
            case ArrowType.Output:
                x1 = x + width;
                y1 = y + height / 2;
                x2 = x1 + 80;
                y2 = y1;
                break;
            case ArrowType.Mechanism:
                x2 = x + width / 2;
                y2 = y + height;
                x1 = x2;
                y1 = y2 + 80;
                break;
            default:
                return '';
        }

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowHeadSize = 10;

        return `
            <g class="arrow" data-type="${arrow.type}">
                <line class="arrow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>
                <polygon class="arrow-head"
                    points="${x2},${y2}
                            ${x2 - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${y2 - arrowHeadSize * Math.sin(angle - Math.PI / 6)}
                            ${x2 - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${y2 - arrowHeadSize * Math.sin(angle + Math.PI / 6)}"/>
                <text class="arrow-label" x="${midX}" y="${midY - 10}">${this.escapeXml(arrow.label)}</text>
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
