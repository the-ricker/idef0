import { IDEF0Model, Activity, Position, LayoutResult, Connection, ArrowType } from '../types';
import { LAYOUT_CONSTANTS as C } from './constants';

interface BoxDimensions {
    width: number;
    height: number;
}

interface Anchor {
    activity: string;
    type: ArrowType;
    label: string;
    position: Position;
    index: number;
}

interface RoutedConnection extends Connection {
    path: string;
    labelPosition: Position;
}

/**
 * IDEF0-compliant layout engine
 * Implements diagonal stair-step positioning and orthogonal arrow routing
 */
export class LayoutEngine {
    /**
     * Calculate layout for IDEF0 model
     */
    layout(model: IDEF0Model): LayoutResult {
        // Calculate box dimensions based on ICOM counts
        const dimensions = this.calculateBoxDimensions(model);

        // Position activities in diagonal stair-step pattern
        const positionedActivities = this.positionActivitiesStairStep(model.activities, dimensions);

        // Create anchor points for all ICOMs
        const anchors = this.createAnchors(positionedActivities, model);

        // Resolve connections from ICOM codes
        const connections = this.resolveConnections(model, positionedActivities, anchors);

        // Route connections with orthogonal paths
        const routedConnections = this.routeConnections(connections, anchors);

        // Calculate overall bounds
        const bounds = this.calculateBounds(positionedActivities, routedConnections);

        return {
            activities: positionedActivities,
            connections: routedConnections,
            bounds
        };
    }

    /**
     * Calculate box dimensions based on ICOM counts
     */
    private calculateBoxDimensions(model: IDEF0Model): Map<string, BoxDimensions> {
        const dimensions = new Map<string, BoxDimensions>();

        for (const activity of model.activities) {
            const inputCount = activity.inputs?.length || 0;
            const controlCount = activity.controls?.length || 0;
            const outputCount = activity.outputs?.length || 0;
            const mechanismCount = activity.mechanisms?.length || 0;

            // Width based on max of top/bottom anchors
            const horizontalAnchors = Math.max(controlCount, mechanismCount);
            const labelWidth = activity.label.length * C.CHAR_WIDTH + C.LABEL_PADDING;
            const anchorWidth = horizontalAnchors > 0
                ? horizontalAnchors * C.ANCHOR_SPACING + C.BASE_MARGIN
                : 0;
            const width = Math.max(C.MIN_BOX_WIDTH, labelWidth, anchorWidth);

            // Height based on max of left/right anchors
            const verticalAnchors = Math.max(inputCount, outputCount);
            const anchorHeight = verticalAnchors > 0
                ? verticalAnchors * C.ANCHOR_SPACING + C.BASE_MARGIN
                : 0;
            const height = Math.max(C.MIN_BOX_HEIGHT, anchorHeight);

            dimensions.set(activity.code, { width, height });
        }

        return dimensions;
    }

    /**
     * Position activities in diagonal stair-step pattern from top-left to bottom-right
     */
    private positionActivitiesStairStep(
        activities: Activity[],
        dimensions: Map<string, BoxDimensions>
    ): Activity[] {
        const positioned: Activity[] = [];
        let currentX = C.DIAGRAM_PADDING;
        let currentY = C.DIAGRAM_PADDING;

        for (const activity of activities) {
            const dim = dimensions.get(activity.code)!;

            positioned.push({
                ...activity,
                position: { x: currentX, y: currentY }
            });

            // Move diagonally for next box (down and right)
            currentX += dim.width + C.BASE_MARGIN;
            currentY += dim.height + C.BASE_MARGIN;
        }

        return positioned;
    }

    /**
     * Create anchor points for all ICOMs on all sides of activities
     */
    private createAnchors(
        activities: Activity[],
        model: IDEF0Model
    ): Map<string, Anchor[]> {
        const anchorMap = new Map<string, Anchor[]>();

        for (const activity of activities) {
            const pos = activity.position!;
            const dim = this.getActivityDimensions(activity);
            const anchors: Anchor[] = [];

            // Left side - Inputs
            if (activity.inputs) {
                const count = activity.inputs.length;
                const baseline = pos.y + dim.height / 2 - (C.ANCHOR_SPACING * (count - 1)) / 2;

                activity.inputs.forEach((input, index) => {
                    anchors.push({
                        activity: activity.code,
                        type: ArrowType.Input,
                        label: input.label,
                        position: { x: pos.x, y: baseline + index * C.ANCHOR_SPACING },
                        index
                    });
                });
            }

            // Top side - Controls
            if (activity.controls) {
                const count = activity.controls.length;
                const baseline = pos.x + dim.width / 2 - (C.ANCHOR_SPACING * (count - 1)) / 2;

                activity.controls.forEach((control, index) => {
                    anchors.push({
                        activity: activity.code,
                        type: ArrowType.Control,
                        label: control.label,
                        position: { x: baseline + index * C.ANCHOR_SPACING, y: pos.y },
                        index
                    });
                });
            }

            // Right side - Outputs
            if (activity.outputs) {
                const count = activity.outputs.length;
                const baseline = pos.y + dim.height / 2 - (C.ANCHOR_SPACING * (count - 1)) / 2;

                activity.outputs.forEach((output, index) => {
                    anchors.push({
                        activity: activity.code,
                        type: ArrowType.Output,
                        label: output.label,
                        position: { x: pos.x + dim.width, y: baseline + index * C.ANCHOR_SPACING },
                        index
                    });
                });
            }

            // Bottom side - Mechanisms
            if (activity.mechanisms) {
                const count = activity.mechanisms.length;
                const baseline = pos.x + dim.width / 2 - (C.ANCHOR_SPACING * (count - 1)) / 2;

                activity.mechanisms.forEach((mechanism, index) => {
                    anchors.push({
                        activity: activity.code,
                        type: ArrowType.Mechanism,
                        label: mechanism.label,
                        position: { x: baseline + index * C.ANCHOR_SPACING, y: pos.y + dim.height },
                        index
                    });
                });
            }

            anchorMap.set(activity.code, anchors);
        }

        return anchorMap;
    }

