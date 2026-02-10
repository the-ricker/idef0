import { IDEF0Model, ValidationResult, ValidationError } from '../types';

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

        // Rule 3: No duplicate activity codes
        errors.push(...this.validateUniqueActivityCodes(model));

        // Rule 4: ICOM codes that are referenced must exist
        errors.push(...this.validateICOMReferences(model));

        // Rule 5: Warn about unused output codes
        errors.push(...this.validateUnusedOutputCodes(model));

        return {
            valid: errors.filter(e => e.severity === 'error').length === 0,
            errors
        };
    }

    /**
     * Validate that each activity has at least one control
     */
    private validateActivityControls(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const activity of model.activities) {
            if (!activity.controls || activity.controls.length === 0) {
                errors.push({
                    message: `Activity "${activity.code}" (${activity.label}) must have at least one control`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that each activity has at least one output
     */
    private validateActivityOutputs(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const activity of model.activities) {
            if (!activity.outputs || activity.outputs.length === 0) {
                errors.push({
                    message: `Activity "${activity.code}" (${activity.label}) must have at least one output`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that activity codes are unique
     */
    private validateUniqueActivityCodes(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];
        const codeCounts = new Map<string, number>();

        for (const activity of model.activities) {
            codeCounts.set(activity.code, (codeCounts.get(activity.code) || 0) + 1);
        }

        for (const [code, count] of codeCounts.entries()) {
            if (count > 1) {
                errors.push({
                    message: `Duplicate activity code "${code}" found ${count} times`,
                    severity: 'error'
                });
            }
        }

        return errors;
    }

    /**
     * Validate that ICOM codes referenced in inputs exist as outputs
     */
    private validateICOMReferences(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        // Collect all output codes
        const outputCodes = new Set<string>();
        for (const activity of model.activities) {
            if (activity.outputs) {
                for (const output of activity.outputs) {
                    if (output.code) {
                        outputCodes.add(output.code);
                    }
                }
            }
        }

        // Check that all input codes reference valid outputs
        for (const activity of model.activities) {
            if (activity.inputs) {
                for (const input of activity.inputs) {
                    if (input.code && !outputCodes.has(input.code)) {
                        errors.push({
                            message: `Activity "${activity.code}": input "${input.label}" references unknown output code "${input.code}"`,
                            severity: 'error'
                        });
                    }
                }
            }
        }

        return errors;
    }

    /**
     * Warn about output codes that are never used as inputs
     */
    private validateUnusedOutputCodes(model: IDEF0Model): ValidationError[] {
        const errors: ValidationError[] = [];

        // Collect all input codes
        const inputCodes = new Set<string>();
        for (const activity of model.activities) {
            if (activity.inputs) {
                for (const input of activity.inputs) {
                    if (input.code) {
                        inputCodes.add(input.code);
                    }
                }
            }
        }

        // Check for unused output codes
        for (const activity of model.activities) {
            if (activity.outputs) {
                for (const output of activity.outputs) {
                    if (output.code && !inputCodes.has(output.code)) {
                        errors.push({
                            message: `Activity "${activity.code}": output "${output.label}" with code "${output.code}" is never used as an input`,
                            severity: 'warning'
                        });
                    }
                }
            }
        }

        return errors;
    }
}
