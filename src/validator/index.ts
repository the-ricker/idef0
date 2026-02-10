import { IDEF0Model, ValidationResult, ValidationError, ArrowType } from '../types';

/**
 * Validates IDEF0 models against semantic rules
 */
export class Validator {
    /**
     * Validate an IDEF0 model
     */
    validate(model: IDEF0Model): ValidationResult {
        const errors: ValidationError[] = [];

        // Rule 1: Every activity must have at least one control
        errors.push(...this.validateActivityControls(model));

        // Rule 2: Every activity must have at least one output
        errors.push(...this.validateActivityOutputs(model));

        // Rule 3: Arrow connections must reference valid activities
        errors.push(...this.validateArrowConnections(model));

        // Rule 4: No duplicate activity IDs
        errors.push(...this.validateUniqueActivityIds(model));

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate that each activity has at least one control arrow
     */
    private validateActivityControls(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const activity of model.activities) {
            const hasControl = model.arrows.some(
                arrow => arrow.type === ArrowType.Control && arrow.to === activity.id
            );

            if (!hasControl) {
                errors.push({
                    message: `Activity "${activity.id}" (${activity.label}) must have at least one control arrow`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that each activity has at least one output arrow
     */
    private validateActivityOutputs(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const activity of model.activities) {
            const hasOutput = model.arrows.some(
                arrow => arrow.type === ArrowType.Output && arrow.from === activity.id
            );

            if (!hasOutput) {
                errors.push({
                    message: `Activity "${activity.id}" (${activity.label}) must have at least one output arrow`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that arrow connections reference valid activities or 'external'
     */
    private validateArrowConnections(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];
        const activityIds = new Set(model.activities.map(a => a.id));

        for (const arrow of model.arrows) {
            if (arrow.from !== 'external' && !activityIds.has(arrow.from)) {
                errors.push({
                    message: `Arrow "${arrow.label}" references unknown activity "${arrow.from}" in "from" field`,
                    severity: 'error'
                });
            }

            if (arrow.to !== 'external' && !activityIds.has(arrow.to)) {
                errors.push({
                    message: `Arrow "${arrow.label}" references unknown activity "${arrow.to}" in "to" field`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that activity IDs are unique
     */
    private validateUniqueActivityIds(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];
        const idCounts = new Map<string, number>();

        for (const activity of model.activities) {
            idCounts.set(activity.id, (idCounts.get(activity.id) || 0) + 1);
        }

        for (const [id, count] of idCounts.entries()) {
            if (count > 1) {
                errors.push({
                    message: `Duplicate activity ID "${id}" found ${count} times`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }
}
