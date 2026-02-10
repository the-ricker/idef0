import { IDEF0Model, Activity, Position, LayoutResult, Connection, ArrowType } from '../types';

/**
 * Layout engine for positioning IDEF0 activities and calculating connections
 */
export class LayoutEngine {
    private readonly ACTIVITY_WIDTH = 200;
    private readonly ACTIVITY_HEIGHT = 100;
    private readonly HORIZONTAL_SPACING = 150;
    private readonly VERTICAL_SPACING = 150;
    private readonly MARGIN = 100;

    /**
     * Calculate layout for IDEF0 model
     * Uses a simple left-to-right layered layout based on dependencies
     */
    layout(model: IDEF0Model): LayoutResult {
        // Build dependency graph and assign layers
        const layers = this.assignLayers(model);

        // Position activities in layers
        const positionedActivities = this.positionActivities(layers);

        // Resolve ICOM connections
        const connections = this.resolveConnections(model, positionedActivities);

        // Calculate connection paths
        const positionedConnections = this.calculateConnectionPaths(connections, positionedActivities);

        // Calculate overall bounds
        const bounds = this.calculateBounds(positionedActivities);

        return {
            activities: positionedActivities,
            connections: positionedConnections,
            bounds
        };
    }

    /**
     * Resolve ICOM connections from the model
     * Connections are implicit based on matching codes
     */
    private resolveConnections(model: IDEF0Model, activities: Activity[]): Connection[] {
        const connections: Connection[] = [];
        const activityMap = new Map(activities.map(a => [a.code, a]));

        // Build a map of output codes to their source activities
        const outputCodeMap = new Map<string, { activity: string; label: string }>();
        for (const activity of model.activities) {
            if (activity.outputs) {
                for (const output of activity.outputs) {
                    if (output.code) {
                        outputCodeMap.set(output.code, {
                            activity: activity.code,
                            label: output.label
                        });
                    }
                }
            }
        }

        for (const activity of model.activities) {
            // Input connections
            if (activity.inputs) {
                for (const input of activity.inputs) {
                    if (input.code) {
                        // Internal connection from another activity's output
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
                        // External input
                        connections.push({
                            type: ArrowType.Input,
                            from: 'external',
                            to: activity.code,
                            label: input.label
                        });
                    }
                }
            }

            // Control connections (always external in MVP)
            if (activity.controls) {
                for (const control of activity.controls) {
                    connections.push({
                        type: ArrowType.Control,
                        from: 'external',
                        to: activity.code,
                        label: control.label
                    });
                }
            }

            // Output connections (to external if not referenced elsewhere)
            if (activity.outputs) {
                for (const output of activity.outputs) {
                    if (!output.code) {
                        // External output (no code means it goes outside)
                        connections.push({
                            type: ArrowType.Output,
                            from: activity.code,
                            to: 'external',
                            label: output.label
                        });
                    }
                    // If output has code, connection is created when referenced as input
                }
            }

            // Mechanism connections (always external in MVP)
            if (activity.mechanisms) {
                for (const mechanism of activity.mechanisms) {
                    connections.push({
                        type: ArrowType.Mechanism,
                        from: 'external',
                        to: activity.code,
                        label: mechanism.label
                    });
                }
            }
        }

        return connections;
    }

    /**
     * Assign activities to horizontal layers based on dependencies
     */
    private assignLayers(model: IDEF0Model): Map<number, Activity[]> {
        const layers = new Map<number, Activity[]>();
        const activityLayers = new Map<string, number>();

        // Build output code map to track dependencies
        const outputCodeMap = new Map<string, string>();
        for (const activity of model.activities) {
            if (activity.outputs) {
                for (const output of activity.outputs) {
                    if (output.code) {
                        outputCodeMap.set(output.code, activity.code);
                    }
                }
            }
        }

        // Find activities with no incoming dependencies
        const startActivities = model.activities.filter(activity => {
            if (!activity.inputs) {
                return true;
            }
            return !activity.inputs.some(input => input.code && outputCodeMap.has(input.code));
        });

        // Assign layer 0 to start activities
        if (startActivities.length > 0) {
            layers.set(0, startActivities);
            startActivities.forEach(a => activityLayers.set(a.code, 0));
        }

        // Assign subsequent layers using BFS
        let currentLayer = 0;
        let assigned = new Set(startActivities.map(a => a.code));
        let hasChanges = true;

        while (hasChanges && assigned.size < model.activities.length) {
            hasChanges = false;
            const nextLayer = currentLayer + 1;
            const nextActivities: Activity[] = [];

            for (const activity of model.activities) {
                if (assigned.has(activity.code)) {
                    continue;
                }

                // Check if all input dependencies are satisfied
                let allDependenciesMet = true;
                if (activity.inputs) {
                    for (const input of activity.inputs) {
                        if (input.code) {
                            const sourceActivity = outputCodeMap.get(input.code);
                            if (sourceActivity && !assigned.has(sourceActivity)) {
                                allDependenciesMet = false;
                                break;
                            }
                        }
                    }
                }

                if (allDependenciesMet) {
                    nextActivities.push(activity);
                    activityLayers.set(activity.code, nextLayer);
                    assigned.add(activity.code);
                    hasChanges = true;
                }
            }

            if (nextActivities.length > 0) {
                layers.set(nextLayer, nextActivities);
                currentLayer = nextLayer;
            }
        }

        // Assign any remaining activities to the last layer
        const unassigned = model.activities.filter(a => !assigned.has(a.code));
        if (unassigned.length > 0) {
            const lastLayer = currentLayer + 1;
            layers.set(lastLayer, unassigned);
        }

        return layers;
    }