    /**
     * Resolve connections from ICOM codes
     */
    private resolveConnections(
        model: IDEF0Model,
        activities: Activity[],
        anchors: Map<string, Anchor[]>
    ): Connection[] {
        const connections: Connection[] = [];

        // Build output code map
        const outputCodeMap = new Map<string, { activity: string; index: number }>();
        for (const activity of model.activities) {
            if (activity.outputs) {
                activity.outputs.forEach((output, index) => {
                    if (output.code) {
                        outputCodeMap.set(output.code, { activity: activity.code, index });
                    }
                });
            }
        }

        // Create connections
        for (const activity of model.activities) {
            // Inputs
            if (activity.inputs) {
                activity.inputs.forEach((input, index) => {
                    if (input.code) {
                        // Internal connection
                        const source = outputCodeMap.get(input.code);
                        if (source) {
                            connections.push({
                                type: ArrowType.Input,
                                from: source.activity,
                                to: activity.code,
                                label: input.label,
                                fromCode: input.code,
                                toCode: input.code
                            });
                        }
                    } else {
                        // External connection
                        connections.push({
                            type: ArrowType.Input,
                            from: 'external',
                            to: activity.code,
                            label: input.label
                        });
                    }
                });
            }

            // Controls (always external in MVP)
            if (activity.controls) {
                activity.controls.forEach((control) => {
                    connections.push({
                        type: ArrowType.Control,
                        from: 'external',
                        to: activity.code,
                        label: control.label
                    });
                });
            }

            // Outputs without code (external)
            if (activity.outputs) {
                activity.outputs.forEach((output) => {
                    if (!output.code) {
                        connections.push({
                            type: ArrowType.Output,
                            from: activity.code,
                            to: 'external',
                            label: output.label
                        });
                    }
                });
            }

            // Mechanisms (always external in MVP)
            if (activity.mechanisms) {
                activity.mechanisms.forEach((mechanism) => {
                    connections.push({
                        type: ArrowType.Mechanism,
                        from: 'external',
                        to: activity.code,
                        label: mechanism.label
                    });
                });
            }
        }

        return connections;
    }

    /**
     * Route connections with orthogonal paths
     */
    private routeConnections(
        connections: Connection[],
        anchors: Map<string, Anchor[]>
    ): RoutedConnection[] {
        return connections.map(conn => {
            if (conn.from === 'external') {
                return this.routeExternalToActivity(conn, anchors);
            } else if (conn.to === 'external') {
                return this.routeActivityToExternal(conn, anchors);
            } else {
                return this.routeActivityToActivity(conn, anchors);
            }
        });
    }

    /**
     * Route external connection to activity (dashed line coming in)
     */
    private routeExternalToActivity(
        conn: Connection,
        anchors: Map<string, Anchor[]>
    ): RoutedConnection {
        const targetAnchors = anchors.get(conn.to)!;
        const anchor = targetAnchors.find(a => a.label === conn.label && a.type === conn.type)!;

        let startX: number;
        let startY: number;
        let path: string;

        switch (conn.type) {
            case ArrowType.Input:
                // Come in from left
                startX = anchor.position.x - C.EXTERNAL_ARROW_LENGTH;
                startY = anchor.position.y;
                path = `M ${startX} ${startY} L ${anchor.position.x} ${anchor.position.y}`;
                break;

            case ArrowType.Control:
                // Come in from top
                startX = anchor.position.x;
                startY = anchor.position.y - C.EXTERNAL_ARROW_LENGTH;
                path = `M ${startX} ${startY} L ${anchor.position.x} ${anchor.position.y}`;
                break;

            case ArrowType.Mechanism:
                // Come in from bottom
                startX = anchor.position.x;
                startY = anchor.position.y + C.EXTERNAL_ARROW_LENGTH;
                path = `M ${startX} ${startY} L ${anchor.position.x} ${anchor.position.y}`;
                break;

            default:
                // Should never happen, but needed for TypeScript
                startX = anchor.position.x;
                startY = anchor.position.y;
                path = '';
        }

        return {
            ...conn,
            path,
            labelPosition: {
                x: startX + (anchor.position.x - startX) / 2,
                y: startY + (anchor.position.y - startY) / 2 - C.LABEL_OFFSET_Y
            }
        };
    }

