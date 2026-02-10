import * as yaml from 'js-yaml';
import { IDEF0Model, Activity, ICOM } from '../types';

/**
 * Parses YAML content into an IDEF0 model
 */
export class Parser {
    /**
     * Parse YAML text into IDEF0Model
     * @param content YAML content as string
     * @returns Parsed IDEF0Model
     * @throws Error if YAML is invalid or model is malformed
     */
    parse(content: string): IDEF0Model {
        try {
            const rawData = yaml.load(content) as any;

            if (!rawData) {
                throw new Error('Empty or invalid YAML document');
            }

            return this.validateAndTransform(rawData);
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`YAML parsing failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Validate and transform raw YAML data into typed model
     */
    private validateAndTransform(data: any): IDEF0Model {
        const model: IDEF0Model = {
            metadata: data.metadata,
            activities: []
        };

        // Validate activities
        if (!data.activities || !Array.isArray(data.activities)) {
            throw new Error('Missing or invalid "activities" array');
        }

        model.activities = data.activities.map((activity: any, index: number) => {
            if (!activity.code || typeof activity.code !== 'string') {
                throw new Error(`Activity at index ${index} missing valid "code"`);
            }
            if (!activity.label || typeof activity.label !== 'string') {
                throw new Error(`Activity "${activity.code}" missing valid "label"`);
            }

            return {
                code: activity.code,
                label: activity.label,
                inputs: this.parseICOMArray(activity.inputs, 'inputs', activity.code),
                controls: this.parseICOMArray(activity.controls, 'controls', activity.code),
                outputs: this.parseICOMArray(activity.outputs, 'outputs', activity.code),
                mechanisms: this.parseICOMArray(activity.mechanisms, 'mechanisms', activity.code)
            };
        });

        return model;
    }

    /**
     * Parse and validate an ICOM array
     */
    private parseICOMArray(
        data: any,
        fieldName: string,
        activityCode: string
    ): ICOM[] | undefined {
        if (!data) {
            return undefined;
        }

        if (!Array.isArray(data)) {
            throw new Error(`Activity "${activityCode}": "${fieldName}" must be an array`);
        }

        return data.map((icom: any, index: number) => {
            if (!icom.label || typeof icom.label !== 'string') {
                throw new Error(
                    `Activity "${activityCode}": ${fieldName}[${index}] missing valid "label"`
                );
            }

            const result: ICOM = { label: icom.label };

            if (icom.code) {
                if (typeof icom.code !== 'string') {
                    throw new Error(
                        `Activity "${activityCode}": ${fieldName}[${index}] "code" must be a string`
                    );
                }
                result.code = icom.code;
            }

            return result;
        });
    }

    /**
     * Serialize IDEF0Model back to YAML
     */
    serialize(model: IDEF0Model): string {
        return yaml.dump(model, {
            indent: 2,
            lineWidth: 80,
            noRefs: true
        });
    }
}