    /**
     * Position activities within their assigned layers
     */
    private positionActivities(layers: Map<number, Activity[]>): Activity[] {
        const positioned: Activity[] = [];

        for (const [layerIndex, activities] of layers.entries()) {
            const x = this.MARGIN + layerIndex * (this.ACTIVITY_WIDTH + this.HORIZONTAL_SPACING);
            let y = this.MARGIN;

            for (const activity of activities) {
                positioned.push({
                    ...activity,
                    position: { x, y }
                });
                y += this.ACTIVITY_HEIGHT + this.VERTICAL_SPACING;
            }
        }

        return positioned;
    }

    /**
     * Calculate connection paths between activities
     */
    private calculateConnectionPaths(connections: Connection[], activities: Activity[]): Connection[] {
        const activityMap = new Map(activities.map(a => [a.code, a]));

        return connections.map(connection => {
            const fromActivity = activityMap.get(connection.from);
            const toActivity = activityMap.get(connection.to);

            const points: Position[] = [];

            if (connection.from === 'external' && toActivity) {
                // External to activity
                const to = this.getConnectionPoint(toActivity, connection.type, 'to');
                const from = this.getExternalPoint(to, connection.type);
                points.push(from, to);
            } else if (connection.to === 'external' && fromActivity) {
                // Activity to external
                const from = this.getConnectionPoint(fromActivity, connection.type, 'from');
                const to = this.getExternalPoint(from, connection.type);
                points.push(from, to);
            } else if (fromActivity && toActivity) {
                // Activity to activity
                const from = this.getConnectionPoint(fromActivity, connection.type, 'from');
                const to = this.getConnectionPoint(toActivity, connection.type, 'to');
                points.push(from, to);
            }

            return {
                ...connection,
                points
            };
        });
    }

    /**
     * Get connection point on activity based on arrow type
     */
    private getConnectionPoint(
        activity: Activity,
        arrowType: ArrowType,
        direction: 'from' | 'to'
    ): Position {
        const pos = activity.position!;
        const centerX = pos.x + this.ACTIVITY_WIDTH / 2;
        const centerY = pos.y + this.ACTIVITY_HEIGHT / 2;

        if (direction === 'from') {
            // Outputs go out the right side
            if (arrowType === ArrowType.Output) {
                return { x: pos.x + this.ACTIVITY_WIDTH, y: centerY };
            }
        } else {
            // Inputs come in the left side
            if (arrowType === ArrowType.Input) {
                return { x: pos.x, y: centerY };
            }
            // Controls come in the top
            if (arrowType === ArrowType.Control) {
                return { x: centerX, y: pos.y };
            }
            // Mechanisms come in the bottom
            if (arrowType === ArrowType.Mechanism) {
                return { x: centerX, y: pos.y + this.ACTIVITY_HEIGHT };
            }
        }

        return { x: centerX, y: centerY };
    }

    /**
     * Get external point for connections from/to outside the diagram
     */
    private getExternalPoint(activityPoint: Position, arrowType: ArrowType): Position {
        const offset = 80;

        switch (arrowType) {
            case ArrowType.Input:
                return { x: activityPoint.x - offset, y: activityPoint.y };
            case ArrowType.Control:
                return { x: activityPoint.x, y: activityPoint.y - offset };
            case ArrowType.Output:
                return { x: activityPoint.x + offset, y: activityPoint.y };
            case ArrowType.Mechanism:
                return { x: activityPoint.x, y: activityPoint.y + offset };
        }
    }

    /**
     * Calculate bounding box for the diagram
     */
    private calculateBounds(activities: Activity[]): { width: number; height: number } {
        let maxX = 0;
        let maxY = 0;

        for (const activity of activities) {
            if (activity.position) {
                maxX = Math.max(maxX, activity.position.x + this.ACTIVITY_WIDTH);
                maxY = Math.max(maxY, activity.position.y + this.ACTIVITY_HEIGHT);
            }
        }

        return {
            width: maxX + this.MARGIN,
            height: maxY + this.MARGIN
        };
    }
}
