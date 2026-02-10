import { IDEF0Model, Activity, Arrow, Position, LayoutResult, ArrowType } from '../types';

/**
 * Layout engine for positioning IDEF0 activities and arrows
 */
export class LayoutEngine {
    private readonly ACTIVITY_WIDTH = 200;
    private readonly ACTIVITY_HEIGHT = 100;
    private readonly HORIZONTAL_SPACING = 150;
    private readonly VERTICAL_SPACING = 150;
    private readonly MARGIN = 100;

    /**
     * Calculate layout for IDEF0 model
     * Uses a simple left-to-right layered layout based on arrow dependencies
     */
    layout(model: IDEF0Model): LayoutResult {
        // Build dependency graph
        const layers = this.assignLayers(model);

        // Position activities in layers
        const positionedActivities = this.positionActivities(layers);

        // Calculate arrow paths
        const positionedArrows = this.calculateArrowPaths(model.arrows, positionedActivities);

        // Calculate overall bounds
        const bounds = this.calculateBounds(positionedActivities);

        return {
            activities: positionedActivities,
            arrows: positionedArrows,
            bounds
        };
    }

    /**
     * Assign activities to horizontal layers based on dependencies
     */
    private assignLayers(model: IDEF0Model): Map<number, Activity[]> {
        const layers = new Map<number, Activity[]>();
        const activityLayers = new Map<string, number>();
        const activityMap = new Map(model.activities.map(a => [a.id, a]));

        // Start with activities that have no incoming non-external arrows
        const startActivities = model.activities.filter(activity => {
            const hasIncoming = model.arrows.some(
                arrow => arrow.to === activity.id && arrow.from !== 'external'
            );
            return !hasIncoming;
        });

        // Assign layer 0 to start activities
        if (startActivities.length > 0) {
            layers.set(0, startActivities);
            startActivities.forEach(a => activityLayers.set(a.id, 0));
        }

        // Assign subsequent layers using BFS
        let currentLayer = 0;
        let assigned = new Set(startActivities.map(a => a.id));
        let hasChanges = true;

        while (hasChanges && assigned.size < model.activities.length) {
            hasChanges = false;
            const nextLayer = currentLayer + 1;
            const nextActivities: Activity[] = [];

            // Find activities whose inputs are all in previous layers
            for (const activity of model.activities) {
                if (assigned.has(activity.id)) {
                    continue;
                }

                const incomingArrows = model.arrows.filter(
                    arrow => arrow.to === activity.id && arrow.from !== 'external'
                );

                const allInputsAssigned = incomingArrows.every(
                    arrow => assigned.has(arrow.from)
                );

                if (allInputsAssigned) {
                    nextActivities.push(activity);
                    activityLayers.set(activity.id, nextLayer);
                    assigned.add(activity.id);
                    hasChanges = true;
                }
            }

            if (nextActivities.length > 0) {
                layers.set(nextLayer, nextActivities);
                currentLayer = nextLayer;
            }
        }

        // Assign any remaining activities to the last layer
        const unassigned = model.activities.filter(a => !assigned.has(a.id));
        if (unassigned.length > 0) {
            const lastLayer = currentLayer + 1;
            layers.set(lastLayer, unassigned);
            unassigned.forEach(a => activityLayers.set(a.id, lastLayer));
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

            // Center activities vertically in their layer
            const totalHeight = activities.length * this.ACTIVITY_HEIGHT +
                               (activities.length - 1) * this.VERTICAL_SPACING;
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
     * Calculate arrow paths between activities
     */
    private calculateArrowPaths(arrows: Arrow[], activities: Activity[]): Arrow[] {
        const activityMap = new Map(activities.map(a => [a.id, a]));

        return arrows.map(arrow => {
            const fromActivity = activityMap.get(arrow.from);
            const toActivity = activityMap.get(arrow.to);

            const points: Position[] = [];

            if (fromActivity && toActivity) {
                // Calculate connection points based on arrow type
                const from = this.getConnectionPoint(fromActivity, arrow.type, 'from');
                const to = this.getConnectionPoint(toActivity, arrow.type, 'to');
                points.push(from, to);
            }

            return {
                ...arrow,
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

        // Default to center
        return { x: centerX, y: centerY };
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
