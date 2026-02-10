import * as yaml from 'js-yaml';
import { IDEF0Model, ArrowType } from '../types';

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
            activities: [],
            arrows: []
        };

        // Validate activities
        if (!data.activities || !Array.isArray(data.activities)) {
            throw new Error('Missing or invalid "activities" array');
        }

        model.activities = data.activities.map((activity: any, index: number) => {
            if (!activity.id || typeof activity.id !== 'string') {
                throw new Error(`Activity at index ${index} missing valid "id"`);
            }
            if (!activity.label || typeof activity.label !== 'string') {
                throw new Error(`Activity "${activity.id}" missing valid "label"`);
            }
            return {
                id: activity.id,
                label: activity.label
            };
        });

        // Validate arrows
        if (!data.arrows || !Array.isArray(data.arrows)) {
            throw new Error('Missing or invalid "arrows" array');
        }

        model.arrows = data.arrows.map((arrow: any, index: number) => {
            if (!arrow.type || !Object.values(ArrowType).includes(arrow.type)) {
                throw new Error(`Arrow at index ${index} has invalid "type". Must be one of: input, control, output, mechanism`);
            }
            if (!arrow.from || typeof arrow.from !== 'string') {
                throw new Error(`Arrow at index ${index} missing valid "from"`);
            }
            if (!arrow.to || typeof arrow.to !== 'string') {
                throw new Error(`Arrow at index ${index} missing valid "to"`);
            }
            if (!arrow.label || typeof arrow.label !== 'string') {
                throw new Error(`Arrow at index ${index} missing valid "label"`);
            }
            return {
                type: arrow.type as ArrowType,
                from: arrow.from,
                to: arrow.to,
                label: arrow.label
            };
        });

        return model;
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
