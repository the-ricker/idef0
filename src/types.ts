/**
 * Type definitions for IDEF0 models
 */

/**
 * Arrow/ICOM types in IDEF0
 */
export enum ArrowType {
    Input = 'input',
    Control = 'control',
    Output = 'output',
    Mechanism = 'mechanism'
}

/**
 * Metadata for the diagram
 */
export interface Metadata {
    title?: string;
    author?: string;
    version?: string;
    description?: string;
}

/**
 * An activity/function box in IDEF0
 */
export interface Activity {
    id: string;
    label: string;
    position?: Position;  // Calculated by layout engine
}

/**
 * An arrow connecting activities or external entities
 */
export interface Arrow {
    type: ArrowType;
    from: string;  // Activity ID or 'external'
    to: string;    // Activity ID or 'external'
    label: string;
    points?: Position[];  // Calculated by layout engine
}

/**
 * Position coordinates
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * Complete IDEF0 diagram model
 */
export interface IDEF0Model {
    metadata?: Metadata;
    activities: Activity[];
    arrows: Arrow[];
}

/**
 * Validation error
 */
export interface ValidationError {
    message: string;
    line?: number;
    column?: number;
    severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * Layout result with positioned elements
 */
export interface LayoutResult {
    activities: Activity[];
    arrows: Arrow[];
    bounds: {
        width: number;
        height: number;
    };
}

/**
 * Export options
 */
export interface ExportOptions {
    format: 'svg' | 'png';
    scale?: number;
    width?: number;
    height?: number;
}