    /**
     * Route activity to external connection (dashed line going out)
     */
    private routeActivityToExternal(
        conn: Connection,
        anchors: Map<string, Anchor[]>
    ): RoutedConnection {
        const sourceAnchors = anchors.get(conn.from)!;
        const anchor = sourceAnchors.find(a => a.label === conn.label && a.type === ArrowType.Output)!;

        // Output goes right
        const endX = anchor.position.x + C.EXTERNAL_ARROW_LENGTH;
        const endY = anchor.position.y;
        const path = `M ${anchor.position.x} ${anchor.position.y} L ${endX} ${endY}`;

        return {
            ...conn,
            path,
            labelPosition: {
                x: anchor.position.x + C.EXTERNAL_ARROW_LENGTH / 2,
                y: anchor.position.y - C.LABEL_OFFSET_Y
            }
        };
    }

    /**
     * Route activity to activity connection (solid line with orthogonal routing)
     */
    private routeActivityToActivity(
        conn: Connection,
        anchors: Map<string, Anchor[]>
    ): RoutedConnection {
        const sourceAnchors = anchors.get(conn.from)!;
        const targetAnchors = anchors.get(conn.to)!;

        const sourceAnchor = sourceAnchors.find(
            a => a.type === ArrowType.Output &&
            (conn.fromCode ? a.label === conn.label : true)
        )!;

        const targetAnchor = targetAnchors.find(
            a => a.type === ArrowType.Input && a.label === conn.label
        )!;

        const path = this.createOrthogonalPath(sourceAnchor.position, targetAnchor.position);

        return {
            ...conn,
            path,
            labelPosition: this.calculateLabelPosition(sourceAnchor.position, targetAnchor.position)
        };
    }

    /**
     * Create orthogonal path with rounded corners
     */
    private createOrthogonalPath(from: Position, to: Position): string {
        const r = C.CORNER_RADIUS;
        const c = C.CORNER_CONTROL;

        // Calculate vertical line position (halfway between source and target)
        const xVertical = from.x + (to.x - from.x) / 2;

        // Build path with rounded corners
        let path = `M ${from.x} ${from.y}`;

        // Horizontal to near corner
        path += ` L ${xVertical - r} ${from.y}`;

        // Rounded corner (right-then-down or right-then-up)
        if (to.y > from.y) {
            // Turn down
            path += ` C ${xVertical - c} ${from.y} ${xVertical} ${from.y + c} ${xVertical} ${from.y + r}`;
        } else {
            // Turn up
            path += ` C ${xVertical - c} ${from.y} ${xVertical} ${from.y - c} ${xVertical} ${from.y - r}`;
        }

        // Vertical segment
        path += ` L ${xVertical} ${to.y > from.y ? to.y - r : to.y + r}`;

        // Rounded corner (down-then-right or up-then-right)
        if (to.y > from.y) {
            // Turn right
            path += ` C ${xVertical} ${to.y - c} ${xVertical + c} ${to.y} ${xVertical + r} ${to.y}`;
        } else {
            // Turn right
            path += ` C ${xVertical} ${to.y + c} ${xVertical + c} ${to.y} ${xVertical + r} ${to.y}`;
        }

        // Horizontal to target
        path += ` L ${to.x} ${to.y}`;

        return path;
    }

    /**
     * Calculate label position for connection
     */
    private calculateLabelPosition(from: Position, to: Position): Position {
        const xVertical = from.x + (to.x - from.x) / 2;
        const yMid = from.y + (to.y - from.y) / 2;

        return {
            x: xVertical + C.LABEL_OFFSET_X,
            y: yMid
        };
    }

    /**
     * Get activity dimensions
     */
    private getActivityDimensions(activity: Activity): BoxDimensions {
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
     * Calculate bounding box
     */
    private calculateBounds(
        activities: Activity[],
        connections: RoutedConnection[]
    ): { width: number; height: number } {
        let maxX = 0;
        let maxY = 0;

        // Check activity bounds
        for (const activity of activities) {
            const dim = this.getActivityDimensions(activity);
            const pos = activity.position!;
            maxX = Math.max(maxX, pos.x + dim.width);
            maxY = Math.max(maxY, pos.y + dim.height);
        }

        // Check external arrow bounds
        for (const conn of connections) {
            if (conn.from === 'external' || conn.to === 'external') {
                // Parse path to find extents
                const matches = conn.path.matchAll(/([ML])\s*([\d.]+)\s+([\d.]+)/g);
                for (const match of matches) {
                    const x = parseFloat(match[2]);
                    const y = parseFloat(match[3]);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        return {
            width: maxX + C.DIAGRAM_PADDING,
            height: maxY + C.DIAGRAM_PADDING
        };
    }
}
